import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package,
  Clock,
  FileText,
  MessageCircle,
  ChevronRight,
  Calendar,
  Truck,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  CornerUpLeft,
  Search,
  Zap,
  MapPin,
  FileCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Heart,
  Loader2,
  User
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Chat, type Proposta, getEquipamentoImageUrl } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import TraktoLogo from '../components/TraktoLogo'
import { gerarTermoLocacao } from '../utils/gerarContrato'

// ========== TYPES ==========
interface OrderItem {
  chat: Chat
  proposta: Proposta | null
}

// ========== DESIGN TOKENS (Lovable Clean) ==========
const THEME = {
  bg: "bg-surface",
  sidebar: "bg-surface-card border-r border-border",
  textPrimary: "text-foreground",
  textSecondary: "text-foreground-secondary",
  card: "bg-surface-card p-6 rounded-[2rem] border border-border shadow-sm hover:shadow-md transition-all",
  badge: {
    active: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800",
    transport: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800",
    warning: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800",
    neutral: "bg-surface-inset text-foreground-secondary"
  },
  btnPrimary: "bg-slate-900 dark:bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-slate-900/10 dark:shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2",
  btnSecondary: "bg-surface-card text-foreground-secondary border border-border px-5 py-3 rounded-xl font-bold text-sm hover:bg-surface-elevated transition-all active:scale-95 flex items-center justify-center gap-2"
}

type TabId = 'active' | 'tracking' | 'documents' | 'favorites'

// ========== HELPERS ==========
function getStatusStep(proposta: Proposta | null, equipStatus: string | null | undefined): number {
  if (!proposta) return 1 // Solicitação enviada
  const status = proposta.status
  const eqStatus = equipStatus?.toUpperCase()

  if (status === 'pendente') return 1
  if (status === 'recusada') return 0
  if (status === 'aceita') {
    if (eqStatus === 'EM_TRANSITO') return 3
    if (eqStatus === 'OCUPADO') return 4
    return 2 // Contrato/Reservado
  }
  if (status === 'finalizada') return 4
  return 1
}

function getStatusInfo(proposta: Proposta | null, equipStatus: string | null | undefined): { label: string; type: 'active' | 'transport' | 'warning' | 'neutral' } {
  if (!proposta) return { label: 'Solicitação Enviada', type: 'warning' }

  const status = proposta.status
  const eqStatus = equipStatus?.toUpperCase()

  if (status === 'pendente') return { label: 'Aguardando Proposta', type: 'warning' }
  if (status === 'recusada') return { label: 'Recusada', type: 'neutral' }
  if (status === 'finalizada') return { label: 'Finalizado', type: 'neutral' }

  // status === 'aceita'
  if (eqStatus === 'EM_TRANSITO') return { label: 'Em Trânsito', type: 'transport' }
  if (eqStatus === 'OCUPADO') return { label: 'Em Uso', type: 'active' }
  return { label: 'Reservado', type: 'transport' }
}

function formatDateRange(proposta: Proposta | null, chat: Chat): string {
  const inicio = proposta?.data_inicio
  const fim = proposta?.data_fim
  const dias = proposta?.quantidade_dias || chat.quantidade_dias

  const fmt = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  if (inicio && fim) return `${fmt(inicio)} - ${fmt(fim)}`
  if (dias) return `${dias} dias`
  return 'A definir'
}

function getDaysLeft(proposta: Proposta | null): { left: number; total: number } | null {
  if (!proposta?.data_inicio || !proposta?.data_fim) return null

  const start = new Date(proposta.data_inicio + 'T00:00:00')
  const end = new Date(proposta.data_fim + 'T00:00:00')
  const now = new Date()

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return { left: daysLeft, total: totalDays }
}

function getOrderId(chat: Chat): string {
  return `TRK-${chat.id.slice(0, 4).toUpperCase()}`
}

// ========== FAVORITES STORAGE ==========
const FAVORITES_KEY = 'trakto_favorites'

