import { FileText, MapPin } from 'lucide-react'
import type { Chat } from '../../contexts/AppContext'

interface SolicitacaoCardProps {
  chat: Chat
  isLocador: boolean
  equipamentoPreco?: number | null
  equipamentoNome?: string | null
}

export function SolicitacaoCard({ chat, isLocador, equipamentoPreco, equipamentoNome }: SolicitacaoCardProps) {
  if (!chat.quantidade_dias) return null

  return (
    <div className="mb-6 bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 shadow-lg shadow-indigo-500/5">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        {isLocador ? 'Dados da Solicitação do Cliente' : 'Sua Solicitação'}
      </h3>

      <div className="space-y-3">
        {/* Equipamento + Valor */}
        {equipamentoPreco && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏗️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{equipamentoNome || 'Equipamento'}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">R$ {equipamentoPreco.toFixed(2)}/dia</p>
              {chat.quantidade_dias && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Estimativa: R$ {(equipamentoPreco * chat.quantidade_dias).toFixed(2)} ({chat.quantidade_dias} dias)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Periodo */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📅</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Período solicitado</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{chat.quantidade_dias} dias</p>
          </div>
        </div>

        {/* Endereco */}
        {chat.endereco_entrega_logradouro && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Local de Entrega</p>
              <p className="text-base font-medium text-slate-900 dark:text-white">
                {chat.endereco_entrega_logradouro}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                CEP: {chat.endereco_entrega_cep} - {chat.endereco_entrega_cidade}/
                {chat.endereco_entrega_uf}
              </p>
            </div>
          </div>
        )}

        {!isLocador && !chat.proposta && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              ⏳ Aguardando o locador enviar uma proposta com valores...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
