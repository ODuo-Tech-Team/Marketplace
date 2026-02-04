import type { LucideIcon } from 'lucide-react'
import {
  Truck, Stethoscope, Monitor, PartyPopper,
  Wheat, Factory, Car, Clapperboard, Anchor
} from 'lucide-react'

// ===== NICHE CONFIG (para grid de selecao no onboarding do parceiro) =====
// IDs correspondem a tabela SQL `verticals`

export interface NicheConfig {
  id: string
  label: string
  icon: LucideIcon
  color: string
}

export const NICHES: NicheConfig[] = [
  { id: 'civil',      label: 'Construção Civil',   icon: Truck,         color: 'amber' },
  { id: 'medica',     label: 'Saúde & Hospitalar', icon: Stethoscope,   color: 'emerald' },
  { id: 'tech',       label: 'Tecnologia & TI',    icon: Monitor,       color: 'blue' },
  { id: 'eventos',    label: 'Eventos & Festas',   icon: PartyPopper,   color: 'rose' },
  { id: 'agro',       label: 'Agro & Rural',       icon: Wheat,         color: 'lime' },
  { id: 'industrial', label: 'Industrial',         icon: Factory,       color: 'slate' },
  { id: 'frota',      label: 'Frotas',             icon: Car,           color: 'indigo' },
  { id: 'cine',       label: 'Audiovisual',        icon: Clapperboard,  color: 'violet' },
  { id: 'nautica',    label: 'Náutica',            icon: Anchor,        color: 'sky' },
]

// Mapa de classes completas por cor (Tailwind JIT safe)
const COLOR_CLASSES: Record<string, string> = {
  amber:   'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500',
  emerald: 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500',
  blue:    'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500',
  rose:    'border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-500',
  lime:    'border-lime-500 bg-lime-50 text-lime-900 ring-1 ring-lime-500',
  slate:   'border-slate-600 bg-slate-100 text-slate-900 ring-1 ring-slate-600',
  indigo:  'border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500',
  violet:  'border-violet-500 bg-violet-50 text-violet-900 ring-1 ring-violet-500',
  sky:     'border-sky-500 bg-sky-50 text-sky-900 ring-1 ring-sky-500',
}

const UNSELECTED_CLASSES = 'border-border-subtle bg-surface-card hover:border-border text-foreground-secondary opacity-70 hover:opacity-100'

export function getColorClasses(color: string, isSelected: boolean): string {
  if (!isSelected) return UNSELECTED_CLASSES
  return COLOR_CLASSES[color] || COLOR_CLASSES.slate
}
