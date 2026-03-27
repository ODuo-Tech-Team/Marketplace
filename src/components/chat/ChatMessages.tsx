import { forwardRef } from 'react'
import type { Mensagem } from '../../contexts/AppContext'
import { formatarHora, formatarData, normalizeId, isSystemMessage as checkSystemMessage } from '../../utils/chat'

interface ChatMessagesProps {
  mensagens: Mensagem[]
  userId: string
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ mensagens, userId }, ref) => {
    // Filtra mensagens de sistema — status é exibido na ChatStatusBar
    const mensagensFiltradas = mensagens.filter(msg => !checkSystemMessage(msg.sender_id, msg.texto))

    const mensagensAgrupadas = mensagensFiltradas.reduce((acc, msg) => {
      const data = formatarData(msg.created_at)
      if (!acc[data]) {
        acc[data] = []
      }
      acc[data].push(msg)
      return acc
    }, {} as Record<string, Mensagem[]>)

    if (mensagensFiltradas.length === 0) {
      return (
        <div className="text-center py-16 text-foreground-muted">
          Nenhuma mensagem ainda. Inicie a conversa!
        </div>
      )
    }

    return (
      <>
        {Object.entries(mensagensAgrupadas).map(([data, msgs]) => (
          <div key={data}>
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-surface-elevated text-foreground-muted text-xs rounded-full border border-border">
                {data}
              </span>
            </div>

            {msgs.map((msg) => {
              const isMe = normalizeId(msg.sender_id) === userId

              return (
                <div
                  key={`msg-${msg.id}`}
                  className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      isMe
                        ? 'bg-bubble-me text-bubble-me-text rounded-tr-sm shadow-md shadow-indigo-500/20'
                        : 'bg-bubble-other text-bubble-other-text rounded-tl-sm border border-border shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.texto}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-foreground-muted'}`}>
                      {formatarHora(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={ref} />
      </>
    )
  }
)

ChatMessages.displayName = 'ChatMessages'
