import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { Package, CheckCircle2, Truck, RotateCcw, AlertTriangle, FileText } from 'lucide-react'

// Tipos para os payloads do Realtime
interface PropostaPayload {
  id: string
  status: string
  equipamento_id: string
  usuario_id: string // locatário
  valor_total?: number
  data_fim?: string
}

interface EquipamentoPayload {
  id: string
  nome: string
  status: string
  locador_id: string
}

// Busca nome do equipamento para exibir na notificação
async function getEquipamentoNome(equipamentoId: string): Promise<string> {
  const { data } = await supabase
    .from('equipamentos')
    .select('nome')
    .eq('id', equipamentoId)
    .single()
  return data?.nome || 'Equipamento'
}

// Busca dados do chat para saber quem é o locador/locatário
async function getChatByProposta(propostaId: string): Promise<{ locador_id: string; locatario_id: string } | null> {
  const { data } = await supabase
    .from('chats')
    .select('locador_id, locatario_id')
    .eq('proposta_id', propostaId)
    .single()
  return data
}

// Busca dados do chat pelo equipamento (para notificações de status do equipamento)
async function getChatByEquipamento(equipamentoId: string): Promise<{ locador_id: string; locatario_id: string; proposta_status: string } | null> {
  const { data } = await supabase
    .from('chats')
    .select('locador_id, locatario_id, propostas!inner(status)')
    .eq('equipamento_id', equipamentoId)
    .eq('propostas.status', 'aceita')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (data) {
    const propostas = data.propostas as unknown as { status: string }[] | { status: string }
    const propostaStatus = Array.isArray(propostas) ? propostas[0]?.status : propostas?.status
    return {
      locador_id: data.locador_id,
      locatario_id: data.locatario_id,
      proposta_status: propostaStatus || ''
    }
  }
  return null
}

// Verifica se hoje é a data de fim da locação
function isDataFimHoje(dataFim: string | undefined): boolean {
  if (!dataFim) return false
  const hoje = new Date()
  const fim = new Date(dataFim)
  return (
    hoje.getFullYear() === fim.getFullYear() &&
    hoje.getMonth() === fim.getMonth() &&
    hoje.getDate() === fim.getDate()
  )
}

// Componente de notificação com tema adaptável
function NotificationContent({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  description
}: {
  icon: React.ElementType
  iconBgColor: string
  iconColor: string
  title: string
  description: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
          {description}
        </p>
      </div>
    </div>
  )
}

