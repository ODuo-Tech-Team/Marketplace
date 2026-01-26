import { FileText, X, Check, Loader2 } from 'lucide-react'
import type { Proposta } from '../../contexts/AppContext'

interface PropostaRecebidaCardProps {
  proposta: Proposta
  onAceitar: () => void
  onRecusar: () => void
  respondendo: boolean
}

export function PropostaRecebidaCard({
  proposta,
  onAceitar,
  onRecusar,
  respondendo
}: PropostaRecebidaCardProps) {
  return (
    <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-green-600" />
        Proposta Recebida
      </h3>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor da Diária</span>
            <span className="text-base font-bold text-gray-800">
              R$ {proposta.valor_diaria?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Quantidade de Dias</span>
            <span className="text-base font-bold text-gray-800">
              {proposta.quantidade_dias || 0} dias
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor do Frete</span>
            <span className="text-base font-bold text-gray-800">
              R$ {proposta.valor_frete?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="h-px bg-gray-200 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-700">Valor Total</span>
            <span className="text-2xl font-bold text-green-600">
              R$ {proposta.valor_total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRecusar}
            disabled={respondendo}
            className="flex-1 py-4 bg-red-100 text-red-700 text-lg font-bold rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <X className="w-6 h-6" />
            Recusar
          </button>
          <button
            onClick={onAceitar}
            disabled={respondendo}
            className="flex-1 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {respondendo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
            Aceitar
          </button>
        </div>
      </div>
    </div>
  )
}
