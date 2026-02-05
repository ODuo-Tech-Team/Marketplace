import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Search, Star, MapPin, ShieldCheck, Award, Users, Package,
  ArrowLeft, Filter, ChevronDown, Grid3X3, List, Bell, BellOff,
  Calendar, Loader2, Store, ExternalLink
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Equipamento, isEquipamentoDisponivel, getEquipamentoImageUrl } from '../contexts/AppContext'
import { useLoginModal } from '../contexts/LoginModalContext'
import { VERTICAL_CONFIGS, type VerticalKey } from '../config/verticals'
import ProductCard from '../components/ProductCard'
import TraktoLogo from '../components/TraktoLogo'
import { toast } from 'sonner'

// Interface para dados do locador na Storefront
interface LocadorStorefront {
  id: string
  full_name: string | null
  nome_empresa: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  cidade: string | null
  uf: string | null
  verificado: boolean | null
  destacado: boolean | null
  tem_loja: boolean | null  // Controle de acesso monetizacao
  rating_average: number | null
  reviews_count: number | null
  followers_count: number | null
  vertical_principal: string | null
  cor_marca: string | null  // Cor personalizada da marca
  loja_slug: string | null  // Slug personalizado da URL
  created_at: string
}

// Tipo de ordenacao
type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'name'

