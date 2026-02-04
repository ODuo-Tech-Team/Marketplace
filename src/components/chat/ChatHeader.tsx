import { ArrowLeft, FileText, Check, X, Loader2, Truck, Building2, User, Send, RefreshCw, RotateCcw, Clock } from 'lucide-react'
import { isLinhaAmarela } from '../../contexts/AppContext'
import { getStatusInfo } from '../../utils/chat'

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
  isEditarProposta?: boolean
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
  propostaStatus?: string | null
  equipamentoStatus?: string | null
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
  isEditarProposta,
  onGerarProposta,
  onAceitarProposta,
  onRecusarProposta,
  onConfirmarEntrega,
  onDespachar,
  onConfirmarDevolucao,
  respondendoProposta,
  marcandoEntregue,
  despachando,
  confirmandoDevolucao,
  propostaStatus,
  equipamentoStatus
}: ChatHeaderProps) {
  const statusInfo = getStatusInfo(propostaStatus, equipamentoStatus)

  return (
    <header className="h-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-5 h-full flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onVoltar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex-shrink-0"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
          {/* Avatar with online dot */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-base sm:text-lg border border-indigo-200 dark:border-indigo-800">
              {(nomeContraparte || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-[3px] border-white dark:border-neutral-900" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {equipamentoNome || 'Conversa'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {nomeContraparte && (
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  {isLocador ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                  {nomeContraparte}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${statusInfo.gradient}`}>
                <Clock className="w-2.5 h-2.5" />
                {statusInfo.label}
              </span>
            </div>
            {equipamentoCategoria && isLinhaAmarela(equipamentoCategoria) && (equipamentoAno || equipamentoHorimetro || equipamentoPeso) && (
              <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {equipamentoAno && <span>{equipamentoAno}</span>}
                {equipamentoHorimetro && <span>{equipamentoHorimetro.toLocaleString('pt-BR')}h</span>}
                {equipamentoPeso && <span>{equipamentoPeso}t</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {podeGerarProposta && (
            <button
              onClick={onGerarProposta}
              className={`flex items-center gap-1.5 px-3 sm:px-5 py-2.5 text-white font-bold rounded-xl transition-all shadow-lg text-sm ${
                isReLocacao
                  ? 'bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 shadow-indigo-500/20'
                  : isEditarProposta
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                    : 'bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 shadow-indigo-500/20'
              }`}
            >
              {isReLocacao ? <RefreshCw className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              <span className="hidden sm:inline">{isReLocacao ? 'Nova Locação' : isEditarProposta ? 'Editar Proposta' : 'Gerar Proposta'}</span>
            </button>
          )}

          {podeResponderProposta && (
            <div className="flex items-center gap-2">
              <button
                onClick={onAceitarProposta}
                disabled={respondendoProposta}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {respondendoProposta ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span className="hidden sm:inline">Aceitar</span>
              </button>
              <button
                onClick={onRecusarProposta}
                disabled={respondendoProposta}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-gray-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-gray-200 dark:border-neutral-700"
              >
                {respondendoProposta ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                <span className="hidden sm:inline">Recusar</span>
              </button>
            </div>
          )}

          {podeDespachar && (
            <button
              onClick={onDespachar}
              disabled={despachando}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {despachando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">{despachando ? 'Despachando...' : 'Despachar'}</span>
            </button>
          )}

          {podeConfirmarEntrega && (
            <button
              onClick={onConfirmarEntrega}
              disabled={marcandoEntregue}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {marcandoEntregue ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              <span className="hidden sm:inline">{marcandoEntregue ? 'Confirmando...' : 'Entrega'}</span>
            </button>
          )}

          {podeConfirmarDevolucao && (
            <button
              onClick={onConfirmarDevolucao}
              disabled={confirmandoDevolucao}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {confirmandoDevolucao ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              <span className="hidden sm:inline">{confirmandoDevolucao ? 'Confirmando...' : 'Devolução'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
