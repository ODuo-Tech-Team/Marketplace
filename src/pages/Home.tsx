import { useState, useEffect, useMemo, useRef, useCallback, createElement } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Package, ChevronLeft, ChevronRight, LayoutGrid, Star, Search, Sun, Moon, Store, MapPin, ShieldCheck, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useApp, isEquipamentoDisponivel } from '../contexts/AppContext'
import { useTheme } from '../contexts/ThemeContext'
import { VERTICALS, VERTICAL_CONFIGS } from '../config/verticals'
import OwnerDashboard from '../components/OwnerDashboard'
import Header from '../components/Header'
import PremiumProductCard from '../components/PremiumProductCard'
import ProductCard from '../components/ProductCard'
import TraktoLogo from '../components/TraktoLogo'

// ========== COMPONENTE PRINCIPAL ==========
export default function Home() {
  const { profile } = useAuth()
  const isLocador = profile?.tipo_usuario === 'locador'

  if (isLocador) {
    return <OwnerDashboard />
  }

  return <RenterView />
}

// ========== MOBILE HEADER CLIENTE (com toggle de tema) ==========
function MobileClientHeader() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
      <div className="px-4 flex items-center justify-between h-14">
        <TraktoLogo size="sm" />
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </div>
  )
}

// Interface para Lojas Oficiais/Parceiros
interface LojaOficial {
  id: string
  nome_empresa: string | null
  full_name: string | null
  avatar_url: string | null
  banner_url: string | null
  cidade: string | null
  uf: string | null
  verificado: boolean
  destacado: boolean
}