export default function Storefront() {
  const { locadorId } = useParams<{ locadorId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openLoginModal } = useLoginModal()

  // Estados
  const [locador, setLocador] = useState<LocadorStorefront | null>(null)
  const [resolvedLocadorId, setResolvedLocadorId] = useState<string | null>(null)
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Helper para verificar se e UUID
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

  // Buscar dados do locador (por ID ou slug)
  const fetchLocador = useCallback(async () => {
    if (!locadorId) return

    try {
      let data: LocadorStorefront | null = null

      // Verifica se locadorId e um UUID ou um slug
      if (isUUID(locadorId)) {
        // Busca por ID
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, full_name, nome_empresa, avatar_url, banner_url, bio, cidade, uf, verificado, destacado, tem_loja, rating_average, reviews_count, followers_count, vertical_principal, cor_marca, loja_slug, created_at')
          .eq('id', locadorId)
          .eq('tipo_usuario', 'locador')
          .single()

        if (error) throw error
        data = profileData as LocadorStorefront
      } else {
        // Busca por slug usando a RPC function
        const { data: slugData, error } = await supabase.rpc('get_locador_by_slug', { p_slug: locadorId })

        if (error) throw error
        if (slugData && slugData.length > 0) {
          data = slugData[0] as LocadorStorefront
        }
      }

      if (!data) {
        throw new Error('Loja nao encontrada')
      }

      // Verifica se a loja esta ativa (monetizacao)
      if (!data.tem_loja) {
        toast.error('Esta loja esta temporariamente indisponivel')
        navigate('/')
        return
      }

      setLocador(data)
      setResolvedLocadorId(data.id)
      setFollowersCount(data.followers_count || 0)
    } catch (err) {
      console.error('Erro ao buscar locador:', err)
      toast.error('Locador nao encontrado')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [locadorId, navigate])

  // Buscar equipamentos do locador (usa ID resolvido)
  const fetchEquipamentos = useCallback(async () => {
    if (!resolvedLocadorId) return

    setLoadingEquipamentos(true)
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          locador:profiles!locador_id (
            nome_empresa,
            full_name,
            verificado,
            destacado,
            rating_average,
            reviews_count
          )
        `)
        .eq('locador_id', resolvedLocadorId)

      if (error) throw error

      // Mapear dados do locador para o equipamento
      const mapped = (data || []).map((eq: any) => ({
        ...eq,
        locador_nome_empresa: eq.locador?.nome_empresa,
        locador_full_name: eq.locador?.full_name,
        locador_verificado: eq.locador?.verificado,
        locador_destacado: eq.locador?.destacado,
        locador_rating_average: eq.locador?.rating_average,
        locador_reviews_count: eq.locador?.reviews_count,
      }))

      setEquipamentos(mapped)
    } catch (err) {
      console.error('Erro ao buscar equipamentos:', err)
    } finally {
      setLoadingEquipamentos(false)
    }
  }, [resolvedLocadorId])

  // Verificar se usuario logado segue este locador
  const checkIsFollowing = useCallback(async () => {
    if (!user || !resolvedLocadorId) return

    try {
      const { data, error } = await supabase.rpc('check_is_following', {
        p_follower_id: user.id,
        p_following_id: resolvedLocadorId
      })

      if (!error) {
        setIsFollowing(!!data)
      }
    } catch (err) {
      console.error('Erro ao verificar follow:', err)
    }
  }, [user, resolvedLocadorId])

  // Toggle seguir/deixar de seguir
  const handleToggleFollow = async () => {
    if (!user) {
      openLoginModal('Para seguir esta loja e receber novidades, faca login ou crie sua conta')
      return
    }

    if (!resolvedLocadorId) return

    setFollowLoading(true)
    try {
      const { data, error } = await supabase.rpc('toggle_follow', {
        p_follower_id: user.id,
        p_following_id: resolvedLocadorId
      })

      if (error) throw error

      const result = data as { success: boolean; action?: string; followers_count?: number; error?: string }

      if (result.success) {
        setIsFollowing(result.action === 'followed')
        setFollowersCount(result.followers_count || 0)
        toast.success(result.action === 'followed' ? 'Voce agora segue esta loja!' : 'Voce deixou de seguir esta loja')
      } else {
        toast.error(result.error || 'Erro ao processar')
      }
    } catch (err) {
      console.error('Erro ao toggle follow:', err)
      toast.error('Erro ao processar. Tente novamente.')
    } finally {
      setFollowLoading(false)
    }
  }

  // Effects - fetch locador first
  useEffect(() => {
    fetchLocador()
  }, [fetchLocador])

  // Fetch equipamentos after locador is resolved
  useEffect(() => {
    if (resolvedLocadorId) {
      fetchEquipamentos()
    }
  }, [resolvedLocadorId, fetchEquipamentos])

  useEffect(() => {
    checkIsFollowing()
  }, [checkIsFollowing])

  // Categorias unicas do locador
  const categoriasDoLocador = useMemo(() => {
    const cats = new Set<string>()
    equipamentos.forEach(eq => {
      if (eq.categoria) cats.add(eq.categoria)
    })
    return Array.from(cats).sort()
  }, [equipamentos])

  // Equipamentos filtrados e ordenados
  const equipamentosFiltrados = useMemo(() => {
    let filtered = equipamentos.filter(eq => {
      // Apenas disponiveis
      if (!isEquipamentoDisponivel(eq)) return false

      // Busca por termo
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchNome = eq.nome?.toLowerCase().includes(term)
        const matchDesc = eq.descricao?.toLowerCase().includes(term)
        const matchCat = eq.categoria?.toLowerCase().includes(term)
        if (!matchNome && !matchDesc && !matchCat) return false
      }

      // Filtro por categoria
      if (selectedCategoria !== 'todos' && eq.categoria !== selectedCategoria) {
        return false
      }

      return true
    })

    // Ordenacao
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.preco_diaria || 0) - (b.preco_diaria || 0)
        case 'price_desc':
          return (b.preco_diaria || 0) - (a.preco_diaria || 0)
        case 'name':
          return (a.nome || '').localeCompare(b.nome || '')
        case 'recent':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
    })

    return filtered
  }, [equipamentos, searchTerm, selectedCategoria, sortBy])

  // Determinar tema baseado na vertical do locador
  const verticalKey = (locador?.vertical_principal as VerticalKey) || 'construcao'
  const verticalConfig = VERTICAL_CONFIGS[verticalKey] || VERTICAL_CONFIGS.construcao
  const theme = verticalConfig.theme

  // Cor personalizada da marca (se definida, sobrescreve o tema padrao)
  const corMarca = locador?.cor_marca || null

  // Nome de exibicao do locador
  const nomeExibicao = locador?.nome_empresa || locador?.full_name || 'Loja'
  const localizacao = [locador?.cidade, locador?.uf].filter(Boolean).join(', ') || 'Brasil'

  // Avatar e Banner URLs
  const avatarUrl = locador?.avatar_url || null
  const bannerUrl = locador?.banner_url || null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Carregando vitrine...</p>
        </div>
      </div>
    )
  }

  if (!locador) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Loja nao encontrada</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Esta vitrine nao existe ou foi removida.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar ao Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a]">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <Link to="/">
              <TraktoLogo size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Botao Seguir */}
            <button
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
                isFollowing
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                  : corMarca
                    ? 'text-white shadow-lg hover:opacity-90'
                    : `${theme.bg500} text-white ${theme.bgHover} shadow-lg ${theme.shadow500}`
              }`}
              style={!isFollowing && corMarca ? { backgroundColor: corMarca } : undefined}
            >
              {followLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isFollowing ? (
                <>
                  <BellOff size={16} />
                  <span className="hidden sm:inline">Seguindo</span>
                </>
              ) : (
                <>
                  <Bell size={16} />
                  <span className="hidden sm:inline">Seguir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16" />

      {/* Banner Hero */}
      <div className="relative">
        {/* Banner Image ou Gradient */}
        <div
          className={`h-48 sm:h-64 md:h-80 ${bannerUrl ? '' : corMarca ? '' : `bg-gradient-to-br ${theme.gradientBold}`}`}
          style={bannerUrl ? {
            backgroundImage: `url(${bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : corMarca ? {
            background: `linear-gradient(135deg, ${corMarca}40, ${corMarca}90)`
          } : undefined}
        >
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Profile Card sobreposto */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-20 sm:-bottom-16 w-full max-w-4xl px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-lg -mt-16 sm:-mt-20 ${!corMarca ? theme.bg500 : ''}`}
              style={corMarca ? { backgroundColor: corMarca } : undefined}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={nomeExibicao} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-12 h-12 text-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {nomeExibicao}
                </h1>
                {/* Selos */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {locador.verificado && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                      <ShieldCheck size={12} /> Verificado
                    </span>
                  )}
                  {locador.destacado && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                      <Award size={12} /> PRO
                    </span>
                  )}
                </div>
              </div>

              {/* Localizacao */}
              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center sm:justify-start gap-1 mb-2">
                <MapPin size={14} /> {localizacao}
              </p>

              {/* Bio */}
              {locador.bio && (
                <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3">
                  {locador.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm">
                {/* Rating */}
                {(locador.reviews_count || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(locador.rating_average || 0).toFixed(1)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({locador.reviews_count} avaliacoes)
                    </span>
                  </div>
                )}

                {/* Seguidores */}
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Users size={16} />
                  <span className="font-bold text-slate-900 dark:text-white">{followersCount}</span>
                  <span>seguidores</span>
                </div>

                {/* Equipamentos */}
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Package size={16} />
                  <span className="font-bold text-slate-900 dark:text-white">{equipamentos.length}</span>
                  <span>itens</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer para o card sobreposto */}
      <div className="h-28 sm:h-24" />

      {/* Conteudo Principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Barra de Busca e Filtros */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Buscar em ${nomeExibicao}...`}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3">
              {/* Categoria */}
              <div className="relative">
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="todos">Todas Categorias</option>
                  {categoriasDoLocador.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Ordenacao */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="price_asc">Menor Preco</option>
                  <option value="price_desc">Maior Preco</option>
                  <option value="name">Nome A-Z</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Abas de Categorias (Pills) */}
          {categoriasDoLocador.length > 0 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategoria('todos')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategoria === 'todos'
                    ? corMarca
                      ? 'text-white shadow-lg'
                      : `${theme.bg500} text-white shadow-lg ${theme.shadow500}`
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
                style={selectedCategoria === 'todos' && corMarca ? { backgroundColor: corMarca } : undefined}
              >
                Todos ({equipamentos.filter(eq => isEquipamentoDisponivel(eq)).length})
              </button>
              {categoriasDoLocador.map(cat => {
                const count = equipamentos.filter(eq => eq.categoria === cat && isEquipamentoDisponivel(eq)).length
                const isSelected = selectedCategoria === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoria(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? corMarca
                          ? 'text-white shadow-lg'
                          : `${theme.bg500} text-white shadow-lg ${theme.shadow500}`
                        : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                    style={isSelected && corMarca ? { backgroundColor: corMarca } : undefined}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Grid de Equipamentos */}
        {loadingEquipamentos ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : equipamentosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {searchTerm || selectedCategoria !== 'todos'
                ? 'Nenhum equipamento encontrado'
                : 'Esta loja ainda nao tem equipamentos'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm || selectedCategoria !== 'todos'
                ? 'Tente ajustar os filtros de busca.'
                : 'Volte em breve para novidades!'}
            </p>
            {(searchTerm || selectedCategoria !== 'todos') && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategoria('todos') }}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'flex flex-col gap-4'
          }>
            {equipamentosFiltrados.map(eq => (
              viewMode === 'grid' ? (
                <ProductCard
                  key={eq.id}
                  equipamento={eq}
                  onClick={() => navigate(`/product/${eq.id}`)}
                />
              ) : (
                <ListProductCard
                  key={eq.id}
                  equipamento={eq}
                  onClick={() => navigate(`/product/${eq.id}`)}
                  theme={theme}
                />
              )
            ))}
          </div>
        )}

        {/* Resultado da busca */}
        {equipamentosFiltrados.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Mostrando {equipamentosFiltrados.length} de {equipamentos.filter(eq => isEquipamentoDisponivel(eq)).length} equipamentos
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Vitrine de <strong>{nomeExibicao}</strong> no Marketplace Trakto</p>
          <p className="mt-1">
            <Link to="/" className="text-indigo-600 hover:underline">
              Ver mais lojas no marketplace
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

// Componente para view em lista
function ListProductCard({
  equipamento,
  onClick,
  theme
}: {
  equipamento: Equipamento
  onClick: () => void
  theme: any
}) {
  const imageUrl = getEquipamentoImageUrl(equipamento)

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm hover:shadow-lg transition-all cursor-pointer flex overflow-hidden group"
    >
      {/* Imagem */}
      <div className="w-32 sm:w-48 h-32 sm:h-36 flex-shrink-0 bg-gray-100 dark:bg-slate-800 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={equipamento.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {equipamento.nome}
            </h3>
            {equipamento.categoria && (
              <span className={`${theme.badgeBg} ${theme.badgeText} text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap`}>
                {equipamento.categoria}
              </span>
            )}
          </div>
          {equipamento.descricao && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
              {equipamento.descricao}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            {equipamento.cidade && (
              <>
                <MapPin size={14} />
                <span>{equipamento.cidade}{equipamento.uf ? `, ${equipamento.uf}` : ''}</span>
              </>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Diaria</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              R$ {equipamento.preco_diaria?.toFixed(0)?.replace('.', ',')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
