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