// ========== VISAO DO LOCATARIO (LOVABLE MARKETPLACE) ==========
function RenterView() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const {
    equipamentos,
    loadingEquipamentos,
    mensagensNaoLidas,
    fetchMensagensNaoLidas,
    setupMensagensRealtime,
    activeVertical,
    setActiveVertical
  } = useApp()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUf, setSelectedUf] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Estado para Lojas Oficiais
  const [lojasOficiais, setLojasOficiais] = useState<LojaOficial[]>([])
  const [loadingLojas, setLoadingLojas] = useState(true)
  const lojasScrollRef = useRef<HTMLDivElement>(null)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll) }
  }, [checkScroll])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  const nomeUsuario = profile?.nome_empresa || profile?.full_name || 'Usuário'
  const cidadeUsuario = profile?.cidade || ''
  const ufUsuario = profile?.uf || ''
  const localUsuario = cidadeUsuario && ufUsuario ? `${cidadeUsuario}, ${ufUsuario}` : 'Todo Brasil'

  useEffect(() => {
    if (user?.id) {
      fetchMensagensNaoLidas(user.id)
      setupMensagensRealtime(user.id)
    }
  }, [user?.id])

  // Buscar Lojas Oficiais (locadores com tem_loja = true)
  useEffect(() => {
    const fetchLojasOficiais = async () => {
      setLoadingLojas(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome_empresa, full_name, avatar_url, banner_url, cidade, uf, verificado, destacado')
          .eq('tipo_usuario', 'locador')
          .eq('tem_loja', true)
          .order('destacado', { ascending: false })
          .order('verificado', { ascending: false })
          .limit(12)

        if (error) {
          console.error('Erro ao buscar lojas oficiais:', error)
          setLojasOficiais([])
        } else {
          setLojasOficiais(data || [])
        }
      } catch (err) {
        console.error('Erro ao buscar lojas oficiais:', err)
        setLojasOficiais([])
      } finally {
        setLoadingLojas(false)
      }
    }

    fetchLojasOficiais()
  }, [])

  const equipamentosFiltrados = useMemo(() => {
    return equipamentos
      .filter(eq => {
        if (!isEquipamentoDisponivel(eq)) return false
        if (activeVertical !== 'todos') {
          const eqVertical = eq.vertical || 'construcao'
          if (eqVertical !== activeVertical) return false
        }
        if (searchTerm && !eq.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false
        if (selectedUf && eq.uf !== selectedUf) return false
        return true
      })
      .sort((a, b) => {
        // HIERARQUIA DE BUSCA:
        // 1. locador_destacado DESC - Locadores PRO primeiro
        // 2. locador_verificado DESC - Verificados em seguida
        // 3. destaque DESC - Equipamentos destacados individualmente
        // 4. created_at DESC - Mais recentes por último

        const aLocadorDestacado = a.locador_destacado ? 1 : 0
        const bLocadorDestacado = b.locador_destacado ? 1 : 0
        if (bLocadorDestacado !== aLocadorDestacado) return bLocadorDestacado - aLocadorDestacado

        const aLocadorVerificado = a.locador_verificado ? 1 : 0
        const bLocadorVerificado = b.locador_verificado ? 1 : 0
        if (bLocadorVerificado !== aLocadorVerificado) return bLocadorVerificado - aLocadorVerificado

        const aDestaque = a.destaque ? 1 : 0
        const bDestaque = b.destaque ? 1 : 0
        if (bDestaque !== aDestaque) return bDestaque - aDestaque

        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
        return bDate - aDate
      })
  }, [equipamentos, searchTerm, activeVertical, selectedUf])

  // Promoted: equipamentos de Locadores PRO ou com destaque individual
  const promoted = useMemo(
    () => equipamentosFiltrados.filter(eq => eq.locador_destacado || eq.destaque),
    [equipamentosFiltrados]
  )
  // Regular: todos os demais
  const regular = useMemo(
    () => equipamentosFiltrados.filter(eq => !eq.locador_destacado && !eq.destaque),
    [equipamentosFiltrados]
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] font-sans text-slate-700 dark:text-slate-300 pb-24 lg:pb-20 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 1. HEADER - Esconder no mobile quando há BottomNav */}
      <div className="hidden lg:block">
        <Header
          selectedArea={activeVertical}
          onAreaChange={(area) => { setActiveVertical(area) }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          localUsuario={localUsuario}
          nomeUsuario={nomeUsuario}
          onSignOut={signOut}
          mensagensNaoLidas={mensagensNaoLidas}
          selectedUf={selectedUf}
          onUfChange={setSelectedUf}
        />
      </div>

      {/* MOBILE HEADER - Com toggle de tema */}
      <MobileClientHeader />

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-14" />

      {/* 2. CATEGORY NAV BAR - Pílula Premium Style */}
      <nav className="hidden lg:block fixed top-16 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="relative">
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-white/90 dark:from-slate-900/90 via-white/70 dark:via-slate-900/70 to-transparent"
              >
                <ChevronLeft size={20} className="text-slate-400 hover:text-indigo-600 transition-colors" />
              </button>
            )}
            <div ref={scrollRef} className="flex items-center gap-3 overflow-x-auto no-scrollbar py-3">
              {/* Ver Tudo */}
              <button
                onClick={() => setActiveVertical('todos')}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                  activeVertical === 'todos'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                }`}
              >
                <LayoutGrid size={18} className={activeVertical === 'todos' ? 'animate-pulse' : ''} />
                Ver Tudo
              </button>
              {VERTICALS.map((key) => {
                const niche = VERTICAL_CONFIGS[key]
                const isActive = activeVertical === key
                return (
                  <button
                    key={key}
                    onClick={() => setActiveVertical(key)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                    }`}
                  >
                    {createElement(niche.icon, { size: 18, className: isActive ? 'animate-pulse' : '' })}
                    {niche.label}
                  </button>
                )
              })}
            </div>
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-white/90 dark:from-slate-900/90 via-white/70 dark:via-slate-900/70 to-transparent"
              >
                <ChevronRight size={20} className="text-slate-400 hover:text-indigo-600 transition-colors" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer for fixed header + nav - APENAS DESKTOP */}
      <div className="hidden lg:block h-32" />

      {/* HERO BANNER - Mobile Compacto / Desktop Normal */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 mt-4 lg:mt-4 mb-6 lg:mb-12 text-center">
        <div className="space-y-4 lg:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs lg:text-sm font-bold">
            <Star size={12} className="fill-indigo-600 dark:fill-indigo-400 lg:w-[14px] lg:h-[14px]" />
            O Marketplace #1 de Locação B2B
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Não compre. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Alugue o extraordinário.</span>
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base lg:text-lg max-w-xl mx-auto">
            De ferramentas pesadas a equipamentos médicos. A maior vitrine de locação do Brasil.
          </p>

          {/* Barra de pesquisa no mobile / Botão no desktop */}
          <div className="w-full max-w-xl mx-auto">
            {/* Mobile: Barra de pesquisa */}
            <div className="lg:hidden flex items-center bg-white dark:bg-neutral-800 rounded-xl h-12 overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar equipamentos..."
                className="flex-1 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 outline-none bg-transparent"
              />
              <button className="h-full px-4 bg-slate-900 dark:bg-indigo-600">
                <Search size={18} className="text-white" strokeWidth={2.5} />
              </button>
            </div>

            {/* Desktop: Botão Explorar Ofertas */}
            <button
              onClick={() => document.getElementById('ofertas-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:block mx-auto bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
            >
              Explorar Ofertas
            </button>
          </div>
        </div>
      </section>

      {/* ========== SECAO: LOJAS OFICIAIS & PARCEIROS ========== */}
      {!loadingLojas && lojasOficiais.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 md:px-6 mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-1 h-5 lg:h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
              <h2 className="text-base lg:text-xl font-bold text-slate-900 dark:text-white">Lojas Oficiais & Parceiros</h2>
            </div>
          </div>

          {/* Mobile: Scroll Horizontal */}
          <div className="lg:hidden">
            <div
              ref={lojasScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            >
              {lojasOficiais.map((loja) => {
                const nomeExibicao = loja.nome_empresa || loja.full_name || 'Loja'
                const localizacao = [loja.cidade, loja.uf].filter(Boolean).join(', ') || 'Brasil'
                const inicial = nomeExibicao.charAt(0).toUpperCase()

                return (
                  <Link
                    key={loja.id}
                    to={`/loja/${loja.id}`}
                    className="flex-shrink-0 w-64 snap-start group"
                  >
                    <div className="relative h-32 rounded-t-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                      {loja.banner_url ? (
                        <img
                          src={loja.banner_url}
                          alt={nomeExibicao}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
                      )}
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-b-2xl p-4 border border-t-0 border-gray-100 dark:border-white/10 -mt-6 relative z-10 shadow-lg">
                      <div className="flex items-start gap-3 -mt-10">
                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-700 shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {loja.avatar_url ? (
                            <img src={loja.avatar_url} alt={nomeExibicao} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{inicial}</span>
                          )}
                        </div>
                        <div className="pt-8 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {nomeExibicao}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={10} /> {localizacao}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {loja.verificado && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                            <ShieldCheck size={10} /> Verificado
                          </span>
                        )}
                        {loja.destacado && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full">
                            <Award size={10} /> PRO
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
            {lojasOficiais.map((loja) => {
              const nomeExibicao = loja.nome_empresa || loja.full_name || 'Loja'
              const localizacao = [loja.cidade, loja.uf].filter(Boolean).join(', ') || 'Brasil'
              const inicial = nomeExibicao.charAt(0).toUpperCase()

              return (
                <Link
                  key={loja.id}
                  to={`/loja/${loja.id}`}
                  className="group"
                >
                  <div className="relative h-28 rounded-t-2xl overflow-hidden">
                    {loja.banner_url ? (
                      <img
                        src={loja.banner_url}
                        alt={nomeExibicao}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="bg-white dark:bg-neutral-900 rounded-b-2xl p-4 border border-t-0 border-gray-100 dark:border-white/10 -mt-6 relative z-10 shadow-lg group-hover:shadow-xl group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-all">
                    <div className="flex items-start gap-3 -mt-10">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-700 shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {loja.avatar_url ? (
                          <img src={loja.avatar_url} alt={nomeExibicao} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{inicial}</span>
                        )}
                      </div>
                      <div className="pt-6 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {nomeExibicao}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <MapPin size={10} /> {localizacao}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {loja.verificado && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                          <ShieldCheck size={10} /> Verificado
                        </span>
                      )}
                      {loja.destacado && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full">
                          <Award size={10} /> PRO
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Categorias Horizontal - MOBILE ONLY */}
      <div className="lg:hidden px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white dark:text-white font-semibold text-base">Categorias</h3>
          <button className="text-purple-400 dark:text-purple-400 text-xs font-medium">Ver tudo</button>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setActiveVertical('todos')}
            className="flex flex-col items-center gap-2 min-w-[80px] group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${
              activeVertical === 'todos'
                ? 'bg-indigo-100 dark:bg-purple-500/10 border-2 border-indigo-300 dark:border-purple-500/50'
                : 'bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-white/5 group-hover:border-indigo-300 dark:group-hover:border-purple-500/30'
            }`}>
              <LayoutGrid size={20} className={activeVertical === 'todos' ? 'text-purple-400' : 'text-gray-400'} />
            </div>
            <span className={`text-[10px] font-medium text-center truncate w-full ${
              activeVertical === 'todos' ? 'text-purple-400' : 'text-gray-400'
            }`}>
              Todos
            </span>
          </button>
          {VERTICALS.map((key) => {
            const niche = VERTICAL_CONFIGS[key]
            const isActive = activeVertical === key
            return (
              <button
                key={key}
                onClick={() => setActiveVertical(key)}
                className="flex flex-col items-center gap-2 min-w-[80px] group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-purple-500/10 border-2 border-indigo-300 dark:border-purple-500/50'
                    : 'bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-white/5 group-hover:border-indigo-300 dark:group-hover:border-purple-500/30'
                }`}>
                  {createElement(niche.icon, {
                    size: 20,
                    className: isActive ? 'text-purple-400' : 'text-gray-400'
                  })}
                </div>
                <span className={`text-[10px] font-medium text-center truncate w-full ${
                  isActive ? 'text-purple-400' : 'text-gray-400'
                }`}>
                  {niche.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA Banner - Para usuários NÃO LOGADOS */}
      {!user && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white text-center relative overflow-hidden">
            {/* Glow decorativo */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/30 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">
                Alugue equipamentos sem burocracia
              </h2>
              <p className="text-white/80 mb-6 max-w-lg mx-auto text-sm md:text-base">
                Crie sua conta gratuita e comece a negociar diretamente com locadores verificados em todo o Brasil.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
                  className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-white/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Criar Conta Grátis
                </button>
                <button
                  onClick={() => navigate('/auth', { state: { mode: 'login' } })}
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Já tenho conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div id="ofertas-section" />
      {loadingEquipamentos ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : equipamentosFiltrados.length === 0 ? (
        <div className="text-center py-24 max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl mb-4 inline-block border border-gray-100 dark:border-white/5 shadow-sm">
            <Package className="w-10 h-10 text-slate-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum equipamento encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Tente ajustar os filtros de busca ou explore outras categorias</p>
        </div>
      ) : (
        <>
          {/* 3. DESTAQUES */}
          {promoted.length > 0 && (
            <section className="max-w-[1600px] mx-auto px-4 md:px-6 mb-6 lg:mb-10">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-1 h-5 lg:h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full" />
                  <h2 className="text-base lg:text-xl font-bold text-slate-900 dark:text-white">Destaques da Semana</h2>
                </div>
                <button className="text-xs lg:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors">
                  Ver tudo
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {promoted.map(eq => (
                  <PremiumProductCard
                    key={eq.id}
                    equipamento={eq}
                    onClick={() => navigate(`/product/${eq.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 4. DISPONÍVEIS */}
          {regular.length > 0 && (
            <section className="max-w-[1600px] mx-auto px-4 md:px-6 pb-8 lg:pb-12">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-1 h-5 lg:h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full" />
                  <h2 className="text-base lg:text-xl font-bold text-slate-900 dark:text-white">Disponíveis para Locação</h2>
                </div>
                <button className="text-xs lg:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors">
                  Ver tudo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {regular.map(eq => (
                  <ProductCard
                    key={eq.id}
                    equipamento={eq}
                    onClick={() => navigate(`/product/${eq.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
