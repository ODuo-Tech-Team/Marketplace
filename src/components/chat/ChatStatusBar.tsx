import { Clock } from 'lucide-react'
import { getStatusInfo } from '../../utils/chat'

interface ChatStatusBarProps {
  propostaStatus?: string | null
  equipamentoStatus?: string | null
  hasProposal: boolean
  isLocatario?: boolean
}

const STEPS = [
  { key: 'negociacao', label: 'Negociação' },
  { key: 'proposta', label: 'Proposta' },
  { key: 'aceita', label: 'Reservado' },
  { key: 'uso', label: 'Em Uso' },
  { key: 'devolvido', label: 'Devolvido' },
]

export function ChatStatusBar({ propostaStatus, equipamentoStatus, hasProposal, isLocatario }: ChatStatusBarProps) {
  const statusInfo = getStatusInfo(propostaStatus, equipamentoStatus, hasProposal)
  const visibleSteps = isLocatario ? STEPS.slice(0, 3) : STEPS

  return (
    <div className="bg-surface-card border-b border-border-subtle px-5 py-3">
      <div className="flex items-center gap-3">
        {/* Status Pill */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-foreground bg-gradient-to-r ${statusInfo.gradient} shadow-sm`}>
          <Clock className="w-3 h-3" />
          {statusInfo.label}
        </span>

        {/* Mini Step Indicators */}
        <div className="flex items-center gap-1">
          {visibleSteps.map((step, index) => {
            const isCompleted = index < statusInfo.step
            const isCurrent = index === statusInfo.step

            return (
              <div key={step.key} className="flex items-center">
                {index > 0 && (
                  <div className={`w-3 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-surface-elevated'}`} />
                )}
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-foreground ring-2 ring-foreground-muted ring-offset-1 ring-offset-surface-card'
                      : isCompleted
                        ? 'bg-green-500'
                        : 'bg-surface-elevated'
                  }`}
                  title={step.label}
                />
              </div>
            )
          })}
        </div>
      </div>

      {statusInfo.step === 4 && !isLocatario && (
        <div className="mt-2 flex items-center gap-2 bg-glass-hover text-foreground-secondary px-3 py-2 rounded-xl text-[11px] font-bold border border-border-subtle">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Ciclo finalizado - Disponivel para nova locacao</span>
        </div>
      )}
    </div>
  )
}
