export const SYSTEM_SENDER_ID = '00000000-0000-0000-0000-000000000000'

export function normalizeId(id: string | undefined | null): string {
  return String(id || '').toLowerCase().trim()
}

export function formatarHora(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ========== STATUS INFO (centralizado - usado por ChatHeader, ChatStatusBar, ChatSplitPage) ==========
export function getStatusInfo(
  propostaStatus?: string | null,
  equipamentoStatus?: string | null,
  hasProposal?: boolean
): { label: string; gradient: string; step: number } {
  const eqStatus = equipamentoStatus?.toUpperCase()
  if (propostaStatus === 'finalizada') return { label: 'Finalizado', gradient: 'from-slate-400 to-slate-500', step: 4 }
  // Equipamento devolvido (voltou a DISPONIVEL) mas proposta ainda marcada como aceita → tratar como finalizado
  if (propostaStatus === 'aceita' && (!eqStatus || eqStatus === 'DISPONIVEL')) return { label: 'Finalizado', gradient: 'from-slate-400 to-slate-500', step: 4 }
  if (eqStatus === 'OCUPADO' || eqStatus === 'EM_TRANSITO') return { label: 'Em Uso', gradient: 'from-green-500 to-emerald-600', step: 3 }
  if (eqStatus === 'RESERVADO' || propostaStatus === 'aceita') return { label: 'Reservado', gradient: 'from-blue-500 to-indigo-600', step: 2 }
  if (propostaStatus === 'pendente') return { label: 'Proposta Pendente', gradient: 'from-blue-500 to-cta-hover', step: 1 }
  if (hasProposal) return { label: 'Proposta Enviada', gradient: 'from-blue-500 to-cta-hover', step: 1 }
  return { label: 'Negociando', gradient: 'from-blue-500 to-cta-hover', step: 0 }
}

// ========== SYSTEM MESSAGE DETECTION ==========
export function isSystemMessage(senderId: string, texto: string): boolean {
  if (normalizeId(senderId) === normalizeId(SYSTEM_SENDER_ID)) return true
  return (
    texto.startsWith('✅') ||
    texto.startsWith('❌') ||
    texto.startsWith('📋') ||
    texto.startsWith('🚛') ||
    texto.includes('Locação confirmada') ||
    texto.includes('Proposta recusada') ||
    texto.includes('Devolução confirmada') ||
    texto.includes('Proposta de locação enviada') ||
    texto.includes('Equipamento enviado ao cliente')
  )
}

// Mensagens de sistema que só o LOCADOR deve ver (irrelevantes para o cliente)
export function isLocadorOnlySystemMessage(texto: string): boolean {
  return (
    texto.includes('Aguarde a resposta do cliente') ||
    texto.includes('Equipamento enviado ao cliente')
  )
}

export function formatarData(dateStr: string): string {
  const data = new Date(dateStr)
  const hoje = new Date()
  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)

  if (data.toDateString() === hoje.toDateString()) {
    return 'Hoje'
  } else if (data.toDateString() === ontem.toDateString()) {
    return 'Ontem'
  } else {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
}
