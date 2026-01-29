import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HardHat, Loader2, TrendingUp, Users, Package, ArrowLeft, RefreshCw,
  AlertCircle, Building2, KeyRound, Mail, Check, X, Eye, EyeOff,
  Calendar, Clock, Trash2, Search, UserCog, BadgeCheck, Shield,
  Filter, ChevronDown, ToggleLeft, ToggleRight, AlertTriangle,
  Crown, ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react'

// =====================================================
// INTERFACES
// =====================================================

interface ResumoData {
  total_locacoes: number
  total_locadores: number
  total_locatarios: number
  total_equipamentos: number
  locacoes_ativas: number
  usuarios_pendentes_reset: number
  locadores_verificados: number
}

interface LocadoraResumo {
  id: string
  nome: string
  total_locacoes: number
  total_equipamentos: number
}

interface UsuarioResetSenha {
  id: string
  email: string
  nome: string
  tipo_usuario: string
}

interface EquipamentoDetalhe {
  id: string
  nome: string
  categoria: string
  status: 'disponivel' | 'locado' | 'pendente'
  cliente_atual?: string
  data_inicio?: string
}

interface HistoricoLocacao {
  id: string
  equipamento_nome: string
  cliente_nome: string
  data_inicio: string
  data_fim?: string
  status: 'ativa' | 'finalizada'
  valor_diaria: number
  dias: number
}

interface LocadorDetalhe {
  id: string
  nome: string
  email: string
  telefone?: string
  equipamentos: EquipamentoDetalhe[]
  historico: HistoricoLocacao[]
  locacoes_ativas: number
  total_equipamentos: number
}

// Interface para usuário completo do sistema
interface Usuario {
  id: string
  email: string
  nome: string
  nome_empresa?: string
  tipo_usuario: 'locador' | 'locatario'
  verificado: boolean
  solicitou_reset: boolean
  created_at: string
}

// Tipos de filtro disponíveis
type FiltroTipo = 'todos' | 'locadores' | 'locatarios' | 'pendentes_reset'

// Tipo para abas do painel
type TabAtiva = 'usuarios' | 'analytics' | 'equipamentos'

// Interfaces para Analytics
interface RankingCliente {
  nome: string
  email: string
  total_locacoes: number
  total_gasto: number
}

interface InventarioQuente {
  equipamento: string
  categoria: string
  locador: string
  locacoes: number
  receita: number
}

interface ReceitaMensal {
  mes: string
  mes_label: string
  total_locacoes: number
  total_receita: number
  variacao_percentual: number | null
}

// Interface para equipamento na aba Equipamentos
interface EquipamentoAdmin {
  id: string
  nome: string
  categoria: string
  locador_nome: string
  status: string
  destaque: boolean
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function Adm() {
  const { profile, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumo, setResumo] = useState<ResumoData | null>(null)
  const [locadoras, setLocadoras] = useState<LocadoraResumo[]>([])
  const [usuariosReset, setUsuariosReset] = useState<UsuarioResetSenha[]>([])
  const [enviandoReset, setEnviandoReset] = useState<string | null>(null)
  const [resetSucesso, setResetSucesso] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Estados para modal de detalhes do locador
  const [modalAberto, setModalAberto] = useState(false)
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)
  const [detalheLocador, setDetalheLocador] = useState<LocadorDetalhe | null>(null)

  // Estados para gerenciamento de usuários (tabela principal)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [buscaUsuario, setBuscaUsuario] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroTipo>('todos')
  const [resetandoSenha, setResetandoSenha] = useState<string | null>(null)
  const [excluindoUsuario, setExcluindoUsuario] = useState<string | null>(null)
  const [alternandoVerificado, setAlternandoVerificado] = useState<string | null>(null)
  const [sucessoUsuario, setSucessoUsuario] = useState<string | null>(null)

  // Estados para modal de reset de senha
  const [modalResetAberto, setModalResetAberto] = useState(false)
  const [usuarioParaReset, setUsuarioParaReset] = useState<Usuario | null>(null)
  const [novaSenhaInput, setNovaSenhaInput] = useState('')
  const [mostrarSenhaInput, setMostrarSenhaInput] = useState(false)

  // Estado da aba ativa
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('usuarios')

