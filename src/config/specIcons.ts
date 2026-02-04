import type { LucideIcon } from 'lucide-react'
import {
  Cpu, MemoryStick, HardDrive, Monitor, Zap, Factory,
  Calendar, Weight, Gauge, Shield, Wrench, Users, Layers
} from 'lucide-react'

export const SPEC_ICON_MAP: Record<string, LucideIcon> = {
  // Tech
  processador: Cpu,
  ram: MemoryStick,
  armazenamento: HardDrive,
  sistema_operacional: Monitor,

  // Construcao
  ano: Calendar,
  horimetro_atual: Gauge,
  peso_operacional: Weight,
  oferece_operador: Users,

  // Medico
  registro_anvisa: Shield,
  ano_fabricacao: Calendar,
  calibrado: Shield,

  // Eventos
  potencia: Zap,
  capacidade: Users,

  // Agro
  potencia_cv: Zap,
  horas_uso: Gauge,
  tracao: Wrench,

  // Comum
  voltagem: Zap,
  fabricante: Factory,
  modelo: Layers,
}

export function getSpecIcon(key: string): LucideIcon | null {
  return SPEC_ICON_MAP[key] || null
}
