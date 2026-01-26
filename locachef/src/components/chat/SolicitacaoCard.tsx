import { FileText, MapPin } from 'lucide-react'
import type { Chat } from '../../contexts/AppContext'

interface SolicitacaoCardProps {
  chat: Chat
  isLocador: boolean
}

export function SolicitacaoCard({ chat, isLocador }: SolicitacaoCardProps) {
  if (!chat.quantidade_dias) return null

  const colorClass = isLocador
    ? 'from-amber-50 to-orange-50 border-amber-300'
    : 'from-blue-50 to-indigo-50 border-blue-300'

  const iconColorClass = isLocador ? 'text-amber-600' : 'text-blue-600'
  const bgColorClass = isLocador ? 'bg-amber-100' : 'bg-blue-100'

  return (
    <div className={`mb-6 bg-gradient-to-br ${colorClass} border-2 rounded-2xl p-6 shadow-lg`}>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className={`w-6 h-6 ${iconColorClass}`} />
        {isLocador ? 'Dados da Solicitação do Cliente' : 'Sua Solicitação'}
      </h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${bgColorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <span className="text-2xl">📅</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Período solicitado</p>
            <p className="text-lg font-bold text-gray-800">{chat.quantidade_dias} dias</p>
          </div>
        </div>

        {chat.endereco_entrega_logradouro && (
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 ${bgColorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <MapPin className={`w-5 h-5 ${iconColorClass}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Local de Entrega</p>
              <p className="text-base font-medium text-gray-800">
                {chat.endereco_entrega_logradouro}
              </p>
              <p className="text-sm text-gray-600">
                CEP: {chat.endereco_entrega_cep} - {chat.endereco_entrega_cidade}/
                {chat.endereco_entrega_uf}
              </p>
            </div>
          </div>
        )}

        {!isLocador && !chat.proposta && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⏳ Aguardando o locador enviar uma proposta com valores...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
