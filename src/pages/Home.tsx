import { useState, useEffect, useMemo, useRef, useCallback, createElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Package, ChevronLeft, ChevronRight, LayoutGrid, Star, Search, Sun, Moon } from 'lucide-react'
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
            <button className="hidden lg:block bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98]">
              Explorar Ofertas
            </button>
          </div>
        </div>
      </section>

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

      {/* Content Area */}
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
