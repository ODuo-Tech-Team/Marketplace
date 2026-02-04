import { ShieldCheck, Thermometer, HardDrive, HardHat } from 'lucide-react'
import type { VerticalKey } from '../config/verticals'

// Configuração de selos por vertical
export const SEAL_CONFIGS: Record<VerticalKey, {
  key: string
  label: string
  shortLabel: string
  icon: typeof ShieldCheck
  bgColor: string
  textColor: string
  borderColor: string
  description: string
}> = {
  construcao: {
    key: 'operador_especializado',
    label: 'Operador Especializado',
    shortLabel: 'Operador',
    icon: HardHat,
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/30',
    description: 'Equipamento inclui operador qualificado'
  },
  medico: {
    key: 'calibrado_sanitizado',
    label: 'Calibrado e Sanitizado',
    shortLabel: 'Calibrado',
    icon: Thermometer,
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-500/30',
    description: 'Equipamento calibrado e sanitizado conforme ANVISA'
  },
  tech: {
    key: 'dados_seguros',
    label: 'Seguro de Dados / Formatado',
    shortLabel: 'Formatado',
    icon: HardDrive,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500/30',
    description: 'Equipamento formatado e com dados seguros'
  },
  eventos: {
    key: 'verificado',
    label: 'Verificado',
    shortLabel: 'Verificado',
    icon: ShieldCheck,
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-500/30',
    description: 'Equipamento verificado e testado'
  },
  agro: {
    key: 'verificado',
    label: 'Verificado',
    shortLabel: 'Verificado',
    icon: ShieldCheck,
    bgColor: 'bg-lime-500/10',
    textColor: 'text-lime-600',
    borderColor: 'border-lime-500/30',
    description: 'Equipamento verificado e operacional'
  },
  industrial: {
    key: 'verificado',
    label: 'Verificado',
    shortLabel: 'Verificado',
    icon: ShieldCheck,
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-600',
    borderColor: 'border-cyan-500/30',
    description: 'Equipamento verificado e operacional'
  },
  logistica: {
    key: 'verificado',
    label: 'Verificado',
    shortLabel: 'Verificado',
    icon: ShieldCheck,
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-500/30',
    description: 'Veículo verificado e documentado'
  },
  energia: {
    key: 'verificado',
    label: 'Verificado',
    shortLabel: 'Verificado',
    icon: ShieldCheck,
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-500/30',
    description: 'Equipamento verificado e operacional'
  },
  estetica: {
    key: 'calibrado_sanitizado',
    label: 'Calibrado e Sanitizado',
    shortLabel: 'Sanitizado',
    icon: Thermometer,
    bgColor: 'bg-fuchsia-500/10',
    textColor: 'text-fuchsia-600',
    borderColor: 'border-fuchsia-500/30',
    description: 'Equipamento calibrado e sanitizado conforme ANVISA'
  },
  gastronomia: {
    key: 'verificado',
    label: 'Verificado',
    shortLabel: 'Verificado',
    icon: ShieldCheck,
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/30',
    description: 'Equipamento verificado e higienizado'
  },
}

interface TrustSealProps {
  vertical: VerticalKey
  isVerified?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function TrustSeal({ vertical, isVerified = false, size = 'sm', showLabel = true }: TrustSealProps) {
  if (!isVerified) return null

  const config = SEAL_CONFIGS[vertical]
  if (!config) return null

  const Icon = config.icon

  const sizeStyles = {
    sm: { icon: 12, text: 'text-[10px]', padding: 'px-1.5 py-0.5', gap: 'gap-1' },
    md: { icon: 14, text: 'text-xs', padding: 'px-2 py-1', gap: 'gap-1.5' },
    lg: { icon: 16, text: 'text-sm', padding: 'px-2.5 py-1.5', gap: 'gap-2' },
  }

  const s = sizeStyles[size]

  return (
    <div
      className={`inline-flex items-center ${s.gap} ${s.padding} rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} font-bold ${s.text}`}
      title={config.description}
    >
      <Icon size={s.icon} />
      {showLabel && <span>{config.shortLabel}</span>}
    </div>
  )
}

// Componente para exibir múltiplos selos (quando aplicável)
interface TrustSealsRowProps {
  vertical?: VerticalKey | string | null
  isVerified?: boolean | null
  oferecesOperador?: boolean | null
  size?: 'sm' | 'md' | 'lg'
}

export function TrustSealsRow({ vertical, isVerified, oferecesOperador, size = 'sm' }: TrustSealsRowProps) {
  const v = (vertical as VerticalKey) || 'construcao'

  // Para construção, mostra selo de operador se oferece
  if (v === 'construcao' && oferecesOperador) {
    return <TrustSeal vertical="construcao" isVerified={true} size={size} />
  }

  // Para outros verticais, mostra selo de verificação
  if (isVerified) {
    return <TrustSeal vertical={v} isVerified={true} size={size} />
  }

  return null
}

export default TrustSeal
