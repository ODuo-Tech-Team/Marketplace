import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Mensagem } from '../types'

interface NotificacaoContextType {
  mensagensNaoLidas: number
  fetchMensagensNaoLidas: (userId: string) => Promise<number>
  marcarMensagensComoLidas: (chatId: string, userId: string) => Promise<void>
  setupMensagensRealtime: (userId: string) => void
}

const NotificacaoContext = createContext<NotificacaoContextType | undefined>(undefined)

export function NotificacaoProvider({ children }: { children: ReactNode }) {
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0)
  const mensagensChannelRef = useRef<RealtimeChannel | null>(null)
  const currentUserIdRef = useRef<string | null>(null)

  const fetchMensagensNaoLidas = useCallback(async (userId: string): Promise<number> => {
    try {
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .or(`locador_id.eq.${userId},locatario_id.eq.${userId}`)

      if (chatsError || !chats || chats.length === 0) {
        setMensagensNaoLidas(0)
        return 0
      }

      const chatIds = chats.map(c => c.id)

      const { data: mensagensNaoLidasData, error } = await supabase
        .from('mensagens')
        .select('chat_id')
        .in('chat_id', chatIds)
        .neq('sender_id', userId)
        .or('lida.is.null,lida.eq.false')

      if (error) {
        setMensagensNaoLidas(0)
        return 0
      }

      const chatsComMensagensNaoLidas = new Set(mensagensNaoLidasData?.map(m => m.chat_id) || [])
      const totalChatsNaoLidos = chatsComMensagensNaoLidas.size

      setMensagensNaoLidas(totalChatsNaoLidos)
      return totalChatsNaoLidos
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro ao buscar mensagens nao lidas:', err)
      setMensagensNaoLidas(0)
      return 0
    }
  }, [])

  const marcarMensagensComoLidas = useCallback(async (chatId: string, userId: string): Promise<void> => {
    try {
      await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('lida', false)

      await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .is('lida', null)

      await fetchMensagensNaoLidas(userId)
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro ao marcar mensagens como lidas:', err)
    }
  }, [fetchMensagensNaoLidas])

  const setupMensagensRealtime = useCallback((userId: string) => {
    if (mensagensChannelRef.current) {
      supabase.removeChannel(mensagensChannelRef.current)
    }

    currentUserIdRef.current = userId

    const channel = supabase
      .channel('mensagens-nao-lidas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens' },
        async (payload) => {
          const novaMensagem = payload.new as Mensagem
          if (novaMensagem.sender_id !== currentUserIdRef.current) {
            if (currentUserIdRef.current) {
              await fetchMensagensNaoLidas(currentUserIdRef.current)
            }
          }
        }
      )
      .subscribe()

    mensagensChannelRef.current = channel
  }, [fetchMensagensNaoLidas])

  return (
    <NotificacaoContext.Provider
      value={{
        mensagensNaoLidas,
        fetchMensagensNaoLidas,
        marcarMensagensComoLidas,
        setupMensagensRealtime,
      }}
    >
      {children}
    </NotificacaoContext.Provider>
  )
}

export function useNotificacoes() {
  const context = useContext(NotificacaoContext)
  if (context === undefined) {
    throw new Error('useNotificacoes must be used within an NotificacaoProvider')
  }
  return context
}
