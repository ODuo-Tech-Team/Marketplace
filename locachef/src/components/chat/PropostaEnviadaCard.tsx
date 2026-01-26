import { FileText, X, Loader2 } from 'lucide-react'
import type { Proposta } from '../../contexts/AppContext'

interface PropostaEnviadaCardProps {
  proposta: Proposta
  onApagar: () => void
  apagando: boolean
}

export function PropostaEnviadaCard({ proposta, onApagar, apagando }: PropostaEnviadaCardProps) {
  return (
    <div className="mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Proposta Enviada
        </h3>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-full">
          Aguardando resposta
        </span>
      </div>

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
            <span className="text-2xl font-bold text-blue-600">
              R$ {proposta.valor_total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        <button
          onClick={onApagar}
          disabled={apagando}
          className="w-full py-3 bg-red-100 text-red-700 text-base font-bold rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {apagando ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
          {apagando ? 'Apagando...' : 'Cancelar Proposta'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Você pode cancelar esta proposta e criar uma nova com valores diferentes
        </p>
      </div>
    </div>
  )
}
