import { VERTICALS, VERTICAL_CONFIGS, type VerticalKey } from '../config/verticals'

interface VerticalTabsProps {
  activeVertical: VerticalKey
  onSwitch: (key: VerticalKey) => void
}

// Mapa de estilos de borda inferior para cada vertical (classes completas para Tailwind)
const borderActiveMap: Record<VerticalKey, string> = {
  construcao: 'border-amber-500',
  medico: 'border-emerald-500',
  tech: 'border-blue-500',
  eventos: 'border-rose-500',
  agro: 'border-lime-500',
  industrial: 'border-cyan-500',
  logistica: 'border-violet-500',
  energia: 'border-yellow-500',
  estetica: 'border-fuchsia-500',
  gastronomia: 'border-cta',
}

const textActiveMap: Record<VerticalKey, string> = {
  construcao: 'text-amber-600',
  medico: 'text-emerald-600',
  tech: 'text-blue-600',
  eventos: 'text-rose-600',
  agro: 'text-lime-600',
  industrial: 'text-cyan-600',
  logistica: 'text-violet-600',
  energia: 'text-yellow-600',
  estetica: 'text-fuchsia-600',
  gastronomia: 'text-cta',
}

export default function VerticalTabs({ activeVertical, onSwitch }: VerticalTabsProps) {
  return (
    <div className="bg-surface-card border-b border-border shadow-sm sticky top-[72px] z-40 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 flex">
        {VERTICALS.map((key) => {
          const v = VERTICAL_CONFIGS[key]
          const isActive = activeVertical === key
          const Icon = v.icon

          return (
            <button
              key={key}
              onClick={() => onSwitch(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-4 transition-all min-w-[140px]
                ${isActive
                  ? `${borderActiveMap[key]} text-foreground bg-surface-elevated/50`
                  : 'border-transparent text-foreground-muted hover:text-foreground-secondary hover:bg-surface-elevated'
                }`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100 grayscale opacity-70'}`}>
                <Icon size={20} className={isActive ? textActiveMap[key] : ''} />
              </div>
              <span className={`font-bold text-sm ${isActive ? 'text-foreground' : ''}`}>
                {v.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
