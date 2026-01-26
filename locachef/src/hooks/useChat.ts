import { useEffect, useState, useRef, useCallback } from 'react'
import { useApp, type Mensagem, type Chat } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseChatReturn {
  chat: Chat | null
  mensagens: Mensagem[]
  loading: boolean
  carregarChat: () => Promise<void>
  carregarMensagens: () => Promise<void>
}

export function useChat(chatId: string | undefined): UseChatReturn {
  const { user } = useAuth()
  const { fetchMensagens, fetchChat, marcarMensagensComoLidas } = useApp()

  const [chat, setChat] = useState<Chat | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const carregarChat = useCallback(async () => {
    if (!chatId || !mountedRef.current) return
    try {
      const chatData = await fetchChat(chatId)
      if (mountedRef.current) {
        setChat(chatData)
      }
    } catch (err) {
      console.error('[useChat] Erro ao carregar chat:', err)
    }
  }, [chatId, fetchChat])

  const carregarMensagens = useCallback(async () => {
    if (!chatId || !mountedRef.current) return
    try {
      const msgs = await fetchMensagens(chatId)
      if (!mountedRef.current) return

      setMensagens(msgs)

      if (user?.id) {
        marcarMensagensComoLidas(chatId, user.id)
      }

      if (mountedRef.current) {
        setLoading(false)
      }
    } catch (err) {
      console.error('[useChat] Erro ao carregar mensagens:', err)
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [chatId, fetchMensagens, marcarMensagensComoLidas, user?.id])

  useEffect(() => {
    mountedRef.current = true
    setChat(null)
    setMensagens([])
    setLoading(true)

    if (!chatId) return

    carregarChat()
    carregarMensagens()

    const channel: RealtimeChannel = supabase
      .channel(`mensagens-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          if (!mountedRef.current) return

          const novaMsgRealtime = payload.new as Mensagem

          setMensagens((prev) => {
            const jaExiste = prev.some((m) => m.id === novaMsgRealtime.id)
            if (jaExiste) return prev
            return [...prev, novaMsgRealtime]
          })

          if (user?.id && novaMsgRealtime.sender_id !== user.id) {
            marcarMensagensComoLidas(chatId, user.id)
          }
        }
      )
      .subscribe()

    const propostasChannel: RealtimeChannel = supabase
      .channel(`propostas-chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'propostas' },
        async (payload) => {
          if (!mountedRef.current) return
          if (chat?.equipamento?.id === (payload.new as { equipamento_id: string }).equipamento_id) {
            await carregarChat()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'propostas' },
        async (payload) => {
          if (!mountedRef.current) return
          if (chat?.equipamento?.id === (payload.new as { equipamento_id: string }).equipamento_id) {
            await carregarChat()
          }
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      if (chatId && mountedRef.current) {
        carregarChat()
      }
    }, 5000)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
      supabase.removeChannel(channel)
      supabase.removeChannel(propostasChannel)
    }
  }, [chatId, carregarChat, carregarMensagens, chat?.equipamento?.id, marcarMensagensComoLidas, user?.id])

  return {
    chat,
    mensagens,
    loading,
    carregarChat,
    carregarMensagens
  }
}
