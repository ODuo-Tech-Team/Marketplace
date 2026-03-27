import { useState, useEffect, useMemo } from 'react'
import Calendar from 'react-calendar'
import { X, Loader2, Calendar as CalendarIcon, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getStorageUrl } from '../lib/storage'
import type { Equipamento } from '../contexts/AppContext'

// Tipos para as reservas/ocupações
interface Ocupacao {
  id: string
  data_inicio: string
  data_fim: string
  status: string
  cliente_nome?: string
}

interface CalendarioDisponibilidadeProps {
  isOpen: boolean
  onClose: () => void
  equipamento: Equipamento | null
}

// Helper para verificar se duas datas são o mesmo dia
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Helper para verificar se uma data está dentro de um range
function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return d >= s && d <= e
}

// Helper para obter a URL da imagem
function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return getStorageUrl(path)
}

export default function CalendarioDisponibilidade({
  isOpen,
  onClose,
  equipamento
}: CalendarioDisponibilidadeProps) {
  const [ocupacoes, setOcupacoes] = useState<Ocupacao[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Busca as ocupações do equipamento
  useEffect(() => {
    if (!isOpen || !equipamento?.id) {
      setOcupacoes([])
      return
    }

    const fetchOcupacoes = async () => {
      setLoading(true)
      try {
        // Busca propostas com status relevantes para este equipamento
        const { data: propostas, error } = await supabase
          .from('propostas')
          .select(`
            id,
            data_inicio,
            data_fim,
            status,
            chat_id
          `)
          .eq('equipamento_id', equipamento.id)
          .in('status', ['aceita', 'pendente'])
          .not('data_inicio', 'is', null)
          .not('data_fim', 'is', null)

        if (error) {
          setOcupacoes([])
          return
        }

        if (!propostas || propostas.length === 0) {
          setOcupacoes([])
          return
        }

        // Busca os nomes dos clientes através dos chats
        const chatIds = propostas.map(p => p.chat_id).filter(Boolean)
        let clientesMap = new Map<string, string>()

        if (chatIds.length > 0) {
          const { data: chats } = await supabase
            .from('chats')
            .select('id, locatario_id')
            .in('id', chatIds)

          if (chats && chats.length > 0) {
            const locatarioIds = [...new Set(chats.map(c => c.locatario_id))]
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, nome_empresa')
              .in('id', locatarioIds)

            if (profiles) {
              const profileMap = new Map(profiles.map(p => [p.id, p.nome_empresa || p.full_name || 'Cliente']))
              chats.forEach(chat => {
                const nome = profileMap.get(chat.locatario_id) || 'Cliente'
                clientesMap.set(chat.id, nome)
              })
            }
          }
        }

        // Mapeia as ocupações com nomes dos clientes
        const ocupacoesData: Ocupacao[] = propostas.map(p => ({
          id: p.id,
          data_inicio: p.data_inicio,
          data_fim: p.data_fim,
          status: p.status,
          cliente_nome: p.chat_id ? clientesMap.get(p.chat_id) : undefined
        }))

        setOcupacoes(ocupacoesData)
      } catch (err) {
        setOcupacoes([])
      } finally {
        setLoading(false)
      }
    }

    fetchOcupacoes()
  }, [isOpen, equipamento?.id])

  // Determina o status de uma data específica
  const getDateStatus = useMemo(() => {
    return (date: Date): { status: 'reservado' | 'ocupado' | 'livre'; ocupacao?: Ocupacao } => {
      for (const oc of ocupacoes) {
        const inicio = new Date(oc.data_inicio)
        const fim = new Date(oc.data_fim)

        if (isDateInRange(date, inicio, fim)) {
          // Status do equipamento determina a cor
          const eqStatus = equipamento?.status?.toUpperCase()
          if (eqStatus === 'OCUPADO' || eqStatus === 'EM_TRANSITO') {
            return { status: 'ocupado', ocupacao: oc }
          }
          return { status: 'reservado', ocupacao: oc }
        }
      }
      return { status: 'livre' }
    }
  }, [ocupacoes, equipamento?.status])

  // Função para estilizar cada tile do calendário
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''

    const { status } = getDateStatus(date)
    const isSelected = selectedDate && isSameDay(date, selectedDate)

    let classes = 'relative transition-all '

    if (status === 'ocupado') {
      classes += 'bg-emerald-500 text-white hover:bg-emerald-600 '
    } else if (status === 'reservado') {
      classes += 'bg-blue-500 text-white hover:bg-blue-600 '
    }

    if (isSelected) {
      classes += 'ring-2 ring-offset-2 ring-indigo-500 '
    }

    return classes
  }

  // Conteúdo extra nos tiles (indicador visual)
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null

    const { status } = getDateStatus(date)

    if (status === 'livre') return null

    return (
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
        <div className={`w-1.5 h-1.5 rounded-full ${
          status === 'ocupado' ? 'bg-emerald-200' : 'bg-blue-200'
        }`} />
      </div>
    )
  }

  // Detalhes da data selecionada
  const selectedDateInfo = useMemo(() => {
    if (!selectedDate) return null
    return getDateStatus(selectedDate)
  }, [selectedDate, getDateStatus])

  // Estatísticas
  const stats = useMemo(() => {
    const hoje = new Date()
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate())

    let diasOcupados = 0
    let diasReservados = 0

    ocupacoes.forEach(oc => {
      const inicio = new Date(oc.data_inicio)
      const fim = new Date(oc.data_fim)
      const eqStatus = equipamento?.status?.toUpperCase()

      // Conta dias dentro do próximo mês
      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        if (d >= hoje && d <= proximoMes) {
          if (eqStatus === 'OCUPADO' || eqStatus === 'EM_TRANSITO') {
            diasOcupados++
          } else {
            diasReservados++
          }
        }
      }
    })

    return { diasOcupados, diasReservados, totalBloqueados: diasOcupados + diasReservados }
  }, [ocupacoes, equipamento?.status])

  if (!isOpen) return null

  const fotoUrl = equipamento?.fotos?.[0] ? getImageUrl(equipamento.fotos[0]) : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-surface-elevated p-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Agenda de Disponibilidade</h2>
              <p className="text-xs text-foreground-muted">{equipamento?.nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-inset rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Equipment Card */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-surface-elevated rounded-xl border border-border-subtle">
            <div className="w-14 h-14 rounded-lg bg-surface-inset overflow-hidden flex-shrink-0">
              {fotoUrl ? (
                <img src={fotoUrl} alt={equipamento?.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-foreground-muted" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{equipamento?.nome}</p>
              <p className="text-sm text-foreground-muted">{equipamento?.categoria}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                R$ {equipamento?.preco_diaria?.toFixed(2)}
              </p>
              <p className="text-xs text-foreground-muted">/dia</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.diasOcupados}</p>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Em Uso</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.diasReservados}</p>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Reservados</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{30 - stats.totalBloqueados}</p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Livres (30d)</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-xs font-medium text-foreground-secondary">Em Uso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-xs font-medium text-foreground-secondary">Reservado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-surface-elevated border border-border" />
              <span className="text-xs font-medium text-foreground-secondary">Livre</span>
            </div>
          </div>

          {/* Calendar */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="calendario-disponibilidade">
              <Calendar
                locale="pt-BR"
                tileClassName={tileClassName}
                tileContent={tileContent}
                onClickDay={(date) => setSelectedDate(date)}
                minDate={new Date()}
                showNeighboringMonth={false}
                prev2Label={null}
                next2Label={null}
              />
            </div>
          )}

          {/* Selected Date Info */}
          {selectedDate && selectedDateInfo && (
            <div className={`mt-4 p-4 rounded-xl border ${
              selectedDateInfo.status === 'ocupado'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : selectedDateInfo.status === 'reservado'
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800'
            }`}>
              <p className="text-sm font-bold text-foreground mb-1">
                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedDateInfo.status === 'livre' ? (
                <p className="text-sm text-foreground-secondary">
                  Este dia esta disponivel para locacao.
                </p>
              ) : (
                <div>
                  <p className={`text-sm font-semibold ${
                    selectedDateInfo.status === 'ocupado' ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {selectedDateInfo.status === 'ocupado' ? 'Em Uso' : 'Reservado'}
                  </p>
                  {selectedDateInfo.ocupacao?.cliente_nome && (
                    <p className="text-sm text-foreground-secondary mt-0.5">
                      Cliente: {selectedDateInfo.ocupacao.cliente_nome}
                    </p>
                  )}
                  {selectedDateInfo.ocupacao && (
                    <p className="text-xs text-foreground-muted mt-1">
                      Periodo: {new Date(selectedDateInfo.ocupacao.data_inicio).toLocaleDateString('pt-BR')} - {new Date(selectedDateInfo.ocupacao.data_fim).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && ocupacoes.length === 0 && (
            <div className="text-center py-6 bg-surface-elevated rounded-xl border border-border-subtle mt-4">
              <CalendarIcon className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground-secondary">Nenhuma reserva agendada</p>
              <p className="text-xs text-foreground-muted mt-1">Este equipamento esta 100% disponivel</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-surface-elevated text-foreground-secondary font-semibold rounded-xl hover:bg-surface-inset transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
