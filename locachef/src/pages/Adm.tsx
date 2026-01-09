import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { HardHat, Loader2, TrendingUp, Users, Package, ArrowLeft, RefreshCw, AlertCircle, Building2, KeyRound, Mail, Check, X, Eye, Calendar, Clock } from 'lucide-react'

// Interface para dados resumidos
interface ResumoData {
  total_locacoes: number
  total_locadores: number
  total_locatarios: number
  total_equipamentos: number
  locacoes_ativas: number
}

// Interface para tabela de locadoras
interface LocadoraResumo {
  id: string
  nome: string
  total_locacoes: number
  total_equipamentos: number
}

// Interface para usuários que solicitaram reset de senha
interface UsuarioResetSenha {
  id: string
  email: string
  nome: string
  tipo_usuario: string
}

// Interface para equipamento com status detalhado
interface EquipamentoDetalhe {
  id: string
  nome: string
  categoria: string
  status: 'disponivel' | 'locado' | 'pendente'
  cliente_atual?: string
  data_inicio?: string
}

// Interface para histórico de locação
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

// Interface para detalhes completos do locador
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

  // Função para carregar detalhes de um locador específico
  const carregarDetalheLocador = async (locadorId: string, locadorNome: string) => {
    setModalAberto(true)
    setLoadingDetalhe(true)
    setDetalheLocador(null)

    try {
      // 1. Buscar perfil do locador
      const { data: perfil } = await supabase
        .from('profiles')
        .select('id, email, full_name, nome_empresa, telefone')
        .eq('id', locadorId)
        .single()

      // 2. Buscar todos os equipamentos do locador
      const { data: equipamentosData } = await supabase
        .from('equipamentos')
        .select('id, nome, categoria')
        .eq('locador_id', locadorId)

      const equipamentos = equipamentosData || []
      const equipIds = equipamentos.map(e => e.id)

      // 3. Buscar propostas aceitas desses equipamentos
      const { data: propostasData } = await supabase
        .from('propostas')
        .select('id, equipamento_id, status_entrega, valor_diaria, dias_solicitados, created_at')
        .in('equipamento_id', equipIds)
        .eq('status', 'aceita')

      const propostas = propostasData || []

      // 4. Buscar chats relacionados para pegar os clientes
      const propostaIds = propostas.map(p => p.id)
      const { data: chatsData } = await supabase
        .from('chats')
        .select('id, locatario_id, proposta_id')
        .in('proposta_id', propostaIds)

      const chats = chatsData || []

      // 5. Buscar perfis dos clientes (locatários)
      const clienteIds = [...new Set(chats.map(c => c.locatario_id).filter(Boolean))]
      const { data: clientesData } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa, email')
        .in('id', clienteIds)

      const clientesMap = new Map<string, string>()
      ;(clientesData || []).forEach(c => {
        clientesMap.set(c.id, c.nome_empresa || c.full_name || c.email || 'Cliente')
      })

      // Mapear proposta -> cliente
      const propostaClienteMap = new Map<string, string>()
      chats.forEach(chat => {
        if (chat.proposta_id && chat.locatario_id) {
          propostaClienteMap.set(chat.proposta_id, clientesMap.get(chat.locatario_id) || 'Cliente')
        }
      })

      // 6. Montar lista de equipamentos com status
      const equipamentosDetalhe: EquipamentoDetalhe[] = equipamentos.map(eq => {
        // Verificar se tem proposta ativa (aceita e não devolvido)
        const propostaAtiva = propostas.find(p =>
          p.equipamento_id === eq.id &&
          (!p.status_entrega || p.status_entrega !== 'DEVOLVIDO')
        )

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

      // 7. Montar histórico de locações
      const historico: HistoricoLocacao[] = propostas.map(p => {
        const eq = equipamentos.find(e => e.id === p.equipamento_id)
        const clienteNome = propostaClienteMap.get(p.id) || 'Cliente'
        const isAtiva = !p.status_entrega || p.status_entrega !== 'DEVOLVIDO'

        return {
          id: p.id,
          equipamento_nome: eq?.nome || 'Equipamento',
          cliente_nome: clienteNome,
          data_inicio: p.created_at,
          status: isAtiva ? 'ativa' as const : 'finalizada' as const,
          valor_diaria: p.valor_diaria || 0,
          dias: p.dias_solicitados || 0
        }
      }).sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime())

      // 8. Contadores
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

  const carregarDashboard = async () => {
    setLoading(true)
    setError(null)

    try {
      // Carrega resumo geral
      await carregarResumo()

      // Carrega tabela de locadoras
      await carregarLocadoras()

      // Carrega usuários que solicitaram reset de senha
      await carregarUsuariosReset()

      setLastUpdate(new Date())
    } catch (err) {
      console.error('[Adm] Erro:', err)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Carrega usuários que solicitaram reset de senha
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

  // Envia email de reset de senha via Supabase e limpa a flag
  const enviarResetSenha = async (usuario: UsuarioResetSenha) => {
    setEnviandoReset(usuario.id)
    setResetSucesso(null)

    try {
      // 1. Dispara o email de reset via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(usuario.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      })

      if (resetError) {
        console.error('[Adm] Erro ao enviar reset:', resetError)
        setError(`Erro ao enviar reset para ${usuario.email}: ${resetError.message}`)
        setEnviandoReset(null)
        return
      }

      // 2. Limpa a flag solicitou_reset no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ solicitou_reset: false })
        .eq('id', usuario.id)

      if (updateError) {
        console.error('[Adm] Erro ao limpar flag:', updateError)
        // Não retorna erro pois o email já foi enviado
      }

      // 3. Remove da lista local
      setUsuariosReset(prev => prev.filter(u => u.id !== usuario.id))
      setResetSucesso(usuario.email)

      // Limpa mensagem de sucesso após 3 segundos
      setTimeout(() => setResetSucesso(null), 3000)

    } catch (err) {
      console.error('[Adm] Erro inesperado:', err)
      setError('Erro inesperado ao enviar reset')
    } finally {
      setEnviandoReset(null)
    }
  }

  // Carrega dados de resumo (sem valores monetários)
  const carregarResumo = async () => {
    try {
      // Total de propostas aceitas (locações)
      const { count: totalLocacoes } = await supabase
        .from('propostas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aceita')

      // Total de locadores (quem tem equipamentos cadastrados)
      const { data: locadoresData } = await supabase
        .from('equipamentos')
        .select('locador_id')

      const locadoresUnicos = new Set((locadoresData || []).map(e => e.locador_id))

      // Total de locatários (usuários que fizeram locações)
      const { data: chatsData } = await supabase
        .from('chats')
        .select('locatario_id')

      const locatariosUnicos = new Set((chatsData || []).map(c => c.locatario_id))

      // Total de equipamentos
      const { count: totalEquipamentos } = await supabase
        .from('equipamentos')
        .select('*', { count: 'exact', head: true })

      // Locações ativas (propostas aceitas sem status_entrega = DEVOLVIDO)
      const { data: locacoesAtivasData } = await supabase
        .from('propostas')
        .select('id, status_entrega')
        .eq('status', 'aceita')

      const locacoesAtivas = (locacoesAtivasData || []).filter(p => {
        const statusEntrega = (p as { status_entrega?: string }).status_entrega
        return !statusEntrega || statusEntrega !== 'DEVOLVIDO'
      }).length

      setResumo({
        total_locacoes: totalLocacoes || 0,
        total_locadores: locadoresUnicos.size,
        total_locatarios: locatariosUnicos.size,
        total_equipamentos: totalEquipamentos || 0,
        locacoes_ativas: locacoesAtivas
      })
    } catch (err) {
      console.error('[Adm] Erro ao carregar resumo:', err)
      throw err
    }
  }

  // Carrega tabela de locadoras usando a view dashboard_adm (com fallback)
  const carregarLocadoras = async () => {
    try {
      // Tenta usar a view dashboard_adm primeiro
      const { data: viewData, error: viewError } = await supabase
        .from('dashboard_adm')
        .select('*')
        .order('total_locacoes', { ascending: false })

      if (!viewError && viewData && viewData.length > 0) {
        // View disponível - usa os dados dela
        console.log('[Adm] Usando dados da view dashboard_adm')
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

      // Fallback: consultas diretas se a view não existir
      console.log('[Adm] View não disponível, usando fallback:', viewError?.message)

      // Busca todos os locadores (quem tem equipamentos)
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('id, locador_id')

      if (!equipamentos || equipamentos.length === 0) {
        setLocadoras([])
        return
      }

      // Agrupa equipamentos por locador
      const locadorEquipamentos = new Map<string, string[]>()
      equipamentos.forEach(eq => {
        if (!locadorEquipamentos.has(eq.locador_id)) {
          locadorEquipamentos.set(eq.locador_id, [])
        }
        locadorEquipamentos.get(eq.locador_id)!.push(eq.id)
      })

      const locadorIds = [...locadorEquipamentos.keys()]

      // Busca perfis dos locadores
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa, razao_social, email')
        .in('id', locadorIds)

      const profilesMap = new Map((profiles || []).map(p => [
        p.id,
        p.nome_empresa || p.razao_social || p.full_name || p.email || 'Locador'
      ]))

      // ESTRUTURA REAL: chats tem proposta_id (não propostas tem chat_id)
      // Busca propostas aceitas por locador via equipamento_id
      const { data: propostas } = await supabase
        .from('propostas')
        .select('id, equipamento_id')
        .eq('status', 'aceita')

      // Conta locações por locador via equipamento_id
      const locacoesPorLocador = new Map<string, number>()
      ;(propostas || []).forEach(p => {
        // Encontra o locador deste equipamento
        const eq = equipamentos.find(e => e.id === p.equipamento_id)
        if (eq) {
          const count = locacoesPorLocador.get(eq.locador_id) || 0
          locacoesPorLocador.set(eq.locador_id, count + 1)
        }
      })

      // Monta lista de locadoras
      const listaLocadoras: LocadoraResumo[] = locadorIds.map(id => ({
        id,
        nome: profilesMap.get(id) || 'Locador',
        total_locacoes: locacoesPorLocador.get(id) || 0,
        total_equipamentos: locadorEquipamentos.get(id)?.length || 0
      }))

      // Ordena por total de locações (decrescente)
      listaLocadoras.sort((a, b) => b.total_locacoes - a.total_locacoes)

      setLocadoras(listaLocadoras)
    } catch (err) {
      console.error('[Adm] Erro ao carregar locadoras:', err)
    }
  }

  useEffect(() => {
    carregarDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-white text-lg">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-zinc-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-2">
              <HardHat className="w-8 h-8 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">LocaObra</h1>
                <p className="text-xs text-gray-400">Painel de Monitoramento</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={carregarDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <span className="text-gray-400 hidden sm:block text-sm">
              {profile?.nome_empresa || profile?.full_name || 'Admin'}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Última atualização */}
        {lastUpdate && (
          <p className="text-gray-400 text-sm mb-6">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Cards de métricas - Foco em volume, sem valores monetários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Locações */}
          <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/80 text-lg font-medium">Locações</span>
            </div>
            <p className="text-4xl font-bold text-white">
              {resumo?.total_locacoes || 0}
            </p>
            <p className="text-amber-200 text-base mt-2">
              {resumo?.locacoes_ativas || 0} em andamento
            </p>
          </div>

          {/* Total de Equipamentos */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Package className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/80 text-lg font-medium">Equipamentos</span>
            </div>
            <p className="text-4xl font-bold text-white">
              {resumo?.total_equipamentos || 0}
            </p>
            <p className="text-blue-200 text-base mt-2">Cadastrados</p>
          </div>

          {/* Locadores */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/80 text-lg font-medium">Locadores</span>
            </div>
            <p className="text-4xl font-bold text-white">
              {resumo?.total_locadores || 0}
            </p>
            <p className="text-purple-200 text-base mt-2">Empresas/Pessoas</p>
          </div>

          {/* Locatários */}
          <div className="bg-gradient-to-br from-cyan-600 to-teal-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/80 text-lg font-medium">Locatários</span>
            </div>
            <p className="text-4xl font-bold text-white">
              {resumo?.total_locatarios || 0}
            </p>
            <p className="text-cyan-200 text-base mt-2">Clientes ativos</p>
          </div>
        </div>

        {/* Seção de Reset de Senha - Destaque laranja */}
        {usuariosReset.length > 0 && (
          <div className="bg-orange-900/30 backdrop-blur-sm rounded-2xl border-2 border-orange-500 overflow-hidden mb-8">
            <div className="p-6 border-b border-orange-500/30 flex items-center gap-3">
              <KeyRound className="w-7 h-7 text-orange-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Solicitações de Reset de Senha</h2>
                <p className="text-orange-300 mt-1">{usuariosReset.length} usuário(s) aguardando reset</p>
              </div>
            </div>

            {/* Toast de sucesso */}
            {resetSucesso && (
              <div className="mx-6 mt-4 p-4 bg-green-600 text-white rounded-xl flex items-center gap-3">
                <Check className="w-6 h-6" />
                <span className="text-lg font-medium">Email de reset enviado para {resetSucesso}</span>
              </div>
            )}

            <div className="p-6 space-y-4">
              {usuariosReset.map((usuario) => (
                <div
                  key={usuario.id}
                  className="bg-orange-950/50 rounded-xl p-5 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-full">
                      <Mail className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{usuario.nome}</p>
                      <p className="text-orange-300 text-base">{usuario.email}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Tipo: {usuario.tipo_usuario === 'locador' ? 'Locador' : 'Locatário'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => enviarResetSenha(usuario)}
                    disabled={enviandoReset === usuario.id}
                    className="px-6 py-3 bg-orange-600 text-white font-bold text-lg rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
                  >
                    {enviandoReset === usuario.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>Enviar Reset Agora</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabela principal: Locadora x Pessoas Alugando */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Volume por Locadora</h2>
            <p className="text-gray-400 mt-1">Clique em uma linha para ver detalhes</p>
          </div>

          {locadoras.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhuma locadora cadastrada ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left text-gray-400 font-medium px-6 py-4 text-base">#</th>
                    <th className="text-left text-gray-400 font-medium px-6 py-4 text-base">Locadora</th>
                    <th className="text-center text-gray-400 font-medium px-6 py-4 text-base">Equipamentos</th>
                    <th className="text-center text-gray-400 font-medium px-6 py-4 text-base">Locações</th>
                    <th className="text-center text-gray-400 font-medium px-6 py-4 text-base"></th>
                  </tr>
                </thead>
                <tbody>
                  {locadoras.map((locadora, index) => (
                    <tr
                      key={locadora.id}
                      onClick={() => carregarDetalheLocador(locadora.id, locadora.nome)}
                      className="border-t border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${index < 3 ? 'text-amber-500' : 'text-gray-500'}`}>
                          {index + 1}º
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Building2 className="w-5 h-5 text-purple-400" />
                          </div>
                          <span className="text-white font-medium text-lg">{locadora.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-300 text-lg">{locadora.total_equipamentos}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-2xl font-bold ${locadora.total_locacoes > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          {locadora.total_locacoes}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Eye className="w-5 h-5 text-gray-500 group-hover:text-amber-500 transition-colors mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes do Locador */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {loadingDetalhe ? 'Carregando...' : detalheLocador?.nome || 'Detalhes'}
                </h2>
                {detalheLocador && (
                  <p className="text-gray-400 mt-1">
                    {detalheLocador.email}
                    {detalheLocador.telefone && ` | ${detalheLocador.telefone}`}
                  </p>
                )}
              </div>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
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
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-500" />
                      <h3 className="text-lg font-semibold text-white">Equipamentos</h3>
                    </div>
                    {detalheLocador.equipamentos.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">
                        Nenhum equipamento cadastrado
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {detalheLocador.equipamentos.map((eq) => (
                          <div key={eq.id} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{eq.nome}</p>
                              <p className="text-gray-400 text-sm">{eq.categoria}</p>
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
                                    <p className="text-gray-400 text-xs mt-1">{eq.cliente_atual}</p>
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
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      <h3 className="text-lg font-semibold text-white">Histórico de Locações</h3>
                    </div>
                    {detalheLocador.historico.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">
                        Nenhuma locação realizada ainda
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-white/5">
                              <th className="text-left text-gray-400 font-medium px-4 py-3 text-sm">Equipamento</th>
                              <th className="text-left text-gray-400 font-medium px-4 py-3 text-sm">Cliente</th>
                              <th className="text-left text-gray-400 font-medium px-4 py-3 text-sm">Data</th>
                              <th className="text-center text-gray-400 font-medium px-4 py-3 text-sm">Dias</th>
                              <th className="text-center text-gray-400 font-medium px-4 py-3 text-sm">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalheLocador.historico.map((loc) => (
                              <tr key={loc.id} className="border-t border-white/5">
                                <td className="px-4 py-3">
                                  <span className="text-white">{loc.equipamento_nome}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-gray-300">{loc.cliente_nome}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {new Date(loc.data_inicio).toLocaleDateString('pt-BR')}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-gray-300">{loc.dias}</span>
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
                <div className="text-center py-16 text-gray-400">
                  Erro ao carregar detalhes
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