export function NotificationListener() {
  const { user, profile } = useAuth()
  const propostasChannelRef = useRef<RealtimeChannel | null>(null)
  const equipamentosChannelRef = useRef<RealtimeChannel | null>(null)
  const checkedPropostasRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user?.id) return

    const userId = user.id
    const isLocador = profile?.tipo_usuario === 'locador'


    // ========== LISTENER DE PROPOSTAS ==========
    const propostasChannel = supabase
      .channel(`notificacoes-propostas-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'propostas'
        },
        async (payload) => {
          const newProposta = payload.new as PropostaPayload
          const oldProposta = payload.old as PropostaPayload

          // Evita notificações duplicadas
          const notifKey = `${newProposta.id}-${newProposta.status}-${Date.now()}`
          if (checkedPropostasRef.current.has(`${newProposta.id}-${newProposta.status}`)) return
          checkedPropostasRef.current.add(`${newProposta.id}-${newProposta.status}`)

          // Só notifica se o status mudou
          if (oldProposta?.status === newProposta.status) return

          const equipamentoNome = await getEquipamentoNome(newProposta.equipamento_id)
          const chatInfo = await getChatByProposta(newProposta.id)


          // Determina se o usuário é parte desta negociação
          const isUserLocador = chatInfo?.locador_id === userId
          const isUserLocatario = newProposta.usuario_id === userId || chatInfo?.locatario_id === userId

          if (!isUserLocador && !isUserLocatario) {
            return
          }

          // ========== NOTIFICAÇÕES POR STATUS ==========
          switch (newProposta.status) {
            case 'aceita':
              if (isUserLocador) {
                toast.success(
                  <NotificationContent
                    icon={CheckCircle2}
                    iconBgColor="bg-green-100 dark:bg-green-900/30"
                    iconColor="text-green-600 dark:text-green-400"
                    title="Proposta Aceita!"
                    description={<>O cliente aceitou sua proposta para <strong>{equipamentoNome}</strong>. Prepare o despacho!</>}
                  />,
                  { duration: 8000, id: notifKey }
                )
              } else if (isUserLocatario) {
                toast.success(
                  <NotificationContent
                    icon={CheckCircle2}
                    iconBgColor="bg-green-100 dark:bg-green-900/30"
                    iconColor="text-green-600 dark:text-green-400"
                    title="Locação Confirmada!"
                    description={<>Sua locação de <strong>{equipamentoNome}</strong> foi confirmada. Aguarde o despacho.</>}
                  />,
                  { duration: 8000, id: notifKey }
                )
              }
              break

            case 'recusada':
              if (isUserLocador) {
                toast.error(
                  <NotificationContent
                    icon={AlertTriangle}
                    iconBgColor="bg-red-100 dark:bg-red-900/30"
                    iconColor="text-red-600 dark:text-red-400"
                    title="Proposta Recusada"
                    description={<>O cliente recusou a proposta para <strong>{equipamentoNome}</strong>.</>}
                  />,
                  { duration: 8000, id: notifKey }
                )
              }
              break

            case 'finalizada':
              if (isUserLocador) {
                toast.info(
                  <NotificationContent
                    icon={RotateCcw}
                    iconBgColor="bg-slate-100 dark:bg-slate-800"
                    iconColor="text-slate-600 dark:text-slate-400"
                    title="Devolução Confirmada"
                    description={<><strong>{equipamentoNome}</strong> foi devolvido e está disponível novamente.</>}
                  />,
                  { duration: 8000, id: notifKey }
                )
              } else if (isUserLocatario) {
                toast.info(
                  <NotificationContent
                    icon={RotateCcw}
                    iconBgColor="bg-slate-100 dark:bg-slate-800"
                    iconColor="text-slate-600 dark:text-slate-400"
                    title="Locação Finalizada"
                    description={<>Sua locação de <strong>{equipamentoNome}</strong> foi finalizada com sucesso.</>}
                  />,
                  { duration: 8000, id: notifKey }
                )
              }
              break

            case 'pendente':
              if (isUserLocatario && oldProposta?.status !== 'pendente') {
                toast.info(
                  <NotificationContent
                    icon={FileText}
                    iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                    iconColor="text-blue-600 dark:text-blue-400"
                    title="Nova Proposta Recebida!"
                    description={
                      <>
                        Você recebeu uma proposta para <strong>{equipamentoNome}</strong>
                        {newProposta.valor_total && ` - R$ ${newProposta.valor_total.toFixed(2)}`}
                      </>
                    }
                  />,
                  { duration: 8000, id: notifKey }
                )
              }
              break
          }

          // Limpa notificações antigas para evitar memory leak
          setTimeout(() => {
            checkedPropostasRef.current.delete(`${newProposta.id}-${newProposta.status}`)
          }, 30000)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'propostas'
        },
        async (payload) => {
          const newProposta = payload.new as PropostaPayload
          const notifKey = `${newProposta.id}-insert`

          if (checkedPropostasRef.current.has(notifKey)) return
          checkedPropostasRef.current.add(notifKey)

          // Nova proposta criada - notifica o locatário
          if (newProposta.usuario_id !== userId) {
            const chatInfo = await getChatByProposta(newProposta.id)
            if (chatInfo?.locatario_id === userId) {
              const equipamentoNome = await getEquipamentoNome(newProposta.equipamento_id)
              toast.info(
                <NotificationContent
                  icon={FileText}
                  iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                  iconColor="text-blue-600 dark:text-blue-400"
                  title="Nova Proposta!"
                  description={
                    <>
                      O locador enviou uma proposta para <strong>{equipamentoNome}</strong>
                      {newProposta.valor_total && ` - R$ ${newProposta.valor_total.toFixed(2)}`}
                    </>
                  }
                />,
                { duration: 8000, id: notifKey }
              )
            }
          }

          setTimeout(() => {
            checkedPropostasRef.current.delete(notifKey)
          }, 30000)
        }
      )
      .subscribe((status) => {
      })

    propostasChannelRef.current = propostasChannel

    // ========== LISTENER DE EQUIPAMENTOS (Despacho/Status) ==========
    const equipamentosChannel = supabase
      .channel(`notificacoes-equipamentos-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'equipamentos'
        },
        async (payload) => {
          const newEq = payload.new as EquipamentoPayload
          const oldEq = payload.old as EquipamentoPayload

          // Só notifica se o status mudou
          if (oldEq?.status === newEq.status) return

          const notifKey = `eq-${newEq.id}-${newEq.status}-${Date.now()}`
          const statusKey = `eq-${newEq.id}-${newEq.status}`
          if (checkedPropostasRef.current.has(statusKey)) return
          checkedPropostasRef.current.add(statusKey)

          const isUserLocador = newEq.locador_id === userId

          // Busca o chat ativo deste equipamento para identificar o locatário
          const chatInfo = await getChatByEquipamento(newEq.id)
          const isUserLocatario = chatInfo?.locatario_id === userId


          // Se o usuário não é nem locador nem locatário, ignora
          if (!isUserLocador && !isUserLocatario) {
            return
          }

          // Notifica sobre mudança de status EM_TRANSITO (Despacho)
          if (newEq.status === 'EM_TRANSITO' && oldEq?.status === 'RESERVADO') {
            if (isUserLocatario) {
              // Locatário: equipamento foi despachado
              toast.info(
                <NotificationContent
                  icon={Truck}
                  iconBgColor="bg-purple-100 dark:bg-purple-900/30"
                  iconColor="text-purple-600 dark:text-purple-400"
                  title="Equipamento Despachado!"
                  description={<><strong>{newEq.nome}</strong> está a caminho. Prepare-se para receber!</>}
                />,
                { duration: 8000, id: notifKey }
              )
            } else if (isUserLocador) {
              // Locador: confirmação de despacho
              toast.success(
                <NotificationContent
                  icon={Truck}
                  iconBgColor="bg-purple-100 dark:bg-purple-900/30"
                  iconColor="text-purple-600 dark:text-purple-400"
                  title="Despacho Confirmado!"
                  description={<><strong>{newEq.nome}</strong> foi despachado com sucesso.</>}
                />,
                { duration: 5000, id: notifKey }
              )
            }
          }

          // Notifica sobre mudança para OCUPADO (entrega confirmada)
          if (newEq.status === 'OCUPADO' && oldEq?.status === 'EM_TRANSITO') {
            if (isUserLocador) {
              toast.success(
                <NotificationContent
                  icon={Package}
                  iconBgColor="bg-green-100 dark:bg-green-900/30"
                  iconColor="text-green-600 dark:text-green-400"
                  title="Entrega Confirmada!"
                  description={<>O cliente confirmou o recebimento de <strong>{newEq.nome}</strong>.</>}
                />,
                { duration: 8000, id: notifKey }
              )
            } else if (isUserLocatario) {
              toast.success(
                <NotificationContent
                  icon={Package}
                  iconBgColor="bg-green-100 dark:bg-green-900/30"
                  iconColor="text-green-600 dark:text-green-400"
                  title="Recebimento Confirmado!"
                  description={<>Você confirmou o recebimento de <strong>{newEq.nome}</strong>. Boa locação!</>}
                />,
                { duration: 5000, id: notifKey }
              )
            }
          }

          // Notifica sobre mudança para DISPONIVEL (devolução)
          if (newEq.status === 'DISPONIVEL' && (oldEq?.status === 'OCUPADO' || oldEq?.status === 'EM_TRANSITO')) {
            if (isUserLocador) {
              toast.success(
                <NotificationContent
                  icon={RotateCcw}
                  iconBgColor="bg-green-100 dark:bg-green-900/30"
                  iconColor="text-green-600 dark:text-green-400"
                  title="Equipamento Devolvido!"
                  description={<><strong>{newEq.nome}</strong> foi devolvido e está disponível para novas locações.</>}
                />,
                { duration: 8000, id: notifKey }
              )
            }
          }

          setTimeout(() => {
            checkedPropostasRef.current.delete(statusKey)
          }, 30000)
        }
      )
      .subscribe((status) => {
      })

    equipamentosChannelRef.current = equipamentosChannel

    // ========== VERIFICAÇÃO DIÁRIA DE DATA_FIM ==========
    const checkDataFimLocacoes = async () => {
      if (!isLocador) return

      try {
        // Busca propostas aceitas do locador que terminam hoje
        const { data: propostas, error } = await supabase
          .from('propostas')
          .select(`
            id,
            data_fim,
            equipamento_id,
            equipamentos!inner(nome, locador_id)
          `)
          .eq('status', 'aceita')
          .eq('equipamentos.locador_id', userId)

        if (error) {
          return
        }

        if (propostas) {
          for (const proposta of propostas) {
            if (isDataFimHoje(proposta.data_fim)) {
              const equipamento = proposta.equipamentos as unknown as { nome: string }
              const notifKey = `datafim-${proposta.id}`

              if (!checkedPropostasRef.current.has(notifKey)) {
                checkedPropostasRef.current.add(notifKey)
                toast.warning(
                  <NotificationContent
                    icon={AlertTriangle}
                    iconBgColor="bg-amber-100 dark:bg-amber-900/30"
                    iconColor="text-amber-600 dark:text-amber-400"
                    title="Devolução Prevista Hoje"
                    description={<><strong>{equipamento?.nome || 'Equipamento'}</strong> deve ser coletado/devolvido hoje.</>}
                  />,
                  { duration: 10000, id: notifKey }
                )
              }
            }
          }
        }
      } catch (err) {
      }
    }

    // Executa verificação na montagem (com delay para não sobrecarregar)
    const timeoutId = setTimeout(checkDataFimLocacoes, 3000)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (propostasChannelRef.current) {
        supabase.removeChannel(propostasChannelRef.current)
      }
      if (equipamentosChannelRef.current) {
        supabase.removeChannel(equipamentosChannelRef.current)
      }
    }
  }, [user?.id, profile?.tipo_usuario])

  // Este componente não renderiza nada - apenas escuta eventos
  return null
}
