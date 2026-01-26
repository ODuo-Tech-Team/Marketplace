import { ArrowLeft, FileText, Check, X, Loader2, Truck } from 'lucide-react'

interface ChatHeaderProps {
  equipamentoNome?: string
  onVoltar: () => void
  podeGerarProposta: boolean
  podeResponderProposta: boolean
  podeConfirmarEntrega: boolean
  onGerarProposta: () => void
  onAceitarProposta: () => void
  onRecusarProposta: () => void
  onConfirmarEntrega: () => void
  respondendoProposta: boolean
  marcandoEntregue: boolean
}

export function ChatHeader({
  equipamentoNome,
  onVoltar,
  podeGerarProposta,
  podeResponderProposta,
  podeConfirmarEntrega,
  onGerarProposta,
  onAceitarProposta,
  onRecusarProposta,
  onConfirmarEntrega,
  respondendoProposta,
  marcandoEntregue
}: ChatHeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onVoltar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {equipamentoNome || 'Conversa'}
            </h1>
          </div>
        </div>

        {podeGerarProposta && (
          <button
            onClick={onGerarProposta}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white text-lg font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FileText className="w-6 h-6" />
            Gerar Proposta
          </button>
        )}

        {podeResponderProposta && (
          <div className="flex items-center gap-2">
            <button
              onClick={onAceitarProposta}
              disabled={respondendoProposta}
              className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {respondendoProposta ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              Aceitar
            </button>
            <button
              onClick={onRecusarProposta}
              disabled={respondendoProposta}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {respondendoProposta ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <X className="w-5 h-5" />
              )}
              Recusar
            </button>
          </div>
        )}

        {podeConfirmarEntrega && (
          <button
            onClick={onConfirmarEntrega}
            disabled={marcandoEntregue}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {marcandoEntregue ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Truck className="w-6 h-6" />
            )}
            {marcandoEntregue ? 'Confirmando...' : 'Confirmar Entrega Realizada'}
          </button>
        )}
      </div>
    </header>
  )
}
