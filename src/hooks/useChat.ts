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

    // Retry logic: tenta até 8 vezes com delay progressivo
    const MAX_RETRIES = 8
    const BASE_RETRY_DELAY = 600

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const chatData = await fetchChat(chatId)

        if (chatData && mountedRef.current) {
          setChat(chatData)
          return
        }

        // Se não encontrou o chat e não é a última tentativa, aguarda antes de tentar novamente
        if (!chatData && attempt < MAX_RETRIES && mountedRef.current) {
          // Delay progressivo: 600ms, 800ms, 1000ms...
          const delay = BASE_RETRY_DELAY + (attempt * 200)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (err) {
        console.error(`[useChat] Erro ao carregar chat (tentativa ${attempt}/${MAX_RETRIES}):`, err)

        // Se não é a última tentativa, aguarda antes de tentar novamente
        if (attempt < MAX_RETRIES && mountedRef.current) {
          const delay = BASE_RETRY_DELAY + (attempt * 200)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // Se chegou aqui, esgotou todas as tentativas sem sucesso
    console.warn('[useChat] Não foi possível carregar o chat após todas as tentativas')
    if (mountedRef.current) {
      setChat(null)
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
          const novaProposta = payload.new as { equipamento_id: string; status: string }

          if (chat?.equipamento?.id === novaProposta.equipamento_id) {
            await carregarChat()

            if (novaProposta.status === 'aceita') {
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }, 300)
            }
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