  // Estados para Analytics
  const [rankingClientes, setRankingClientes] = useState<RankingCliente[]>([])
  const [inventarioQuente, setInventarioQuente] = useState<InventarioQuente[]>([])
  const [receitaMensal, setReceitaMensal] = useState<ReceitaMensal[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Estados para aba Equipamentos
  const [equipamentosAdmin, setEquipamentosAdmin] = useState<EquipamentoAdmin[]>([])
  const [loadingEquipAdmin, setLoadingEquipAdmin] = useState(false)
  const [buscaEquipAdmin, setBuscaEquipAdmin] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  // =====================================================
  // FUNÇÕES DE CARREGAMENTO
  // =====================================================

  // Carrega todos os usuários do sistema
  const carregarUsuarios = async () => {
    setLoadingUsuarios(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, nome_empresa, tipo_usuario, verificado, solicitou_reset, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Adm] Erro ao carregar usuários:', error)
        setError('Erro ao carregar usuários')
        return
      }

      const lista: Usuario[] = (data || []).map(u => ({
        id: u.id,
        email: u.email || '',
        nome: u.full_name || u.email || 'Sem nome',
        nome_empresa: u.nome_empresa || undefined,
        tipo_usuario: u.tipo_usuario || 'locatario',
        verificado: u.verificado || false,
        solicitou_reset: u.solicitou_reset || false,
        created_at: u.created_at
      }))

      setUsuarios(lista)
    } catch (err) {
      console.error('[Adm] Erro ao carregar usuários:', err)
      setError('Erro inesperado ao carregar usuários')
    } finally {
      setLoadingUsuarios(false)
    }
  }

  // Filtra usuários baseado na busca e filtros
  const usuariosFiltrados = useMemo(() => {
    let resultado = usuarios

    // Filtro por tipo
    if (filtroAtivo === 'locadores') {
      resultado = resultado.filter(u => u.tipo_usuario === 'locador')
    } else if (filtroAtivo === 'locatarios') {
      resultado = resultado.filter(u => u.tipo_usuario === 'locatario')
    } else if (filtroAtivo === 'pendentes_reset') {
      resultado = resultado.filter(u => u.solicitou_reset)
    }

    // Filtro por busca
    if (buscaUsuario.trim()) {
      const termo = buscaUsuario.toLowerCase()
      resultado = resultado.filter(u =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo) ||
        (u.nome_empresa && u.nome_empresa.toLowerCase().includes(termo))
      )
    }

    return resultado
  }, [usuarios, filtroAtivo, buscaUsuario])

  // Alterna o status de verificado do usuário
  const toggleVerificado = async (usuario: Usuario) => {
    setAlternandoVerificado(usuario.id)
    try {
      const novoStatus = !usuario.verificado

      const { error } = await supabase
        .from('profiles')
        .update({ verificado: novoStatus })
        .eq('id', usuario.id)

      if (error) {
        console.error('[Adm] Erro ao alterar verificado:', error)
        setError(`Erro ao alterar status: ${error.message}`)
        return
      }

      // Atualiza localmente
      setUsuarios(prev => prev.map(u =>
        u.id === usuario.id ? { ...u, verificado: novoStatus } : u
      ))

      setSucessoUsuario(`${usuario.nome} ${novoStatus ? 'verificado' : 'não verificado'} com sucesso!`)
      setTimeout(() => setSucessoUsuario(null), 3000)

      // Atualiza contadores
      await carregarResumo()
    } catch (err) {
      console.error('[Adm] Erro ao alterar verificado:', err)
      setError('Erro inesperado ao alterar status')
    } finally {
      setAlternandoVerificado(null)
    }
  }

  // Abre modal para resetar senha
  const abrirModalReset = (usuario: Usuario) => {
    setUsuarioParaReset(usuario)
    setNovaSenhaInput('')
    setMostrarSenhaInput(false)
    setModalResetAberto(true)
  }

  const fecharModalReset = () => {
    setModalResetAberto(false)
    setUsuarioParaReset(null)
    setNovaSenhaInput('')
  }

  // Executa o reset de senha via Edge Function
  const executarResetSenha = async () => {
    if (!usuarioParaReset || !novaSenhaInput) return

    if (novaSenhaInput.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      return
    }

    setResetandoSenha(usuarioParaReset.id)
    setSucessoUsuario(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: usuarioParaReset.id,
          novaSenha: novaSenhaInput
        }
      })

      if (fnError) {
        console.error('[Adm] Erro da Edge Function:', fnError)
        setError(fnError.message || 'Erro ao resetar senha')
        setResetandoSenha(null)
        return
      }

      if (data?.error) {
        console.error('[Adm] Erro retornado:', data.error)
        setError(data.error)
        setResetandoSenha(null)
        return
      }

      // Limpa a flag solicitou_reset
      await supabase
        .from('profiles')
        .update({ solicitou_reset: false })
        .eq('id', usuarioParaReset.id)

      // Atualiza localmente
      setUsuarios(prev => prev.map(u =>
        u.id === usuarioParaReset.id ? { ...u, solicitou_reset: false } : u
      ))

      fecharModalReset()
      setSucessoUsuario(`Senha de ${usuarioParaReset.nome} alterada com sucesso!`)
      setTimeout(() => setSucessoUsuario(null), 5000)

      await carregarResumo()
    } catch (err) {
      console.error('[Adm] Erro ao resetar senha:', err)
      setError('Erro de conexão ao resetar senha')
    } finally {
      setResetandoSenha(null)
    }
  }

  // Exclui usuário do sistema
  const excluirUsuario = async (usuario: Usuario) => {
    const confirma = window.confirm(
      `Tem certeza que deseja EXCLUIR "${usuario.nome}" (${usuario.email})?\n\nEsta ação é IRREVERSÍVEL!`
    )

    if (!confirma) return

    setExcluindoUsuario(usuario.id)
    setSucessoUsuario(null)

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', usuario.id)

      if (profileError) {
        console.error('[Adm] Erro ao excluir profile:', profileError)
        setError(`Erro ao excluir usuário: ${profileError.message}`)
        setExcluindoUsuario(null)
        return
      }

      setUsuarios(prev => prev.filter(u => u.id !== usuario.id))
      setSucessoUsuario(`Usuário ${usuario.nome} excluído com sucesso!`)
      setTimeout(() => setSucessoUsuario(null), 4000)

      await carregarResumo()
    } catch (err) {
      console.error('[Adm] Erro ao excluir usuário:', err)
      setError('Erro inesperado ao excluir usuário')
    } finally {
      setExcluindoUsuario(null)
    }
  }

  // Limpa o pedido de reset de senha (após resolver manualmente)
  const limparPedidoReset = async (usuario: Usuario) => {
    const confirma = window.confirm(
      `Confirma que o problema de senha de "${usuario.nome}" foi resolvido?\n\nIsso irá limpar o pedido de reset.`
    )

    if (!confirma) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ solicitou_reset: false })
        .eq('id', usuario.id)

      if (error) {
        console.error('[Adm] Erro ao limpar pedido:', error)
        setError(`Erro ao limpar pedido: ${error.message}`)
        return
      }

      // Atualiza localmente
      setUsuarios(prev => prev.map(u =>
        u.id === usuario.id ? { ...u, solicitou_reset: false } : u
      ))

      setSucessoUsuario(`Pedido de reset de ${usuario.nome} foi limpo!`)
      setTimeout(() => setSucessoUsuario(null), 3000)

      await carregarResumo()
    } catch (err) {
      console.error('[Adm] Erro ao limpar pedido:', err)
      setError('Erro inesperado ao limpar pedido')
    }
  }

  // Função para carregar detalhes de um locador específico
  const carregarDetalheLocador = async (locadorId: string, locadorNome: string) => {
    setModalAberto(true)
    setLoadingDetalhe(true)
    setDetalheLocador(null)

    try {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('id, email, full_name, nome_empresa, telefone')
        .eq('id', locadorId)
        .single()

      const { data: equipamentosData } = await supabase
        .from('equipamentos')
        .select('id, nome, categoria')
        .eq('locador_id', locadorId)

      const equipamentos = equipamentosData || []
      const equipIds = equipamentos.map(e => e.id)

      const { data: propostasData } = await supabase
        .from('propostas')
        .select('id, equipamento_id, created_at')
        .in('equipamento_id', equipIds)
        .eq('status', 'aceita')

      const propostas = propostasData || []
      const propostaIds = propostas.map(p => p.id)

      const { data: chatsData } = await supabase
        .from('chats')
        .select('id, locatario_id, proposta_id')
        .in('proposta_id', propostaIds)

      const chats = chatsData || []
      const clienteIds = [...new Set(chats.map(c => c.locatario_id).filter(Boolean))]

      const { data: clientesData } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa, email')
        .in('id', clienteIds)

      const clientesMap = new Map<string, string>()
      ;(clientesData || []).forEach(c => {
        clientesMap.set(c.id, c.nome_empresa || c.full_name || c.email || 'Cliente')
      })

      const propostaClienteMap = new Map<string, string>()
      chats.forEach(chat => {
        if (chat.proposta_id && chat.locatario_id) {
          propostaClienteMap.set(chat.proposta_id, clientesMap.get(chat.locatario_id) || 'Cliente')
        }
      })

      const equipamentosDetalhe: EquipamentoDetalhe[] = equipamentos.map(eq => {
        const propostaAtiva = propostas.find(p => p.equipamento_id === eq.id)
        if (propostaAtiva) {
          return {
            id: eq.id,
            nome: eq.nome,
            categoria: eq.categoria,
            status: 'locado' as const,
            cliente_atual: propostaClienteMap.get(propostaAtiva.id),
            data_inicio: propostaAtiva.created_at
          }
        }
        return {
          id: eq.id,
          nome: eq.nome,
          categoria: eq.categoria,
          status: 'disponivel' as const
        }
      })

      const historico: HistoricoLocacao[] = propostas.map(p => {
        const eq = equipamentos.find(e => e.id === p.equipamento_id)
        const clienteNome = propostaClienteMap.get(p.id) || 'Cliente'
        return {
          id: p.id,
          equipamento_nome: eq?.nome || 'Equipamento',
          cliente_nome: clienteNome,
          data_inicio: p.created_at,
          status: 'ativa' as const,
          valor_diaria: 0,
          dias: 0
        }
      }).sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime())

      const locacoesAtivas = equipamentosDetalhe.filter(e => e.status === 'locado').length

      setDetalheLocador({
        id: locadorId,
        nome: perfil?.nome_empresa || perfil?.full_name || locadorNome,
        email: perfil?.email || '',
        telefone: perfil?.telefone || undefined,
        equipamentos: equipamentosDetalhe,
        historico,
        locacoes_ativas: locacoesAtivas,
        total_equipamentos: equipamentos.length
      })
    } catch (err) {
      console.error('[Adm] Erro ao carregar detalhes:', err)
      setDetalheLocador(null)
    } finally {
      setLoadingDetalhe(false)
    }
  }

  const fecharModal = () => {
    setModalAberto(false)
    setDetalheLocador(null)
  }

  // =====================================================
  // FUNÇÕES DE ANALYTICS
  // =====================================================

  const MESES_PT: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
  }

  const carregarRankingClientes = async () => {
    try {
      // Tenta a view primeiro
      const { data: viewData, error: viewError } = await supabase
        .from('analytics_ranking_clientes')
        .select('*')
        .order('total_locacoes', { ascending: false })
        .limit(10)

      if (!viewError && viewData && viewData.length > 0) {
        setRankingClientes(viewData.map((r: any) => ({
          nome: r.nome || 'Cliente',
          email: r.email || '',
          total_locacoes: r.total_locacoes || 0,
          total_gasto: r.total_gasto || 0
        })))
        return
      }

      // Fallback: query propostas + profiles
      const { data: propostas } = await supabase
        .from('propostas')
        .select('id, locatario_id, valor_total, status')
        .eq('status', 'aceita')

      if (!propostas || propostas.length === 0) {
        setRankingClientes([])
        return
      }

      const clienteMap = new Map<string, { total_locacoes: number; total_gasto: number }>()
      propostas.forEach(p => {
        const id = p.locatario_id
        if (!id) return
        const existing = clienteMap.get(id) || { total_locacoes: 0, total_gasto: 0 }
        existing.total_locacoes += 1
        existing.total_gasto += (p.valor_total || 0)
        clienteMap.set(id, existing)
      })

      const clienteIds = [...clienteMap.keys()]
      if (clienteIds.length === 0) { setRankingClientes([]); return }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa, email')
        .in('id', clienteIds)

      const profileMap = new Map((profiles || []).map(p => [p.id, p]))

      const ranking: RankingCliente[] = clienteIds
        .map(id => {
          const prof = profileMap.get(id)
          const stats = clienteMap.get(id)!
          return {
            nome: prof?.nome_empresa || prof?.full_name || 'Cliente',
            email: prof?.email || '',
            total_locacoes: stats.total_locacoes,
            total_gasto: stats.total_gasto
          }
        })
        .sort((a, b) => b.total_locacoes - a.total_locacoes)
        .slice(0, 10)

      setRankingClientes(ranking)
    } catch (err) {
      console.error('[Adm] Erro ao carregar ranking clientes:', err)
      setRankingClientes([])
    }
  }

  const carregarInventarioQuente = async () => {
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('analytics_inventario_quente')
        .select('*')
        .order('locacoes', { ascending: false })
        .limit(10)

      if (!viewError && viewData && viewData.length > 0) {
        setInventarioQuente(viewData.map((r: any) => ({
          equipamento: r.equipamento || 'Equipamento',
          categoria: r.categoria || '',
          locador: r.locador || '',
          locacoes: r.locacoes || 0,
          receita: r.receita || 0
        })))
        return
      }

      // Fallback
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('id, nome, categoria, locador_id')

      if (!equipamentos || equipamentos.length === 0) {
        setInventarioQuente([])
        return
      }

      const { data: propostas } = await supabase
        .from('propostas')
        .select('id, equipamento_id, valor_total')
        .eq('status', 'aceita')

      const equipStats = new Map<string, { locacoes: number; receita: number }>()
      ;(propostas || []).forEach(p => {
        const existing = equipStats.get(p.equipamento_id) || { locacoes: 0, receita: 0 }
        existing.locacoes += 1
        existing.receita += (p.valor_total || 0)
        equipStats.set(p.equipamento_id, existing)
      })

      const locadorIds = [...new Set(equipamentos.map(e => e.locador_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa')
        .in('id', locadorIds)

      const profileMap = new Map((profiles || []).map(p => [
        p.id,
        p.nome_empresa || p.full_name || 'Locador'
      ]))

      const inventario: InventarioQuente[] = equipamentos
        .map(eq => {
          const stats = equipStats.get(eq.id) || { locacoes: 0, receita: 0 }
          return {
            equipamento: eq.nome,
            categoria: eq.categoria || '',
            locador: profileMap.get(eq.locador_id) || 'Locador',
            locacoes: stats.locacoes,
            receita: stats.receita
          }
        })
        .filter(e => e.locacoes > 0)
        .sort((a, b) => b.locacoes - a.locacoes)
        .slice(0, 10)

      setInventarioQuente(inventario)
    } catch (err) {
      console.error('[Adm] Erro ao carregar inventário quente:', err)
      setInventarioQuente([])
    }
  }

  const carregarReceitaMensal = async () => {
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('analytics_receita_mensal')
        .select('*')
        .order('mes', { ascending: false })
        .limit(12)

      if (!viewError && viewData && viewData.length > 0) {
        const sorted = [...viewData].sort((a: any, b: any) => (a.mes || '').localeCompare(b.mes || ''))
        const result: ReceitaMensal[] = sorted.map((r: any, idx: number) => {
          const mesKey = (r.mes || '').slice(5, 7)
          const ano = (r.mes || '').slice(0, 4)
          const prev = idx > 0 ? sorted[idx - 1] : null
          let variacao: number | null = null
          if (prev && (prev as any).total_receita > 0) {
            variacao = (((r.total_receita || 0) - ((prev as any).total_receita || 0)) / ((prev as any).total_receita || 1)) * 100
          }
          return {
            mes: r.mes,
            mes_label: `${MESES_PT[mesKey] || mesKey}/${ano}`,
            total_locacoes: r.total_locacoes || 0,
            total_receita: r.total_receita || 0,
            variacao_percentual: variacao
          }
        })
        setReceitaMensal(result.reverse())
        return
      }

      // Fallback
      const { data: propostas } = await supabase
        .from('propostas')
        .select('id, created_at, valor_total')
        .eq('status', 'aceita')

      if (!propostas || propostas.length === 0) {
        setReceitaMensal([])
        return
      }

      const mesMap = new Map<string, { count: number; receita: number }>()
      propostas.forEach(p => {
        const date = new Date(p.created_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const existing = mesMap.get(key) || { count: 0, receita: 0 }
        existing.count += 1
        existing.receita += (p.valor_total || 0)
        mesMap.set(key, existing)
      })

      const sorted = [...mesMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      const result: ReceitaMensal[] = sorted.map(([key, val], idx) => {
        const mesKey = key.slice(5, 7)
        const ano = key.slice(0, 4)
        let variacao: number | null = null
        if (idx > 0) {
          const prevVal = sorted[idx - 1][1]
          if (prevVal.receita > 0) {
            variacao = ((val.receita - prevVal.receita) / prevVal.receita) * 100
          }
        }
        return {
          mes: key,
          mes_label: `${MESES_PT[mesKey] || mesKey}/${ano}`,
          total_locacoes: val.count,
          total_receita: val.receita,
          variacao_percentual: variacao
        }
      })

      setReceitaMensal(result.reverse())
    } catch (err) {
      console.error('[Adm] Erro ao carregar receita mensal:', err)
      setReceitaMensal([])
    }
  }

  const carregarAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      await Promise.all([
        carregarRankingClientes(),
        carregarInventarioQuente(),
        carregarReceitaMensal()
      ])
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // =====================================================
  // FUNÇÕES DA ABA EQUIPAMENTOS
  // =====================================================

  const carregarEquipamentosAdmin = async () => {
    setLoadingEquipAdmin(true)
    try {
      const { data: equipamentos, error: eqError } = await supabase
        .from('equipamentos')
        .select('id, nome, categoria, locador_id, status, destaque')
        .order('nome')

      if (eqError || !equipamentos) {
        console.error('[Adm] Erro ao carregar equipamentos admin:', eqError)
        setEquipamentosAdmin([])
        return
      }

      const locadorIds = [...new Set(equipamentos.map(e => e.locador_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa')
        .in('id', locadorIds)

      const profileMap = new Map((profiles || []).map(p => [
        p.id,
        p.nome_empresa || p.full_name || 'Locador'
      ]))

      const lista: EquipamentoAdmin[] = equipamentos.map(eq => ({
        id: eq.id,
        nome: eq.nome || 'Equipamento',
        categoria: eq.categoria || '',
        locador_nome: profileMap.get(eq.locador_id) || 'Locador',
        status: eq.status || 'disponivel',
        destaque: eq.destaque || false
      }))

      setEquipamentosAdmin(lista)
    } catch (err) {
      console.error('[Adm] Erro ao carregar equipamentos admin:', err)
      setEquipamentosAdmin([])
    } finally {
      setLoadingEquipAdmin(false)
    }
  }

  const toggleDestaque = async (eqId: string, current: boolean) => {
    setToggling(eqId)
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update({ destaque: !current })
        .eq('id', eqId)

      if (error) {
        console.error('[Adm] Erro ao alterar destaque:', error)
        setError(`Erro ao alterar destaque: ${error.message}`)
        return
      }

      setEquipamentosAdmin(prev =>
        prev.map(eq => eq.id === eqId ? { ...eq, destaque: !current } : eq)
      )
    } catch (err) {
      console.error('[Adm] Erro ao alterar destaque:', err)
      setError('Erro inesperado ao alterar destaque')
    } finally {
      setToggling(null)
    }
  }

  const equipamentosAdminFiltrados = useMemo(() => {
    if (!buscaEquipAdmin.trim()) return equipamentosAdmin
    const termo = buscaEquipAdmin.toLowerCase()
    return equipamentosAdmin.filter(eq =>
      eq.nome.toLowerCase().includes(termo) ||
      eq.categoria.toLowerCase().includes(termo) ||
      eq.locador_nome.toLowerCase().includes(termo)
    )
  }, [equipamentosAdmin, buscaEquipAdmin])

  // Carrega dados da aba ao trocar
  const handleTabChange = (tab: TabAtiva) => {
    setTabAtiva(tab)
    if (tab === 'analytics' && rankingClientes.length === 0 && inventarioQuente.length === 0 && receitaMensal.length === 0) {
      carregarAnalytics()
    }
    if (tab === 'equipamentos' && equipamentosAdmin.length === 0) {
      carregarEquipamentosAdmin()
    }
  }

  const carregarDashboard = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        carregarResumo(),
        carregarLocadoras(),
        carregarUsuariosReset(),
        carregarUsuarios()
      ])
      setLastUpdate(new Date())
    } catch (err) {
      console.error('[Adm] Erro:', err)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const carregarUsuariosReset = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, nome_empresa, tipo_usuario')
        .eq('solicitou_reset', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Adm] Erro ao carregar usuários reset:', error)
        return
      }

      const usuarios: UsuarioResetSenha[] = (data || []).map(u => ({
        id: u.id,
        email: u.email || '',
        nome: u.nome_empresa || u.full_name || u.email || 'Usuário',
        tipo_usuario: u.tipo_usuario || 'locatario'
      }))

      setUsuariosReset(usuarios)
    } catch (err) {
      console.error('[Adm] Erro ao carregar usuários reset:', err)
    }
  }

  const enviarResetSenha = async (usuario: UsuarioResetSenha) => {
    setEnviandoReset(usuario.id)
    setResetSucesso(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(usuario.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      })

      if (resetError) {
        console.error('[Adm] Erro ao enviar reset:', resetError)
        setError(`Erro ao enviar reset para ${usuario.email}: ${resetError.message}`)
        setEnviandoReset(null)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ solicitou_reset: false })
        .eq('id', usuario.id)

      if (updateError) {
        console.error('[Adm] Erro ao limpar flag:', updateError)
      }

      setUsuariosReset(prev => prev.filter(u => u.id !== usuario.id))
      setUsuarios(prev => prev.map(u =>
        u.id === usuario.id ? { ...u, solicitou_reset: false } : u
      ))
      setResetSucesso(usuario.email)

      setTimeout(() => setResetSucesso(null), 3000)
      await carregarResumo()
    } catch (err) {
      console.error('[Adm] Erro inesperado:', err)
      setError('Erro inesperado ao enviar reset')
    } finally {
      setEnviandoReset(null)
    }
  }

  const carregarResumo = async () => {
    try {
      // Total de propostas aceitas (locações)
      const { count: totalLocacoes } = await supabase
        .from('propostas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aceita')

      // Total de locadores
      const { data: locadoresData } = await supabase
        .from('profiles')
        .select('id')
        .eq('tipo_usuario', 'locador')

      // Total de locatários
      const { data: locatariosData } = await supabase
        .from('profiles')
        .select('id')
        .eq('tipo_usuario', 'locatario')

      // Total de equipamentos
      const { count: totalEquipamentos } = await supabase
        .from('equipamentos')
        .select('*', { count: 'exact', head: true })

      // Locações ativas
      const { data: locacoesAtivasData } = await supabase
        .from('propostas')
        .select('id')
        .eq('status', 'aceita')

      // Usuários pendentes de reset
      const { count: usuariosPendentesReset } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('solicitou_reset', true)

      // Locadores verificados
      const { count: locadoresVerificados } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_usuario', 'locador')
        .eq('verificado', true)

      setResumo({
        total_locacoes: totalLocacoes || 0,
        total_locadores: locadoresData?.length || 0,
        total_locatarios: locatariosData?.length || 0,
        total_equipamentos: totalEquipamentos || 0,
        locacoes_ativas: (locacoesAtivasData || []).length,
        usuarios_pendentes_reset: usuariosPendentesReset || 0,
        locadores_verificados: locadoresVerificados || 0
      })
    } catch (err) {
      console.error('[Adm] Erro ao carregar resumo:', err)
      throw err
    }
  }

  const carregarLocadoras = async () => {
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('dashboard_adm')
        .select('*')
        .order('total_locacoes', { ascending: false })

      if (!viewError && viewData && viewData.length > 0) {
        const listaLocadoras: LocadoraResumo[] = viewData.map((row: {
          locador_id: string
          nome_locadora: string
          total_locacoes: number
          total_equipamentos: number
        }) => ({
          id: row.locador_id,
          nome: row.nome_locadora || 'Locador',
          total_locacoes: row.total_locacoes || 0,
          total_equipamentos: row.total_equipamentos || 0
        }))
        setLocadoras(listaLocadoras)
        return
      }

      // Fallback
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('id, locador_id')

      if (!equipamentos || equipamentos.length === 0) {
        setLocadoras([])
        return
      }

      const locadorEquipamentos = new Map<string, string[]>()
      equipamentos.forEach(eq => {
        if (!locadorEquipamentos.has(eq.locador_id)) {
          locadorEquipamentos.set(eq.locador_id, [])
        }
        locadorEquipamentos.get(eq.locador_id)!.push(eq.id)
      })

      const locadorIds = [...locadorEquipamentos.keys()]

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa, razao_social, email')
        .in('id', locadorIds)

      const profilesMap = new Map((profiles || []).map(p => [
        p.id,
        p.nome_empresa || p.razao_social || p.full_name || p.email || 'Locador'
      ]))

      const { data: propostas } = await supabase
        .from('propostas')
        .select('id, equipamento_id')
        .eq('status', 'aceita')

      const locacoesPorLocador = new Map<string, number>()
      ;(propostas || []).forEach(p => {
        const eq = equipamentos.find(e => e.id === p.equipamento_id)
        if (eq) {
          const count = locacoesPorLocador.get(eq.locador_id) || 0
          locacoesPorLocador.set(eq.locador_id, count + 1)
        }
      })

      const listaLocadoras: LocadoraResumo[] = locadorIds.map(id => ({
        id,
        nome: profilesMap.get(id) || 'Locador',
        total_locacoes: locacoesPorLocador.get(id) || 0,
        total_equipamentos: locadorEquipamentos.get(id)?.length || 0
      }))

      listaLocadoras.sort((a, b) => b.total_locacoes - a.total_locacoes)
      setLocadoras(listaLocadoras)
    } catch (err) {
      console.error('[Adm] Erro ao carregar locadoras:', err)
    }
  }

  useEffect(() => {
    carregarDashboard()
  }, [])

  // =====================================================
  // RENDER - LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  // =====================================================
  // RENDER - MAIN
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-sm border-b border-amber-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <HardHat className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">LocaObra <span className="text-amber-500">Admin</span></h1>
                <p className="text-xs text-zinc-400">Painel de Gestão</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={carregarDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-zinc-900 font-bold rounded-lg hover:bg-amber-400 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <span className="text-zinc-400 hidden sm:block text-sm font-medium">
              {profile?.nome_empresa || profile?.full_name || 'Admin'}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Última atualização */}
        {lastUpdate && (
          <p className="text-zinc-500 text-sm mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sucesso */}
        {sucessoUsuario && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{sucessoUsuario}</span>
          </div>
        )}

        {/* =====================================================
            DASHBOARD DE MÉTRICAS - 4 CARDS
        ===================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total de Máquinas */}
          <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50 hover:border-amber-500/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Package className="w-7 h-7 text-amber-500" />
              </div>
              <span className="text-3xl font-bold text-white">
                {resumo?.total_equipamentos || 0}
              </span>
            </div>
            <p className="text-zinc-400 text-base font-medium">Total de Máquinas</p>
            <p className="text-amber-500/80 text-sm mt-1">Cadastradas no sistema</p>
          </div>

          {/* Locações Ativas */}
          <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50 hover:border-green-500/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <TrendingUp className="w-7 h-7 text-green-500" />
              </div>
              <span className="text-3xl font-bold text-white">
                {resumo?.locacoes_ativas || 0}
              </span>
            </div>
            <p className="text-zinc-400 text-base font-medium">Locações Ativas</p>
            <p className="text-green-500/80 text-sm mt-1">Em andamento agora</p>
          </div>

          {/* Usuários Pendentes de Reset */}
          <div className={`bg-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 border transition-colors ${
            (resumo?.usuarios_pendentes_reset || 0) > 0
              ? 'border-red-500/50 animate-pulse'
              : 'border-zinc-700/50 hover:border-orange-500/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl ${
                (resumo?.usuarios_pendentes_reset || 0) > 0
                  ? 'bg-red-500/30'
                  : 'bg-orange-500/20'
              }`}>
                <KeyRound className={`w-7 h-7 ${
                  (resumo?.usuarios_pendentes_reset || 0) > 0
                    ? 'text-red-500'
                    : 'text-orange-500'
                }`} />
              </div>
              <span className={`text-3xl font-bold ${
                (resumo?.usuarios_pendentes_reset || 0) > 0
                  ? 'text-red-400'
                  : 'text-white'
              }`}>
                {resumo?.usuarios_pendentes_reset || 0}
              </span>
            </div>
            <p className="text-zinc-400 text-base font-medium">Pendentes de Reset</p>
            <p className={`text-sm mt-1 ${
              (resumo?.usuarios_pendentes_reset || 0) > 0
                ? 'text-red-400/80 font-medium'
                : 'text-orange-500/80'
            }`}>
              {(resumo?.usuarios_pendentes_reset || 0) > 0
                ? 'Ação necessária!'
                : 'Nenhum pendente'}
            </p>
          </div>

          {/* Locadores Verificados */}
          <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50 hover:border-yellow-500/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <BadgeCheck className="w-7 h-7 text-yellow-500" />
              </div>
              <span className="text-3xl font-bold text-white">
                {resumo?.locadores_verificados || 0}
              </span>
            </div>
            <p className="text-zinc-400 text-base font-medium">Locadores Verificados</p>
            <p className="text-yellow-500/80 text-sm mt-1">
              de {resumo?.total_locadores || 0} locadores
            </p>
          </div>
        </div>

        {/* =====================================================
            SISTEMA DE ABAS
        ===================================================== */}
        <div className="flex gap-1 mb-8 bg-zinc-800/60 backdrop-blur-sm rounded-xl p-1 border border-zinc-700/50">
          <button
            onClick={() => handleTabChange('usuarios')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              tabAtiva === 'usuarios'
                ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
          <button
            onClick={() => handleTabChange('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              tabAtiva === 'analytics'
                ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => handleTabChange('equipamentos')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              tabAtiva === 'equipamentos'
                ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
            }`}
          >
            <Package className="w-4 h-4" />
            Equipamentos
          </button>
        </div>

        {/* =====================================================
            CONTEÚDO DA ABA ATIVA
        ===================================================== */}

        {/* =====================================================
            ABA: USUARIOS
        ===================================================== */}
        {tabAtiva === 'usuarios' && (<>

        {/* =====================================================
            GESTÃO DE USUÁRIOS - TABELA PRO
        ===================================================== */}
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden mb-8">
          <div className="p-6 border-b border-zinc-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <UserCog className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Gestão de Usuários</h2>
                  <p className="text-zinc-400 text-sm">
                    {usuariosFiltrados.length} de {usuarios.length} usuários
                  </p>
                </div>
              </div>

              {/* Barra de Busca e Filtros */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={buscaUsuario}
                    onChange={(e) => setBuscaUsuario(e.target.value)}
                    placeholder="Buscar nome, email ou empresa..."
                    className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Filtros Rápidos */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltroAtivo('todos')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtroAtivo === 'todos'
                        ? 'bg-amber-500 text-zinc-900'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroAtivo('locadores')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      filtroAtivo === 'locadores'
                        ? 'bg-purple-500 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Locadores
                  </button>
                  <button
                    onClick={() => setFiltroAtivo('locatarios')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      filtroAtivo === 'locatarios'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Locatários
                  </button>
                  <button
                    onClick={() => setFiltroAtivo('pendentes_reset')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      filtroAtivo === 'pendentes_reset'
                        ? 'bg-red-500 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    } ${(resumo?.usuarios_pendentes_reset || 0) > 0 ? 'animate-pulse' : ''}`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Reset ({resumo?.usuarios_pendentes_reset || 0})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Usuários */}
          {loadingUsuarios ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
              <p className="text-zinc-400">Carregando usuários...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-lg">Nenhum usuário encontrado</p>
              <p className="text-zinc-500 text-sm mt-1">Tente ajustar os filtros ou a busca</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-900/50">
                    <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Usuário</th>
                    <th className="text-center text-zinc-400 font-semibold px-4 py-4 text-sm">Tipo</th>
                    <th className="text-center text-zinc-400 font-semibold px-4 py-4 text-sm">Verificado</th>
                    <th className="text-center text-zinc-400 font-semibold px-4 py-4 text-sm">Status</th>
                    <th className="text-right text-zinc-400 font-semibold px-6 py-4 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className={`border-t border-zinc-700/30 hover:bg-zinc-800/50 transition-colors ${
                        usuario.solicitou_reset ? 'bg-red-900/10' : ''
                      }`}
                    >
                      {/* Coluna: Usuário */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            usuario.tipo_usuario === 'locador'
                              ? 'bg-purple-500/20'
                              : 'bg-cyan-500/20'
                          }`}>
                            {usuario.tipo_usuario === 'locador'
                              ? <Building2 className="w-5 h-5 text-purple-400" />
                              : <Users className="w-5 h-5 text-cyan-400" />
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium text-base">{usuario.nome}</p>
                              {usuario.verificado && (
                                <span title="Verificado">
                                  <BadgeCheck className="w-5 h-5 text-yellow-500" />
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-500 text-sm">{usuario.email}</p>
                            {usuario.nome_empresa && (
                              <p className="text-zinc-400 text-xs mt-0.5">{usuario.nome_empresa}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Coluna: Tipo */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                          usuario.tipo_usuario === 'locador'
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/30'
                            : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {usuario.tipo_usuario === 'locador' ? 'LOCADOR' : 'LOCATÁRIO'}
                        </span>
                      </td>

                      {/* Coluna: Verificado (Toggle) */}
                      <td className="px-4 py-4 text-center">
                        {usuario.tipo_usuario === 'locador' ? (
                          <button
                            onClick={() => toggleVerificado(usuario)}
                            disabled={alternandoVerificado === usuario.id}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                              usuario.verificado
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700'
                            }`}
                            title={usuario.verificado ? 'Remover verificação' : 'Verificar locador'}
                          >
                            {alternandoVerificado === usuario.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : usuario.verificado ? (
                              <ToggleRight className="w-6 h-6" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                            <span className="text-xs font-medium">
                              {usuario.verificado ? 'Verificado' : 'Verificar'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-zinc-600 text-xs">N/A</span>
                        )}
                      </td>

                      {/* Coluna: Status */}
                      <td className="px-4 py-4 text-center">
                        {usuario.solicitou_reset ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/30 text-red-400 rounded-full text-xs font-bold animate-pulse border border-red-500/50">
                            <AlertTriangle className="w-4 h-4" />
                            RESET PENDENTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            <Check className="w-4 h-4" />
                            Ativo
                          </span>
                        )}
                      </td>

                      {/* Coluna: Ações */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Limpar Pedido (só aparece se solicitou_reset) */}
                          {usuario.solicitou_reset && (
                            <button
                              onClick={() => limparPedidoReset(usuario)}
                              className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-xs font-medium flex items-center gap-1.5"
                              title="Limpar Pedido de Reset"
                            >
                              <Check className="w-4 h-4" />
                              Limpar
                            </button>
                          )}

                          {/* Botão Resetar Senha */}
                          <button
                            onClick={() => abrirModalReset(usuario)}
                            className={`p-2 rounded-lg transition-colors ${
                              usuario.solicitou_reset
                                ? 'bg-red-500 text-white hover:bg-red-600 animate-bounce'
                                : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                            }`}
                            title="Resetar Senha"
                          >
                            <KeyRound className="w-5 h-5" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            onClick={() => excluirUsuario(usuario)}
                            disabled={excluindoUsuario === usuario.id}
                            className="p-2 bg-zinc-700/50 text-zinc-400 rounded-lg hover:bg-red-500/30 hover:text-red-400 transition-colors"
                            title="Excluir Usuário"
                          >
                            {excluindoUsuario === usuario.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =====================================================
            TABELA: VOLUME POR LOCADORA
        ===================================================== */}
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
          <div className="p-6 border-b border-zinc-700/50">
            <h2 className="text-xl font-bold text-white">Volume por Locadora</h2>
            <p className="text-zinc-400 mt-1 text-sm">Clique em uma linha para ver detalhes</p>
          </div>

          {locadoras.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-lg">Nenhuma locadora cadastrada ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-900/50">
                    <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">#</th>
                    <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Locadora</th>
                    <th className="text-center text-zinc-400 font-semibold px-6 py-4 text-sm">Equipamentos</th>
                    <th className="text-center text-zinc-400 font-semibold px-6 py-4 text-sm">Locações</th>
                    <th className="text-center text-zinc-400 font-semibold px-6 py-4 text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {locadoras.map((locadora, index) => (
                    <tr
                      key={locadora.id}
                      onClick={() => carregarDetalheLocador(locadora.id, locadora.nome)}
                      className="border-t border-zinc-700/30 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${index < 3 ? 'text-amber-500' : 'text-zinc-500'}`}>
                          {index + 1}º
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Building2 className="w-5 h-5 text-purple-400" />
                          </div>
                          <span className="text-white font-medium text-base">{locadora.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-zinc-300 text-lg font-medium">{locadora.total_equipamentos}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-2xl font-bold ${locadora.total_locacoes > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                          {locadora.total_locacoes}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Eye className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        </>)}

        {/* =====================================================
            ABA: ANALYTICS
        ===================================================== */}
        {tabAtiva === 'analytics' && (
          <div className="space-y-6">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                <p className="text-white ml-4 text-lg">Carregando analytics...</p>
              </div>
            ) : (
              <>
                {/* Panel 1: Ranking de Clientes */}
                <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
                  <div className="p-6 border-b border-zinc-700/50 flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Ranking de Clientes</h2>
                      <p className="text-zinc-400 text-sm">Top locatarios por volume de locacoes</p>
                    </div>
                  </div>
                  {rankingClientes.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400 text-lg">Nenhum dado de ranking disponivel</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-zinc-900/50">
                            <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">#</th>
                            <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Nome</th>
                            <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Email</th>
                            <th className="text-center text-zinc-400 font-semibold px-6 py-4 text-sm">Total Locacoes</th>
                            <th className="text-right text-zinc-400 font-semibold px-6 py-4 text-sm">Total Gasto (R$)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankingClientes.map((cliente, idx) => (
                            <tr
                              key={idx}
                              className={`border-t border-zinc-700/30 transition-colors ${
                                idx < 3 ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'hover:bg-zinc-800/50'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <span className={`text-lg font-bold ${idx < 3 ? 'text-amber-500' : 'text-zinc-500'}`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-white font-medium">{cliente.nome}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-zinc-400 text-sm">{cliente.email}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-white font-semibold text-lg">{cliente.total_locacoes}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-green-400 font-semibold">
                                  R$ {cliente.total_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Panel 2: Inventario Quente */}
                <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
                  <div className="p-6 border-b border-zinc-700/50 flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Inventario Quente</h2>
                      <p className="text-zinc-400 text-sm">Equipamentos mais locados</p>
                    </div>
                  </div>
                  {inventarioQuente.length === 0 ? (
                    <div className="p-12 text-center">
                      <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400 text-lg">Nenhum dado de inventario disponivel</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-zinc-900/50">
                            <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">#</th>
                            <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Equipamento</th>
                            <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Categoria</th>
                            <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Locador</th>
                            <th className="text-center text-zinc-400 font-semibold px-6 py-4 text-sm">Locacoes</th>
                            <th className="text-right text-zinc-400 font-semibold px-6 py-4 text-sm">Receita (R$)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventarioQuente.map((item, idx) => (
                            <tr
                              key={idx}
                              className="border-t border-zinc-700/30 hover:bg-zinc-800/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <span className={`text-lg font-bold ${idx < 3 ? 'text-amber-500' : 'text-zinc-500'}`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-white font-medium">{item.equipamento}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-zinc-400">{item.categoria}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-zinc-300">{item.locador}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-white font-semibold text-lg">{item.locacoes}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-green-400 font-semibold">
                                  R$ {item.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Panel 3: Receita Mensal */}
                <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
                  <div className="p-6 border-b border-zinc-700/50 flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Receita Mensal</h2>
                      <p className="text-zinc-400 text-sm">Evolucao da receita por mes</p>
                    </div>
                  </div>
                  {receitaMensal.length === 0 ? (
                    <div className="p-12 text-center">
                      <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400 text-lg">Nenhum dado de receita disponivel</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-zinc-900/50">
                            <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Mes</th>
                            <th className="text-center text-zinc-400 font-semibold px-6 py-4 text-sm">Locacoes</th>
                            <th className="text-right text-zinc-400 font-semibold px-6 py-4 text-sm">Receita (R$)</th>
                            <th className="text-right text-zinc-400 font-semibold px-6 py-4 text-sm">Variacao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receitaMensal.map((mes, idx) => (
                            <tr
                              key={idx}
                              className="border-t border-zinc-700/30 hover:bg-zinc-800/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <span className="text-white font-medium">{mes.mes_label}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-white font-semibold">{mes.total_locacoes}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-green-400 font-semibold">
                                  R$ {mes.total_receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {mes.variacao_percentual !== null ? (
                                  <span className={`inline-flex items-center gap-1 font-semibold text-sm ${
                                    mes.variacao_percentual >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {mes.variacao_percentual >= 0 ? (
                                      <ArrowUpRight className="w-4 h-4" />
                                    ) : (
                                      <ArrowDownRight className="w-4 h-4" />
                                    )}
                                    {Math.abs(mes.variacao_percentual).toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-zinc-600 text-sm">--</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* =====================================================
            ABA: EQUIPAMENTOS
        ===================================================== */}
        {tabAtiva === 'equipamentos' && (
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
            <div className="p-6 border-b border-zinc-700/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Package className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Gestao de Equipamentos</h2>
                    <p className="text-zinc-400 text-sm">
                      {equipamentosAdminFiltrados.length} de {equipamentosAdmin.length} equipamentos
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={buscaEquipAdmin}
                    onChange={(e) => setBuscaEquipAdmin(e.target.value)}
                    placeholder="Buscar equipamento, categoria ou locador..."
                    className="w-full sm:w-80 pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {loadingEquipAdmin ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
                <p className="text-zinc-400">Carregando equipamentos...</p>
              </div>
            ) : equipamentosAdminFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-lg">Nenhum equipamento encontrado</p>
                <p className="text-zinc-500 text-sm mt-1">Tente ajustar a busca</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-900/50">
                      <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Nome</th>
                      <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Categoria</th>
                      <th className="text-left text-zinc-400 font-semibold px-6 py-4 text-sm">Locador</th>
                      <th className="text-center text-zinc-400 font-semibold px-6 py-4 text-sm">Status</th>
                      <th className="text-center text-zinc-400 font-semibold px-6 py-4 text-sm">Destaque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipamentosAdminFiltrados.map((eq) => (
                      <tr
                        key={eq.id}
                        className="border-t border-zinc-700/30 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {eq.destaque && (
                              <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            )}
                            <span className="text-white font-medium">{eq.nome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-zinc-400">{eq.categoria}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-zinc-300">{eq.locador_nome}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            eq.status === 'disponivel'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : eq.status === 'locado'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              eq.status === 'disponivel' ? 'bg-green-400'
                              : eq.status === 'locado' ? 'bg-amber-400'
                              : 'bg-zinc-400'
                            }`} />
                            {eq.status === 'disponivel' ? 'Disponivel' : eq.status === 'locado' ? 'Locado' : eq.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleDestaque(eq.id, eq.destaque)}
                            disabled={toggling === eq.id}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                              eq.destaque
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700'
                            }`}
                            title={eq.destaque ? 'Remover destaque' : 'Promover como destaque'}
                          >
                            {toggling === eq.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : eq.destaque ? (
                              <ToggleRight className="w-6 h-6" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                            <span className="text-xs font-medium">
                              {eq.destaque ? 'Destaque' : 'Promover'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =====================================================
          MODAL: DETALHES DO LOCADOR
      ===================================================== */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {loadingDetalhe ? 'Carregando...' : detalheLocador?.nome || 'Detalhes'}
                </h2>
                {detalheLocador && (
                  <p className="text-zinc-400 mt-1 text-sm">
                    {detalheLocador.email}
                    {detalheLocador.telefone && ` | ${detalheLocador.telefone}`}
                  </p>
                )}
              </div>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetalhe ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                </div>
              ) : detalheLocador ? (
                <div className="space-y-6">
                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-blue-400" />
                        <div>
                          <p className="text-3xl font-bold text-white">{detalheLocador.total_equipamentos}</p>
                          <p className="text-blue-300 text-sm">Equipamentos</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-3xl font-bold text-white">{detalheLocador.locacoes_ativas}</p>
                          <p className="text-green-300 text-sm">Locações Ativas</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Equipamentos */}
                  <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
                    <div className="p-4 border-b border-zinc-700 flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-semibold text-white">Equipamentos</h3>
                    </div>
                    {detalheLocador.equipamentos.length === 0 ? (
                      <div className="p-6 text-center text-zinc-400">
                        Nenhum equipamento cadastrado
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-700/50">
                        {detalheLocador.equipamentos.map((eq) => (
                          <div key={eq.id} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{eq.nome}</p>
                              <p className="text-zinc-500 text-sm">{eq.categoria}</p>
                            </div>
                            <div className="text-right">
                              {eq.status === 'disponivel' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                  Disponível
                                </span>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                                    <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                                    Locado
                                  </span>
                                  {eq.cliente_atual && (
                                    <p className="text-zinc-500 text-xs mt-1">{eq.cliente_atual}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Histórico de Locações */}
                  <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
                    <div className="p-4 border-b border-zinc-700 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-semibold text-white">Histórico de Locações</h3>
                    </div>
                    {detalheLocador.historico.length === 0 ? (
                      <div className="p-6 text-center text-zinc-400">
                        Nenhuma locação realizada ainda
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-zinc-900/50">
                              <th className="text-left text-zinc-400 font-medium px-4 py-3 text-sm">Equipamento</th>
                              <th className="text-left text-zinc-400 font-medium px-4 py-3 text-sm">Cliente</th>
                              <th className="text-left text-zinc-400 font-medium px-4 py-3 text-sm">Data</th>
                              <th className="text-center text-zinc-400 font-medium px-4 py-3 text-sm">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalheLocador.historico.map((loc) => (
                              <tr key={loc.id} className="border-t border-zinc-700/50">
                                <td className="px-4 py-3">
                                  <span className="text-white">{loc.equipamento_nome}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-zinc-300">{loc.cliente_nome}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {new Date(loc.data_inicio).toLocaleDateString('pt-BR')}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {loc.status === 'ativa' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                                      Em andamento
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                                      <Check className="w-3 h-3" />
                                      Finalizada
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-400">
                  Erro ao carregar detalhes
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: RESET DE SENHA
      ===================================================== */}
      {modalResetAberto && usuarioParaReset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-md">
            <div className="p-6 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Resetar Senha</h2>
                  <p className="text-zinc-400 text-sm">{usuarioParaReset.nome}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Email do usuário:</p>
                <p className="text-white font-medium">{usuarioParaReset.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenhaInput ? 'text' : 'password'}
                    value={novaSenhaInput}
                    onChange={(e) => setNovaSenhaInput(e.target.value)}
                    placeholder="Digite a nova senha (mín. 6 caracteres)"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaInput(!mostrarSenhaInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {mostrarSenhaInput ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-zinc-500 text-xs mt-2">
                  O usuário será deslogado e precisará usar esta senha para entrar novamente.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <p className="text-amber-400 text-sm">
                  <strong>Atenção:</strong> Ao confirmar, o usuário será deslogado automaticamente.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-700 flex gap-3">
              <button
                onClick={fecharModalReset}
                className="flex-1 px-4 py-3 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                Cancelar
              </button>
              <button
                onClick={executarResetSenha}
                disabled={!novaSenhaInput || novaSenhaInput.length < 6 || resetandoSenha === usuarioParaReset.id}
                className="flex-1 px-4 py-3 bg-amber-500 text-zinc-900 font-bold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resetandoSenha === usuarioParaReset.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Resetando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Confirmar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
