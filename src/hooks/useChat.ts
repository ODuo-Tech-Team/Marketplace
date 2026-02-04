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

  // Refs para funções instáveis do contexto — evita re-run do useEffect
  const fetchChatRef = useRef(fetchChat)
  const fetchMensagensRef = useRef(fetchMensagens)
  const marcarLidasRef = useRef(marcarMensagensComoLidas)
  const userIdRef = useRef(user?.id)

  fetchChatRef.current = fetchChat
  fetchMensagensRef.current = fetchMensagens
  marcarLidasRef.current = marcarMensagensComoLidas
  userIdRef.current = user?.id

  const carregarChat = useCallback(async () => {
    if (!chatId || !mountedRef.current) return

    const MAX_RETRIES = 8
    const BASE_RETRY_DELAY = 600

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const chatData = await fetchChatRef.current(chatId)

        if (chatData && mountedRef.current) {
          setChat(chatData)
          return
        }

        if (!chatData && attempt < MAX_RETRIES && mountedRef.current) {
          const delay = BASE_RETRY_DELAY + (attempt * 200)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (err) {
        if (attempt < MAX_RETRIES && mountedRef.current) {
          const delay = BASE_RETRY_DELAY + (attempt * 200)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    if (mountedRef.current) {
      setChat(null)
    }
  }, [chatId])

  const carregarMensagens = useCallback(async () => {
    if (!chatId || !mountedRef.current) return
    try {
      const msgs = await fetchMensagensRef.current(chatId)
      if (!mountedRef.current) return

      setMensagens(msgs)

      const uid = userIdRef.current
      if (uid) {
        marcarLidasRef.current(chatId, uid)
      }

      if (mountedRef.current) {
        setLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [chatId])

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

          // Atualiza mensagens imediatamente
          setMensagens((prev) => {
            const jaExiste = prev.some((m) => m.id === novaMsgRealtime.id)
            if (jaExiste) return prev
            return [...prev, novaMsgRealtime]
          })

          const uid = userIdRef.current
          if (uid && novaMsgRealtime.sender_id !== uid) {
            marcarLidasRef.current(chatId, uid)
          }

          // Sempre recarrega o chat para atualizar última mensagem
          await carregarChat()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens',
          filter: `chat_id=eq.${chatId}`
        },
        async () => {
          if (!mountedRef.current) return
          // Recarrega mensagens quando houver update (ex: lida=true)
          await carregarMensagens()
        }
      )
      .subscribe()

    const propostasChannel: RealtimeChannel = supabase
      .channel(`propostas-chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'propostas' },
        async () => {
          if (!mountedRef.current) return
          await carregarChat()
        }
      )
      .subscribe()

    const chatUpdateChannel: RealtimeChannel = supabase
      .channel(`chat-update-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chats', filter: `id=eq.${chatId}` },
        async () => {
          if (!mountedRef.current) return
          await carregarChat()
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
      supabase.removeChannel(chatUpdateChannel)
    }
  }, [chatId, carregarChat, carregarMensagens])

  return {
    chat,
    mensagens,
    loading,
    carregarChat,
    carregarMensagens
  }
}
