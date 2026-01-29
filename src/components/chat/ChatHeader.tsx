import { ArrowLeft, FileText, Check, X, Loader2, Truck, Building2, User, Send, RefreshCw, RotateCcw } from 'lucide-react'
import { isLinhaAmarela } from '../../contexts/AppContext'

interface ChatHeaderProps {
  equipamentoNome?: string
  equipamentoCategoria?: string
  equipamentoAno?: number | null
  equipamentoHorimetro?: number | null
  equipamentoPeso?: number | null
  nomeContraparte?: string
  isLocador?: boolean
  onVoltar: () => void
  podeGerarProposta: boolean
  podeResponderProposta: boolean
  podeConfirmarEntrega: boolean
  podeDespachar?: boolean
  podeConfirmarDevolucao?: boolean
  isReLocacao?: boolean
  onGerarProposta: () => void
  onAceitarProposta: () => void
  onRecusarProposta: () => void
  onConfirmarEntrega: () => void
  onDespachar?: () => void
  onConfirmarDevolucao?: () => void
  respondendoProposta: boolean
  marcandoEntregue: boolean
  despachando?: boolean
  confirmandoDevolucao?: boolean
}

export function ChatHeader({
  equipamentoNome,
  equipamentoCategoria,
  equipamentoAno,
  equipamentoHorimetro,
  equipamentoPeso,
  nomeContraparte,
  isLocador,
  onVoltar,
  podeGerarProposta,
  podeResponderProposta,
  podeConfirmarEntrega,
  podeDespachar,
  podeConfirmarDevolucao,
  isReLocacao,
  onGerarProposta,
  onAceitarProposta,
  onRecusarProposta,
  onConfirmarEntrega,
  onDespachar,
  onConfirmarDevolucao,
  respondendoProposta,
  marcandoEntregue,
  despachando,
  confirmandoDevolucao
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
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-800">
              {equipamentoNome || 'Conversa'}
            </h1>
            {/* Nome da contraparte - sem email */}
            {nomeContraparte && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                {isLocador ? (
                  <User className="w-4 h-4 text-gray-500" />
                ) : (
                  <Building2 className="w-4 h-4 text-gray-500" />
                )}
                <span className="font-medium">
                  {isLocador ? 'Cliente: ' : 'Locador: '}
                  {nomeContraparte}
                </span>
              </div>
            )}
            {/* Mini Ficha Técnica - Apenas para Linha Amarela */}
            {equipamentoCategoria && isLinhaAmarela(equipamentoCategoria) && (equipamentoAno || equipamentoHorimetro || equipamentoPeso) && (
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                {equipamentoAno && (
                  <span className="font-medium">{equipamentoAno}</span>
                )}
                {equipamentoHorimetro && (
                  <span className="font-medium">{equipamentoHorimetro.toLocaleString('pt-BR')}h</span>
                )}
                {equipamentoPeso && (
                  <span className="font-medium">{equipamentoPeso}t</span>
                )}
              </div>
            )}
          </div>
        </div>

        {podeGerarProposta && (
          <button
            onClick={onGerarProposta}
            className={`flex items-center gap-2 px-6 py-3 text-white text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-xl ${
              isReLocacao
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isReLocacao ? (
              <RefreshCw className="w-6 h-6" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
            {isReLocacao ? 'Nova Locação' : 'Gerar Proposta'}
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

        {podeDespachar && (
          <button
            onClick={onDespachar}
            disabled={despachando}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white text-lg font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {despachando ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
            {despachando ? 'Despachando...' : 'Despachar / Enviar'}
          </button>
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

        {podeConfirmarDevolucao && (
          <button
            onClick={onConfirmarDevolucao}
            disabled={confirmandoDevolucao}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmandoDevolucao ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <RotateCcw className="w-6 h-6" />
            )}
            {confirmandoDevolucao ? 'Confirmando...' : 'Confirmar Devolução'}
          </button>
        )}
      </div>
    </header>
  )
}
