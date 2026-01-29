import { forwardRef } from 'react'
import type { Mensagem } from '../../contexts/AppContext'
import { formatarHora, formatarData, normalizeId, SYSTEM_SENDER_ID } from '../../utils/chat'

interface ChatMessagesProps {
  mensagens: Mensagem[]
  userId: string
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ mensagens, userId }, ref) => {
    const mensagensAgrupadas = mensagens.reduce((acc, msg) => {
      const data = formatarData(msg.created_at)
      if (!acc[data]) {
        acc[data] = []
      }
      acc[data].push(msg)
      return acc
    }, {} as Record<string, Mensagem[]>)

    if (mensagens.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500">
          Nenhuma mensagem ainda. Inicie a conversa!
        </div>
      )
    }

    return (
      <>
        {Object.entries(mensagensAgrupadas).map(([data, msgs]) => (
          <div key={data}>
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                {data}
              </span>
            </div>

            {msgs.map((msg) => {
              const isMe = normalizeId(msg.sender_id) === userId
              const isSystemById = normalizeId(msg.sender_id) === normalizeId(SYSTEM_SENDER_ID)
              const isSystemByContent =
                msg.texto.startsWith('✅') ||
                msg.texto.includes('Locação confirmada') ||
                msg.texto.startsWith('❌') ||
                msg.texto.includes('Proposta recusada')
              const isSystemMessage = isSystemById || isSystemByContent

              if (isSystemMessage) {
                return (
                  <div key={`msg-${msg.id}`} className="flex justify-center my-4">
                    <p className="text-xs text-gray-500 italic text-center max-w-[90%]">
                      {msg.texto}
                    </p>
                  </div>
                )
              }

              return (
                <div
                  key={`msg-${msg.id}`}
                  className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      isMe
                        ? 'bg-orange-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.texto}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
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
