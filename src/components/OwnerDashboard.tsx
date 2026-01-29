import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Equipamento, type Chat } from '../contexts/AppContext'
import {
  Truck as TruckIcon, Plus, MessageCircle, BarChart3, Package,
  Settings, Loader2, FileText, TrendingUp, Wallet, LogOut, ArrowLeft, List,
  Search
} from 'lucide-react'
import MeusEquipamentos from '../pages/MeusEquipamentos'

type SidebarTab = 'visao_geral' | 'minha_frota' | 'solicitacoes' | 'financeiro'

export default function OwnerDashboard() {
  const { user, profile, signOut } = useAuth()
  const {
    fetchMeusEquipamentos,
    fetchMeusChats,
    mensagensNaoLidas,
    fetchMensagensNaoLidas,
    setupMensagensRealtime
  } = useApp()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<SidebarTab>('visao_geral')
  const [meusEquipamentos, setMeusEquipamentos] = useState<Equipamento[]>([])
  const [meusChats, setMeusChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [abrirNovoEquipamento, setAbrirNovoEquipamento] = useState(false)
  const mountedRef = useRef(true)

  const nomeUsuario = profile?.nome_empresa || profile?.full_name || 'Locador'

  useEffect(() => {
    mountedRef.current = true
    const carregar = async () => {
      if (!user?.id) return
      const [eqs, chats] = await Promise.all([
        fetchMeusEquipamentos(user.id),
        fetchMeusChats(user.id)
      ])
      if (mountedRef.current) {
        setMeusEquipamentos(eqs)
        setMeusChats(chats)
        setLoading(false)
      }
      fetchMensagensNaoLidas(user.id)
      setupMensagensRealtime(user.id)
    }
    carregar()
    return () => { mountedRef.current = false }
  }, [user?.id])

  // KPIs
  const kpis = useMemo(() => {
    const total = meusEquipamentos.length
    const alugados = meusEquipamentos.filter(eq => {
      const s = eq.status?.toUpperCase()
      return s === 'OCUPADO' || s === 'RESERVADO' || s === 'EM_TRANSITO'
    }).length
    const taxaOcupacao = total > 0 ? Math.round((alugados / total) * 100) : 0
    const faturamento = meusEquipamentos
      .filter(eq => ['OCUPADO', 'RESERVADO', 'EM_TRANSITO'].includes(eq.status?.toUpperCase() || ''))
      .reduce((sum, eq) => sum + (eq.preco_diaria || 0) * 30, 0)

    const solicitacoesPendentes = meusChats.filter(chat => {
      if (chat.locador_id !== user?.id) return false
      return !chat.proposta || chat.proposta.status === 'pendente'
    }).length

    const totalSolicitacoes = meusChats.filter(c => c.locador_id === user?.id).length

    return { total, alugados, taxaOcupacao, faturamento, solicitacoesPendentes, totalSolicitacoes }
  }, [meusEquipamentos, meusChats, user?.id])

  // Status badge with dot indicator
  const getStatusBadge = (status: string | null) => {
    const s = status?.toUpperCase()
    switch (s) {
      case 'RESERVADO':
        return (
          <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 flex w-fit items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Reservado
          </span>
        )
      case 'EM_TRANSITO':
      case 'OCUPADO':
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200 flex w-fit items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Alugado
          </span>
        )
      default:
        return (
          <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 flex w-fit items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Disponível
          </span>
        )
    }
  }

  const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null
    if (path.startsWith('http') || path.startsWith('data:')) return path
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
  }

  // Handle sidebar clicks - all tabs render inline, no navigation
  const handleSidebarClick = (tab: SidebarTab) => {
    setActiveTab(tab)
  }

  const sidebarItems = [
    { key: 'visao_geral' as SidebarTab, label: 'Visão Geral', icon: BarChart3 },
    { key: 'minha_frota' as SidebarTab, label: 'Minha Frota', icon: Package },
    { key: 'solicitacoes' as SidebarTab, label: 'Solicitações', icon: MessageCircle },
    { key: 'financeiro' as SidebarTab, label: 'Financeiro', icon: FileText },
  ]

  // Max earning for progress bars
  const maxGanho = useMemo(() => {
    return Math.max(
      ...meusEquipamentos.map(eq => {
        const isOcupado = ['OCUPADO', 'RESERVADO', 'EM_TRANSITO'].includes(eq.status?.toUpperCase() || '')
        return isOcupado ? (eq.preco_diaria || 0) * 30 : 0
      }),
      1
    )
  }, [meusEquipamentos])

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* ========== SIDEBAR (Desktop) ========== */}
      <div className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20 shadow-sm">
        {/* Logo + Pro Account */}
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 font-black text-2xl text-slate-900 tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-slate-900 p-2 rounded-xl">
              <TruckIcon size={22} className="text-white" />
            </div>
            LocaObra
          </Link>
          <div className="mt-2 ml-1">
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wide">Pro Account</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Principal</p>
          {sidebarItems.map(item => {
            const isActive = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleSidebarClick(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-xl transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-amber-400' : ''} />
                {item.label}
                {item.key === 'solicitacoes' && mensagensNaoLidas > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-red-500/30">
                    {mensagensNaoLidas}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-6 border-t border-slate-100">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} /> Sair da Conta
          </button>
        </div>
      </div>

      {/* ========== MOBILE HEADER ========== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-slate-200">
        <div className="px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">LocaObra</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 uppercase">Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveTab('minha_frota'); setAbrirNovoEquipamento(true) }}
              className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/25"
            >
              <Plus className="w-5 h-5" />
            </button>
            <Link to="/chats" className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <MessageCircle className="w-5 h-5" />
              {mensagensNaoLidas > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {mensagensNaoLidas > 9 ? '9+' : mensagensNaoLidas}
                </span>
              )}
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold text-xs shadow-inner border border-white">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        {/* Mobile Nav */}
        <div className="flex border-t border-slate-100 overflow-x-auto">
          {sidebarItems.map(item => {
            const isActive = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleSidebarClick(item.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
                  isActive ? 'text-amber-600 border-b-2 border-amber-500' : 'text-slate-500'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 md:ml-72 p-6 pt-[140px] md:pt-0 md:p-8 lg:p-12 transition-all">
        {/* Dynamic Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            {activeTab !== 'visao_geral' && (
              <button
                onClick={() => setActiveTab('visao_geral')}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 mb-2 transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar para Visão Geral
              </button>
            )}
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === 'visao_geral' ? 'Dashboard' : activeTab === 'minha_frota' ? 'Minha Frota' : activeTab === 'solicitacoes' ? 'Solicitações' : 'Financeiro'}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {activeTab === 'visao_geral' && <>Bem-vindo de volta, <span className="text-slate-900 font-bold">{nomeUsuario}</span>.</>}
              {activeTab === 'minha_frota' && 'Gerencie seus equipamentos e frota.'}
              {activeTab === 'solicitacoes' && 'Acompanhe suas conversas e negociações.'}
              {activeTab === 'financeiro' && 'Acompanhe seus ganhos e faturamento.'}
            </p>
          </div>
          <div className="flex gap-3">
            {(activeTab === 'visao_geral' || activeTab === 'minha_frota') && (
              <button
                onClick={() => setActiveTab('minha_frota')}
                className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <Settings size={18} /> <span className="hidden sm:inline">Ajustes</span>
              </button>
            )}
            <button
              onClick={() => { setActiveTab('minha_frota'); setAbrirNovoEquipamento(true) }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={20} /> <span className="hidden sm:inline">Anunciar Novo</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          </div>
        ) : activeTab === 'minha_frota' ? (
          /* ========== MINHA FROTA (embedded MeusEquipamentos) ========== */
          <MeusEquipamentos embedded abrirNovo={abrirNovoEquipamento} onNovoFechado={() => setAbrirNovoEquipamento(false)} />
        ) : activeTab === 'solicitacoes' ? (
          /* ========== SOLICITAÇÕES ========== */
          <div className="space-y-6">
            {meusChats.filter(c => c.locador_id === user?.id).length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-50 p-4 rounded-full mb-4 inline-block">
                  <MessageCircle className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma solicitação</h3>
                <p className="text-slate-500">Quando clientes enviarem solicitações, aparecerão aqui.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {meusChats.filter(c => c.locador_id === user?.id).map(chat => {
                    const temProposta = !!chat.proposta
                    const statusProposta = chat.proposta?.status
                    return (
                      <button
                        key={chat.id}
                        onClick={() => navigate(`/chats/${chat.id}`)}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 font-bold">
                          {(chat.locatario_nome || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-slate-900 truncate">{chat.locatario_nome || 'Cliente'}</p>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {new Date(chat.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-amber-600 font-medium truncate">{chat.equipamento?.nome || 'Equipamento'}</p>
                          {chat.ultima_mensagem && (
                            <p className="text-sm text-slate-500 truncate mt-0.5">{chat.ultima_mensagem}</p>
                          )}
                        </div>
                        <div>
                          {statusProposta === 'aceita' ? (
                            <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Aceita</span>
                          ) : statusProposta === 'pendente' ? (
                            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Pendente</span>
                          ) : statusProposta === 'finalizada' ? (
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Finalizada</span>
                          ) : (
                            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Negociação</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'financeiro' ? (
          /* ========== FINANCEIRO ========== */
          <div className="space-y-8">
            {activeTab !== 'visao_geral' && null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Faturamento */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-green-100 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-green-50 p-3.5 rounded-2xl group-hover:bg-green-100 transition-colors">
                    <Wallet className="text-green-600" size={26} />
                  </div>
                  {kpis.faturamento > 0 && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp size={12} /> Ativo
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10">Faturamento Estimado (Mês)</p>
                <p className="text-4xl font-black text-slate-900 relative z-10 mt-1">
                  R$ {kpis.faturamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-slate-500 mt-2 relative z-10">{kpis.alugados} equipamentos gerando receita</p>
                <div className="absolute -bottom-6 -right-6 text-green-50 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <Wallet size={140} />
                </div>
              </div>

              {/* Valor da Frota */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-blue-100 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-blue-50 p-3.5 rounded-2xl group-hover:bg-blue-100 transition-colors">
                    <Package className="text-blue-600" size={26} />
                  </div>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10">Valor da Frota (Diárias)</p>
                <p className="text-4xl font-black text-slate-900 mt-1 relative z-10">
                  R$ {meusEquipamentos.reduce((sum, eq) => sum + (eq.preco_diaria || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-500 mt-2 relative z-10">Soma de todas as diárias cadastradas</p>
                <div className="absolute -bottom-6 -right-6 text-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <Package size={140} />
                </div>
              </div>
            </div>

            {/* Tabela de ganhos por equipamento */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <List size={20} className="text-slate-400" /> Ganhos por Equipamento
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                      <th className="p-5 pl-8">Equipamento</th>
                      <th className="p-5">Diária</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right pr-8">Ganho Est. (Mês)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {meusEquipamentos.map(eq => {
                      const isOcupado = ['OCUPADO', 'RESERVADO', 'EM_TRANSITO'].includes(eq.status?.toUpperCase() || '')
                      const ganho = isOcupado ? (eq.preco_diaria || 0) * 30 : 0
                      return (
                        <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-5 pl-8 font-bold text-slate-900">{eq.nome}</td>
                          <td className="p-5 text-slate-600">R$ {(eq.preco_diaria || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-5">{getStatusBadge(eq.status)}</td>
                          <td className="p-5 pr-8 text-right font-bold text-slate-900">
                            R$ {ganho.toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ========== VISÃO GERAL (Dashboard) ========== */
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Receita */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-green-100 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-green-50 p-3.5 rounded-2xl group-hover:bg-green-100 transition-colors">
                    <Wallet className="text-green-600" size={26} />
                  </div>
                  {kpis.faturamento > 0 && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp size={12} /> +12.5%
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10">Receita Total (Mês)</p>
                <p className="text-4xl font-black text-slate-900 relative z-10 mt-1">
                  R$ {kpis.faturamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
                <div className="absolute -bottom-6 -right-6 text-green-50 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <Wallet size={140} />
                </div>
              </div>

              {/* Ocupação */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-blue-100 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-blue-50 p-3.5 rounded-2xl group-hover:bg-blue-100 transition-colors">
                    <Package className="text-blue-600" size={26} />
                  </div>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10">Taxa de Ocupação</p>
                <p className="text-4xl font-black text-slate-900 mt-1 relative z-10">
                  {kpis.taxaOcupacao}% <span className="text-sm font-medium text-slate-400 align-middle">da frota</span>
                </p>
                <div className="absolute -bottom-6 -right-6 text-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <Package size={140} />
                </div>
              </div>

              {/* Solicitações */}
              <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xl shadow-amber-500/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500 rounded-bl-full opacity-10" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-amber-50 p-3.5 rounded-2xl group-hover:bg-amber-100 transition-colors">
                    <MessageCircle className="text-amber-600" size={26} />
                  </div>
                  {kpis.solicitacoesPendentes > 0 && (
                    <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full animate-pulse shadow-sm shadow-red-500/30">
                      Ação Necessária
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10">Solicitações Pendentes</p>
                <p className="text-4xl font-black text-slate-900 mt-1 relative z-10">
                  {kpis.solicitacoesPendentes} <span className="text-sm font-medium text-slate-400 align-middle">novas</span>
                </p>
              </div>
            </div>

            {/* Tabela de Inventário */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <List size={20} className="text-slate-400" /> Inventário Recente
                </h3>
                <button
                  onClick={() => setActiveTab('minha_frota')}
                  className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  Ver relatório completo
                </button>
              </div>

              {meusEquipamentos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-slate-50 p-4 rounded-full mb-4 inline-block">
                    <Package className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum equipamento cadastrado</h3>
                  <p className="text-slate-500 mb-6">Comece adicionando seu primeiro equipamento</p>
                  <button
                    onClick={() => { setActiveTab('minha_frota'); setAbrirNovoEquipamento(true) }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
                  >
                    <Plus size={20} /> Adicionar Equipamento
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="p-5 pl-8">Equipamento</th>
                        <th className="p-5">Status Atual</th>
                        <th className="p-5">Performance Financeira</th>
                        <th className="p-5 text-right pr-8">Gerenciar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {meusEquipamentos.slice(0, 10).map(eq => {
                        const fotoUrl = getImageUrl(eq.fotos?.[0])
                        const isOcupado = ['OCUPADO', 'RESERVADO', 'EM_TRANSITO'].includes(eq.status?.toUpperCase() || '')
                        const ganhoEstimado = isOcupado ? (eq.preco_diaria || 0) * 30 : 0
                        const progressPct = maxGanho > 0 ? Math.round((ganhoEstimado / maxGanho) * 100) : 0

                        return (
                          <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="p-5 pl-8">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                                  {fotoUrl ? (
                                    <img src={fotoUrl} alt={eq.nome} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-base">{eq.nome}</p>
                                  <p className="text-xs text-slate-400 font-medium">{eq.categoria || 'Sem categoria'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-5">{getStatusBadge(eq.status)}</td>
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${progressPct}%` }}
                                    className="h-full bg-slate-900 rounded-full transition-all duration-500"
                                  />
                                </div>
                                <span className="text-sm text-slate-900 font-bold">
                                  R$ {ganhoEstimado > 0 ? ganhoEstimado.toLocaleString('pt-BR') : '0'}
                                </span>
                              </div>
                            </td>
                            <td className="p-5 pr-8 text-right">
                              <button
                                onClick={() => setActiveTab('minha_frota')}
                                className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-slate-700 transition-all border border-transparent hover:border-slate-100"
                              >
                                <Settings size={18} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {meusEquipamentos.length > 10 && (
                    <div className="px-6 py-4 border-t border-slate-100 text-center">
                      <button onClick={() => setActiveTab('minha_frota')} className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline">
                        Ver todos ({meusEquipamentos.length} equipamentos)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
