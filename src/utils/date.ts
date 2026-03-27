export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nao informado'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0]
}
