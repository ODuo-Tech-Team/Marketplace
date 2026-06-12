// Categorias de equipamentos
export const CATEGORIAS = [
  // Linha Amarela (Máquinas Pesadas)
  'Escavadeira Hidráulica',
  'Retroescavadeira',
  'Pá Carregadeira',
  'Motoniveladora',
  'Rolo Compactador',
  'Trator de Esteira',
  'Mini Escavadeira',
  // Equipamentos de Construção
  'Betoneiras',
  'Andaimes',
  'Ferramentas Elétricas',
  'Geradores',
  'Equipamentos de Proteção',
  'Compactadores',
  'Outros'
] as const

// Categorias que são de Linha Amarela (requerem dados técnicos)
export const CATEGORIAS_LINHA_AMARELA = [
  'Escavadeira Hidráulica',
  'Retroescavadeira',
  'Pá Carregadeira',
  'Motoniveladora',
  'Rolo Compactador',
  'Trator de Esteira',
  'Mini Escavadeira'
] as const

// Helper para verificar se uma categoria é Linha Amarela
export const isLinhaAmarela = (categoria: string): boolean => {
  return categoria === 'Máquinas Pesadas' || CATEGORIAS_LINHA_AMARELA.includes(categoria as typeof CATEGORIAS_LINHA_AMARELA[number])
}

// Mapa de cores industriais por categoria
export const CATEGORIA_CORES: Record<string, string> = {
  'Escavadeira Hidráulica': 'bg-yellow-600',
  'Retroescavadeira': 'bg-amber-700',
  'Pá Carregadeira': 'bg-yellow-500',
  'Motoniveladora': 'bg-orange-600',
  'Rolo Compactador': 'bg-zinc-700',
  'Trator de Esteira': 'bg-slate-600',
  'Mini Escavadeira': 'bg-yellow-700',
  'Betoneiras': 'bg-amber-700',
  'Andaimes': 'bg-slate-600',
  'Ferramentas Elétricas': 'bg-yellow-600',
  'Geradores': 'bg-zinc-700',
  'Equipamentos de Proteção': 'bg-orange-700',
  'Compactadores': 'bg-stone-600',
  'Outros': 'bg-gray-600'
}

// Tipos de veículo para transporte de Linha Amarela
export const TIPOS_VEICULO_TRANSPORTE = ['Caminhão Prancha', 'Caminhão Munck', 'Reboque'] as const

// Voltagens para equipamentos leves
export const VOLTAGENS = ['110v', '220v', 'Bivolt', 'Bateria'] as const

// Status válidos para chat aberto (case-insensitive)
export const STATUS_CHAT_ABERTO = ['aberto', 'ativo'] as const

// Helper para verificar se o chat está aberto (aceita 'aberto' ou 'Ativo')
export const isChatAberto = (status: string | undefined | null): boolean => {
  if (!status) return false
  const statusNormalizado = status.toLowerCase().trim()
  return STATUS_CHAT_ABERTO.includes(statusNormalizado as typeof STATUS_CHAT_ABERTO[number])
}

// Lista de estados brasileiros
export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const