function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ========== MAIN COMPONENT ==========
export default function MeusPedidos() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { fetchMeusChats } = useApp()

  const [activeTab, setActiveTab] = useState<TabId>('active')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  // Load orders (chats + proposals)
  useEffect(() => {
    if (!user?.id) return

    const load = async () => {
      setLoading(true)
      try {
        const chats = await fetchMeusChats(user.id)
        const clientChats = chats.filter(c => c.locatario_id === user.id)

        const propostaIds = clientChats
          .map(c => c.proposta_id)
          .filter((id): id is string => !!id)

        let propostaMap = new Map<string, Proposta>()

        if (propostaIds.length > 0) {
          const { data: propostas } = await supabase
            .from('propostas')
            .select('*')
            .in('id', propostaIds)

          if (propostas) {
            propostaMap = new Map(propostas.map(p => [p.id, p as Proposta]))
          }
        }

        const items: OrderItem[] = clientChats.map(chat => ({
          chat,
          proposta: chat.proposta_id ? propostaMap.get(chat.proposta_id) || null : null
        }))

        setOrders(items)
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id, fetchMeusChats])

  // Load favorites when tab changes
  useEffect(() => {
    if (activeTab !== 'favorites') return

    const loadFavs = async () => {
      const ids = getFavoriteIds()
      if (ids.length === 0) {
        setFavorites([])
        return
      }

      setLoadingFavorites(true)
      try {
        const { data } = await supabase
          .from('equipamentos')
          .select('id, nome, categoria, preco_diaria, fotos, cidade, uf')
          .in('id', ids)

        setFavorites(data || [])
      } catch {
        setFavorites([])
      } finally {
        setLoadingFavorites(false)
      }
    }

    loadFavs()
  }, [activeTab])

  // Split orders into active / in-transit / finished
  // Exclui pedidos finalizados ou equipamentos já devolvidos (DISPONIVEL)
  const activeRentals = useMemo(() =>
    orders.filter(o => {
      const status = o.proposta?.status
      const eqStatus = o.chat.equipamento?.status?.toUpperCase()
      // Só mostra se proposta aceita E equipamento OCUPADO (em uso)
      // Exclui finalizados ou equipamentos já devolvidos
      return status === 'aceita' && eqStatus === 'OCUPADO'
    }),
    [orders]
  )

  const trackingOrders = useMemo(() =>
    orders.filter(o => {
      const status = o.proposta?.status
      const eqStatus = o.chat.equipamento?.status?.toUpperCase()
      // Exclui pedidos finalizados ou equipamentos já devolvidos
      if (status === 'finalizada' || status === 'recusada') return false
      if (eqStatus === 'DISPONIVEL' && status === 'aceita') return false
      // Pedidos em andamento: solicitação, pendente, aceita mas não em uso ainda (RESERVADO ou EM_TRANSITO)
      return !status || status === 'pendente' || (status === 'aceita' && eqStatus !== 'OCUPADO')
    }),
    [orders]
  )

  // Documents reais - contratos disponíveis para download
  const documents = useMemo(() => {
    return orders
      .filter(o => o.proposta?.status === 'aceita' || o.proposta?.status === 'finalizada')
      .map(o => ({
        chat: o.chat,
        proposta: o.proposta,
        name: `Termo_Locacao_${o.chat.equipamento?.nome?.replace(/\s+/g, '_') || 'Equipamento'}.pdf`,
        date: new Date(o.proposta?.created_at || o.chat.created_at).toLocaleDateString('pt-BR'),
        type: 'contract' as const
      }))
  }, [orders])

  // Função para baixar contrato PDF
  const handleDownloadContrato = (doc: typeof documents[0]) => {
    if (!doc.chat || !doc.proposta || !doc.chat.equipamento) return
    gerarTermoLocacao({
      proposta: doc.proposta,
      chat: doc.chat,
      equipamento: doc.chat.equipamento,
      locadorNome: doc.chat.locador_nome || 'Locador',
      locatarioNome: profile?.full_name || profile?.nome_empresa || 'Locatário'
    })
  }

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL'

  const menuItems = [
    { id: 'active' as TabId, label: 'Minhas Locações', icon: Package, count: activeRentals.length },
    { id: 'tracking' as TabId, label: 'Acompanhar Pedidos', icon: Clock, count: trackingOrders.length },
    { id: 'documents' as TabId, label: 'Documentos', icon: FileText, count: documents.length },
    { id: 'favorites' as TabId, label: 'Favoritos', icon: Heart },
  ]

  return (
    <div className={`min-h-screen ${THEME.bg} font-sans flex flex-col md:flex-row pb-24 lg:pb-0`}>

      {/* === SIDEBAR === */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 ${THEME.sidebar} transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative
      `}>
        <div className="p-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 cursor-pointer group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform">
              <Zap className="text-white fill-current" size={20} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              trakto<span className="text-indigo-600">.rent</span>
            </span>
          </Link>

          {/* Menu */}
          <nav className="space-y-2">
            {menuItems.map(menu => (
              <button
                key={menu.id}
                onClick={() => { setActiveTab(menu.id); setIsMobileMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 group ${
                  activeTab === menu.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-foreground-secondary hover:bg-surface-elevated hover:text-foreground'
                }`}
              >
                <menu.icon size={20} className={activeTab === menu.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground-muted group-hover:text-foreground'} />
                {menu.label}
                {menu.count !== undefined && menu.count > 0 && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                    activeTab === menu.id
                      ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200'
                      : 'bg-surface-inset text-foreground-muted'
                  }`}>
                    {menu.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer User Profile */}
        <div className="mt-auto p-6 border-t border-border-subtle">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-border">
            <div className="w-10 h-10 bg-slate-900 dark:bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">
                {profile?.full_name || 'Cliente'}
              </p>
              <p className="text-xs text-foreground-secondary truncate">
                {profile?.document_id ? 'Cliente Corporativo' : 'Cliente'}
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-foreground-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Voltar para loja"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 h-screen overflow-y-auto relative">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-6 pb-0">
          <Link to="/" className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="text-white fill-current" size={16} />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-surface-card rounded-lg border border-border shadow-sm"
          >
            {isMobileMenuOpen ? <X size={24} className="text-foreground" /> : <Menu size={24} className="text-foreground" />}
          </button>
        </div>

        <div className="p-6 md:p-12 max-w-6xl mx-auto">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {activeTab === 'active' && 'Locações Ativas'}
                {activeTab === 'tracking' && 'Status dos Pedidos'}
                {activeTab === 'documents' && 'Biblioteca de Arquivos'}
                {activeTab === 'favorites' && 'Favoritos'}
              </h1>
              <p className="text-foreground-secondary font-medium mt-2">
                {activeTab === 'active' && 'Gerencie seus equipamentos em uso.'}
                {activeTab === 'tracking' && 'Acompanhe a chegada dos seus pedidos.'}
                {activeTab === 'documents' && 'Acesse contratos, notas e manuais.'}
                {activeTab === 'favorites' && 'Equipamentos salvos para depois.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="w-12 h-12 bg-surface-card border border-border rounded-full flex items-center justify-center text-foreground-muted hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-800 hover:shadow-md transition-all relative">
                <Bell size={20} />
                {trackingOrders.length > 0 && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
              <Link
                to="/"
                className={THEME.btnPrimary}
              >
                <Search size={18}/> <span className="hidden sm:inline">Buscar Item</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {/* === TAB: MINHAS LOCAÇÕES (Ativos) === */}
              {activeTab === 'active' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {activeRentals.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-5 border border-border">
                        <Package className="w-10 h-10 text-foreground-muted" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">Nenhum equipamento em uso</h3>
                      <p className="text-foreground-secondary text-sm mb-6">Quando receber um equipamento, ele aparecerá aqui.</p>
                      <Link to="/" className={THEME.btnPrimary + " inline-flex"}>
                        Explorar Equipamentos
                      </Link>
                    </div>
                  ) : (
                    activeRentals.map(({ chat, proposta }) => {
                      const eq = chat.equipamento
                      const fotoUrl = eq ? getEquipamentoImageUrl(eq) : null
                      const daysInfo = getDaysLeft(proposta)

                      return (
                        <div key={chat.id} className={THEME.card}>
                          <div className="flex flex-col sm:flex-row gap-6">
                            {/* Image */}
                            <div className="w-full sm:w-40 h-40 rounded-[1.5rem] overflow-hidden relative shrink-0 bg-surface-inset">
                              {fotoUrl ? (
                                <img src={fotoUrl} className="w-full h-full object-cover" alt={eq?.nome} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-10 h-10 text-foreground-muted" />
                                </div>
                              )}
                              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md bg-surface-card/90 ${THEME.badge.active.replace('bg-emerald-50 dark:bg-emerald-950/50', '').trim()}`}>
                                Em Uso
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                                      {chat.locador_nome || 'Locador'}
                                    </p>
                                    <h3 className="text-xl font-bold text-foreground leading-tight">
                                      {eq?.nome || 'Equipamento'}
                                    </h3>
                                  </div>
                                  {daysInfo && (
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                      daysInfo.left <= 3 ? THEME.badge.warning : THEME.badge.neutral
                                    }`}>
                                      {daysInfo.left} dias rest.
                                    </div>
                                  )}
                                </div>

                                {/* Timeline Visual */}
                                {daysInfo && (
                                  <div className="mt-4">
                                    <div className="flex justify-between text-xs font-bold text-foreground-muted mb-2">
                                      <span>{proposta?.data_inicio ? new Date(proposta.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'}</span>
                                      <span>{proposta?.data_fim ? new Date(proposta.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'}</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-surface-inset rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-slate-900 dark:bg-indigo-500 rounded-full"
                                        style={{ width: `${Math.min(100, ((daysInfo.total - daysInfo.left) / daysInfo.total) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 mt-6">
                                <button
                                  onClick={() => navigate(`/chats/${chat.id}`)}
                                  className={`${THEME.btnPrimary} flex-1`}
                                >
                                  <RefreshCw size={16} /> Estender
                                </button>
                                <button
                                  onClick={() => navigate(`/chats/${chat.id}`)}
                                  className={`${THEME.btnSecondary} flex-1 text-xs px-2`}
                                >
                                  <CornerUpLeft size={16} /> Devolver
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* === TAB: ACOMPANHAR PEDIDOS (Tracking) === */}
              {activeTab === 'tracking' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {trackingOrders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-5 border border-border">
                        <Clock className="w-10 h-10 text-foreground-muted" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">Nenhum pedido em andamento</h3>
                      <p className="text-foreground-secondary text-sm mb-6">Seus pedidos aparecerão aqui.</p>
                      <Link to="/" className={THEME.btnPrimary + " inline-flex"}>
                        Explorar Equipamentos
                      </Link>
                    </div>
                  ) : (
                    trackingOrders.map(({ chat, proposta }) => {
                      const eq = chat.equipamento
                      const statusInfo = getStatusInfo(proposta, eq?.status)
                      const step = getStatusStep(proposta, eq?.status)
                      const needsPayment = proposta?.status === 'aceita' && step === 2

                      return (
                        <div key={chat.id} className={`${THEME.card} relative overflow-hidden pl-0 md:pl-6`}>
                          {/* Status Lateral Bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            statusInfo.type === 'warning' ? 'bg-amber-400' :
                            statusInfo.type === 'transport' ? 'bg-indigo-500' :
                            statusInfo.type === 'active' ? 'bg-emerald-500' : 'bg-border'
                          }`} />

                          <div className="flex flex-col md:flex-row gap-8 items-center px-4 md:px-0">
                            <div className="flex-1 w-full">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-bold text-foreground-muted">
                                  Pedido {getOrderId(chat)}
                                </span>
                                <span className="w-1 h-1 bg-border rounded-full" />
                                <span className="text-xs font-bold text-foreground-muted">
                                  {new Date(chat.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-foreground mb-1">
                                {eq?.nome || 'Equipamento'}
                              </h3>
                              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4">
                                {chat.locador_nome || 'Locador'}
                              </p>

                              {needsPayment && (
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${THEME.badge.warning}`}>
                                  <AlertCircle size={14}/> Aguardando Pagamento ou Contrato
                                </div>
                              )}

                              <button
                                onClick={() => navigate(`/chats/${chat.id}`)}
                                className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                              >
                                <MessageCircle size={16} /> Ver Negociação <ChevronRight size={16} />
                              </button>
                            </div>

                            {/* Stepper Horizontal */}
                            <div className="w-full md:w-1/2 py-4 md:py-0">
                              <div className="flex justify-between relative px-2">
                                {/* Background line */}
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-inset -z-10 -translate-y-1/2 rounded-full" />

                                {[
                                  { icon: CheckCircle, label: 'Aprovado' },
                                  { icon: FileText, label: 'Contrato' },
                                  { icon: Truck, label: 'Transporte' },
                                  { icon: MapPin, label: 'Entrega' }
                                ].map((stepItem, idx) => {
                                  const isActive = idx + 1 <= step
                                  return (
                                    <div key={idx} className="flex flex-col items-center gap-2 bg-surface px-2">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                                        isActive
                                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                          : 'bg-surface-inset text-foreground-muted'
                                      }`}>
                                        <stepItem.icon size={14} />
                                      </div>
                                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${
                                        isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-foreground-muted'
                                      }`}>
                                        {stepItem.label}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* === TAB: DOCUMENTOS === */}
              {activeTab === 'documents' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={THEME.card}>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-8 border-b border-border-subtle gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Seus Arquivos</h3>
                        <p className="text-foreground-secondary text-sm">Central de downloads de contratos e notas fiscais.</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-4 py-2 rounded-lg text-xs font-bold ${THEME.badge.transport}`}>
                          {documents.length} Arquivos
                        </span>
                      </div>
                    </div>

                    {documents.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                        <p className="text-foreground-secondary">Nenhum documento disponível ainda.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleDownloadContrato(doc)}
                            className="group p-5 rounded-2xl border border-border hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-500/5 transition-all bg-surface-card flex flex-col cursor-pointer relative overflow-hidden"
                          >
                            <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                doc.type === 'contract'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                              }`}>
                                {doc.type === 'contract' ? <FileCheck size={24}/> : <FileText size={24}/>}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadContrato(doc) }}
                                className="text-foreground-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-surface-card rounded-full p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                              >
                                <Download size={20}/>
                              </button>
                            </div>

                            <div className="relative z-10">
                              <h4 className="font-bold text-foreground text-sm mb-1 truncate" title={doc.name}>
                                {doc.name}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-foreground-muted mt-auto">
                                <span>{doc.date}</span>
                                <span className="w-1 h-1 bg-border rounded-full" />
                                <span>PDF</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TAB: FAVORITOS === */}
              {activeTab === 'favorites' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {loadingFavorites ? (
                    <div className="flex items-center justify-center py-24">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : favorites.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-5 border border-border">
                        <Heart className="w-10 h-10 text-foreground-muted" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">Nenhum favorito</h3>
                      <p className="text-foreground-secondary text-sm mb-6">
                        Salve equipamentos como favoritos para encontrá-los mais rápido.
                      </p>
                      <Link to="/" className={THEME.btnPrimary + " inline-flex"}>
                        Explorar Equipamentos
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.map(eq => {
                        const fotoUrl = eq.fotos?.[0]
                          ? eq.fotos[0].startsWith('http')
                            ? eq.fotos[0]
                            : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/equipamentos/${eq.fotos[0]}`
                          : null

                        return (
                          <div
                            key={eq.id}
                            onClick={() => navigate(`/product/${eq.id}`)}
                            className={`${THEME.card} p-3 cursor-pointer group`}
                          >
                            <div className="relative aspect-[4/3] bg-surface-inset rounded-[1.5rem] overflow-hidden mb-3">
                              {fotoUrl ? (
                                <img
                                  src={fotoUrl}
                                  alt={eq.nome}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-10 h-10 text-foreground-muted" />
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const ids = getFavoriteIds().filter(id => id !== eq.id)
                                  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
                                  setFavorites(prev => prev.filter(f => f.id !== eq.id))
                                }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-red-400 shadow-sm hover:scale-110 transition-all backdrop-blur-sm"
                              >
                                <Heart size={18} fill="currentColor" />
                              </button>
                            </div>
                            <div className="px-2 pb-2">
                              <p className="text-xs font-bold text-foreground-muted mb-1 uppercase">
                                {eq.categoria || 'Outros'}
                              </p>
                              <h4 className="font-bold text-foreground text-lg leading-tight mb-2 truncate">
                                {eq.nome}
                              </h4>
                              <div className="flex items-center justify-between pt-2 border-t border-border">
                                <span className="font-extrabold text-foreground text-lg">
                                  R$ {eq.preco_diaria?.toFixed(2)}
                                </span>
                                <button className={THEME.btnPrimary + " text-xs px-4 py-2"}>
                                  Alugar
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
