import type { Equipamento } from '../types'

// Helper para verificar se equipamento esta disponivel
export const isEquipamentoDisponivel = (eq: Equipamento): boolean => {
  if (!eq.status) return true
  return eq.status === 'DISPONIVEL' || eq.status === 'disponivel'
}

// Helper para obter o nome de exibicao do locador (prioriza nome_empresa > full_name)
export const getLocadorDisplayName = (eq: Equipamento): string | null => {
  return eq.locador_nome_empresa || eq.locador_ || eq.locador_full_name || null
}

// Helper para obter URL da imagem do equipamento
export const getEquipamentoImageUrl = (eq: Equipamento): string | null => {
  if (!eq.fotos || !Array.isArray(eq.fotos) || eq.fotos.length === 0 || !eq.fotos[0]) {
    return null
  }

  const path = eq.fotos[0]

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
}
