interface ChatStatusBarProps {
  propostaStatus?: string | null
  equipamentoStatus?: string | null
  hasProposal: boolean
  isLocatario?: boolean
}

const STEPS = [
  { key: 'negociacao', label: 'Negociacao', color: 'slate' },
  { key: 'proposta', label: 'Proposta Enviada', color: 'amber' },
  { key: 'aceita', label: 'Reservado', color: 'blue' },
  { key: 'uso', label: 'Em Uso', color: 'green' },
  { key: 'devolvido', label: 'Devolvido', color: 'slate' },
]

function getCurrentStep(
  propostaStatus?: string | null,
  equipamentoStatus?: string | null,
  hasProposal?: boolean
): number {
  const eqStatus = equipamentoStatus?.toUpperCase()

  // Se equipamento voltou a disponivel apos locacao (proposta finalizada)
  if (propostaStatus === 'finalizada') return 4

  // Se equipamento esta OCUPADO ou EM_TRANSITO = Em Uso
  if (eqStatus === 'OCUPADO' || eqStatus === 'EM_TRANSITO') return 3

  // Se equipamento esta RESERVADO (proposta aceita)
  if (eqStatus === 'RESERVADO' || propostaStatus === 'aceita') return 2

  // Se tem proposta pendente
  if (propostaStatus === 'pendente') return 1

  // Se tem proposta (qualquer outro status)
  if (hasProposal) return 1

  // Em negociacao (sem proposta)
  return 0
}

const colorClasses: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-300', dot: 'bg-slate-400' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300', dot: 'bg-amber-500' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-300', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-300', dot: 'bg-purple-500' },
  green: { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-300', dot: 'bg-green-500' },
}

export function ChatStatusBar({ propostaStatus, equipamentoStatus, hasProposal, isLocatario }: ChatStatusBarProps) {
  const currentStep = getCurrentStep(propostaStatus, equipamentoStatus, hasProposal)
  const isFinalized = currentStep === 4

  // Locatário só vê até "Reservado" (não mostra "Em Uso" e "Devolvido")
  const visibleSteps = isLocatario ? STEPS.slice(0, 3) : STEPS

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 overflow-x-auto">
          {visibleSteps.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            const colors = colorClasses[step.color] || colorClasses.slate

            return (
              <div key={step.key} className="flex items-center flex-shrink-0">
                {index > 0 && (
                  <div className={`w-4 sm:w-6 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
                <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isCurrent
                    ? `${colors.bg} ${colors.text} ring-2 ${colors.ring}`
                    : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-50 text-slate-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isCurrent ? colors.dot : isCompleted ? 'bg-green-500' : 'bg-slate-300'
                  }`} />
                  <span className="hidden sm:inline whitespace-nowrap">{step.label}</span>
                </div>
              </div>
            )
          })}
        </div>
        {isFinalized && !isLocatario && (
          <div className="mt-2 flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Ciclo finalizado - Disponivel para nova locacao</span>
          </div>
        )}
      </div>
    </div>
  )
}
