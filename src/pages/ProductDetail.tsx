import { useState, useEffect, createElement } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Equipamento, type Review, isLinhaAmarela, getLocadorDisplayName, isEquipamentoDisponivel } from '../contexts/AppContext'
import { getVerticalConfig, type VerticalKey } from '../config/verticals'
import { getSpecIcon } from '../config/specIcons'
import FotosCarrossel from '../components/FotosCarrossel'
import {
  ArrowLeft, MapPin, ShieldCheck, MessageCircle,
  Heart, Star, CheckCircle2, X, Loader2, Package, Clock, User, Truck
} from 'lucide-react'
import TraktoLogo from '../components/TraktoLogo'
import SolicitarModal from '../components/SolicitarModal'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fetchEquipamentoById, iniciarChat, fetchLocadorReviews } = useApp()

  const [equipamento, setEquipamento] = useState<Equipamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSolicitarModal, setShowSolicitarModal] = useState(false)
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [locadorReviews, setLocadorReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Favoritos (localStorage)
  const FAVORITES_KEY = 'trakto_favorites'
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (id) {
      try {
        const raw = localStorage.getItem(FAVORITES_KEY)
        const ids: string[] = raw ? JSON.parse(raw) : []
        setIsFavorite(ids.includes(id))
      } catch { /* ignore */ }
    }
  }, [id])

  const toggleFavorite = () => {
    if (!id) return
    try {
      const raw = localStorage.getItem(FAVORITES_KEY)
      let ids: string[] = raw ? JSON.parse(raw) : []
      if (ids.includes(id)) {
        ids = ids.filter(fid => fid !== id)
        setIsFavorite(false)
      } else {
        ids.push(id)
        setIsFavorite(true)
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (id) {
      setLoading(true)
      fetchEquipamentoById(id).then(eq => {
        setEquipamento(eq)
        setLoading(false)
      })
    }
  }, [id, fetchEquipamentoById])

  const vc = getVerticalConfig((equipamento?.vertical || 'construcao') as VerticalKey)
  const disponivel = equipamento ? isEquipamentoDisponivel(equipamento) : false
  const isLA = equipamento?.categoria ? isLinhaAmarela(equipamento.categoria) : false
  const locadorNome = equipamento ? getLocadorDisplayName(equipamento) : null

  const handleEnviarSolicitacao = async (dados: {
    mensagem: string
    quantidadeDias: number
    endereco: { logradouro: string; cep: string; cidade: string; uf: string }
    dataInicio?: string
    dataFim?: string
    precisaOperador?: boolean
  }) => {
    if (!equipamento || !user) return
    setEnviandoSolicitacao(true)
    try {
      const result = await iniciarChat(
        equipamento.id,
        equipamento.locador_id,
        user.id,
        dados.mensagem,
        {
          quantidadeDias: dados.quantidadeDias,
          endereco: dados.endereco,
          precisaOperador: dados.precisaOperador,
        }
      )
      if (result.success && result.chatId) {
        setShowSolicitarModal(false)
        navigate(`/chats/${result.chatId}`)
      } else {
        alert(result.error || 'Erro ao iniciar negociação. Tente novamente.')
      }
    } catch {
      alert('Erro inesperado. Tente novamente.')
    } finally {
      setEnviandoSolicitacao(false)
    }
  }

  // Collect all displayable specs
  const getSpecs = (): Array<{ key: string; label: string; value: string }> => {
    if (!equipamento) return []
    const specs: Array<{ key: string; label: string; value: string }> = []

    if (isLA) {
      if (equipamento.ano) specs.push({ key: 'ano', label: 'Ano', value: String(equipamento.ano) })
      if (equipamento.horimetro_atual) specs.push({ key: 'horimetro_atual', label: 'Horímetro', value: `${equipamento.horimetro_atual}h` })
      if (equipamento.peso_operacional) specs.push({ key: 'peso_operacional', label: 'Peso', value: `${equipamento.peso_operacional} ton` })
      if (equipamento.oferece_operador) specs.push({ key: 'oferece_operador', label: 'Operador', value: 'Disponível' })
    }

    if (equipamento.voltagem) {
      specs.push({ key: 'voltagem', label: 'Voltagem', value: equipamento.voltagem })
    }

    if (equipamento.specs && typeof equipamento.specs === 'object') {
      const specFields = vc.specFields
      for (const field of specFields) {
        const val = equipamento.specs[field.key]
        if (val !== undefined && val !== null && val !== '' && val !== false) {
          if (['ano', 'horimetro_atual', 'peso_operacional', 'oferece_operador', 'voltagem'].includes(field.key)) continue
          const displayVal = typeof val === 'boolean' ? 'Sim' : String(val)
          const suffix = field.unit ? ` ${field.unit}` : ''
          specs.push({ key: field.key, label: field.label, value: `${displayVal}${suffix}` })
        }
      }
    }

    return specs
  }

  const handleOpenProfileModal = async () => {
    setShowProfileModal(true)
    if (equipamento?.locador_id && locadorReviews.length === 0) {
      setLoadingReviews(true)
      const reviews = await fetchLocadorReviews(equipamento.locador_id)
      setLocadorReviews(reviews)
      setLoadingReviews(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Not found
  if (!equipamento) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Package className="w-16 h-16 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">Equipamento não encontrado</h2>
        <button onClick={() => navigate('/')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 underline">
          Voltar ao marketplace
        </button>
      </div>
    )
  }

  const specs = getSpecs()
  const descricao = equipamento.descricao || 'Equipamento disponível para locação. Entre em contato para mais informações sobre especificações técnicas, condições de entrega e prazos.'
  const preco = equipamento.preco_diaria || 0
  const locadorInicial = (locadorNome || 'L').charAt(0).toUpperCase()

  return (
    <>
      {/* ========== MOBILE LAYOUT (< lg) ========== */}
      <div className="lg:hidden min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] animate-in">
        {/* Image Section */}
        <div className="h-[40vh] relative bg-surface-elevated">
          <FotosCarrossel
            fotos={equipamento.fotos}
            nomeEquipamento={equipamento.nome}
            heightClass="h-[40vh]"
          />

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-foreground transition-all border border-border z-20"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Heart Button */}
          <button
            onClick={toggleFavorite}
            className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md transition-all border border-border z-20 ${
              isFavorite ? 'bg-red-500/20 text-red-400' : 'bg-black/40 text-foreground hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* Super Parceiro Badge */}
          {equipamento.destaque && (
            <div className="absolute top-20 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider text-foreground shadow-sm flex items-center gap-2 z-20 border border-border">
              <Star size={14} fill="#f97316" className="text-cta" /> Super Parceiro
            </div>
          )}
        </div>

        {/* Card Overlapping Image */}
        <div className="-mt-10 relative z-10 bg-white dark:bg-neutral-900 rounded-t-[2.5rem] p-8 min-h-[60vh] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-glass-hover rounded-full mx-auto mb-6" />

          {/* Categoria */}
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider mb-2">
            {equipamento.categoria || vc.label}
          </div>

          {/* Nome + Preco */}
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-black text-foreground leading-tight flex-1 mr-4">
              {equipamento.nome}
            </h1>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black text-foreground font-tech">R$ {preco.toFixed(0)}</p>
              <p className="text-xs text-foreground-muted">/dia</p>
            </div>
          </div>

          {/* Rating + Location */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted font-medium mb-6">
            {(equipamento.locador_reviews_count || 0) > 0 && (
              <span className="flex items-center gap-1 text-foreground"><Star size={14} fill="white" /> {(equipamento.locador_rating_average || 0).toFixed(1)}</span>
            )}
            <span className="flex items-center gap-1"><MapPin size={14} /> {equipamento.cidade}, {equipamento.uf}</span>
            {equipamento.locador_verificado && (
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> Verificado</span>
            )}
          </div>

          {/* Owner Profile Mini */}
          {locadorNome && (
            <div className="flex items-center justify-between p-3 rounded-2xl border border-border-subtle bg-surface-elevated mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-foreground-secondary font-bold">
                  {locadorInicial}
                </div>
                <div>
                  <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-wide">Proprietário</p>
                  <p className="text-sm font-black text-foreground">{locadorNome}</p>
                  {(equipamento.locador_reviews_count || 0) > 0 ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-cta">
                      <Star size={10} fill="currentColor" /> {(equipamento.locador_rating_average || 0).toFixed(1)}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground-muted">Sem avaliações</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleOpenProfileModal}
                className="px-4 py-1.5 rounded-xl bg-surface-elevated text-foreground-secondary font-bold text-xs hover:bg-glass-hover hover:text-foreground transition-all"
              >
                Ver Perfil
              </button>
            </div>
          )}

          {/* Specs Grid */}
          {specs.length > 0 && (
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
              {specs.map((spec, i) => {
                const Icon = getSpecIcon(spec.key)
                return (
                  <div key={i} className="min-w-[100px] p-3 rounded-2xl bg-surface-inset/50 border border-border-subtle">
                    {Icon && <div className="mb-1.5 text-foreground-muted">{createElement(Icon, { size: 14 })}</div>}
                    <p className="text-[10px] text-foreground-muted uppercase font-bold mb-1">{spec.label}</p>
                    <p className="font-bold text-foreground-secondary font-tech">{spec.value}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Descricao */}
          <h3 className="text-lg font-black text-foreground mb-3">Sobre este equipamento</h3>
          <p className="text-foreground-secondary text-sm leading-relaxed mb-8">
            {descricao}
          </p>

          {/* Garantia Trakto */}
          <div className="p-4 rounded-2xl bg-surface-inset/50 flex items-center gap-4 mb-24 border border-border-subtle">
            <ShieldCheck size={24} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-foreground text-sm">Garantia Trakto</p>
              <p className="text-xs text-foreground-muted">Pagamento seguro e suporte 24h.</p>
            </div>
          </div>
        </div>

        {/* Floating CTA Button */}
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 p-4 pb-8 z-20">
          <div className="max-w-md mx-auto">
            {disponivel ? (
              <button
                onClick={() => setShowSolicitarModal(true)}
                className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Solicitar Reserva
              </button>
            ) : (
              <div className="w-full py-4 bg-gray-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2">
                <Clock size={20} /> Indisponível no momento
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT (>= lg) ========== */}
      <div className="hidden lg:block min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] animate-in">
        {/* Header (Glassmorphism) */}
        <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 z-50 h-20 px-4 md:px-8 flex items-center justify-between transition-all">
          <Link to="/">
            <TraktoLogo size="sm" />
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/chats" className="text-sm font-bold text-foreground-secondary hover:text-foreground transition-colors">Meus Pedidos</Link>
            <div className="w-10 h-10 bg-surface-elevated rounded-full border border-border overflow-hidden flex items-center justify-center">
              <User size={16} className="text-foreground-secondary" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="animate-in pt-28 pb-20 px-4 md:px-12 max-w-[1400px] mx-auto">

          {/* Breadcrumb & Voltar */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-foreground-secondary hover:text-foreground font-bold mb-8 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* ===== COL-SPAN-2: IMAGES & INFO ===== */}
            <div className="lg:col-span-2 space-y-10">

              {/* Galeria Principal */}
              <div className="relative aspect-[16/9] bg-surface-elevated rounded-[2.5rem] overflow-hidden shadow-2xl border border-border-subtle group">
                <FotosCarrossel
                  fotos={equipamento.fotos}
                  nomeEquipamento={equipamento.nome}
                  heightClass="h-full"
                />
                <button
                  onClick={toggleFavorite}
                  className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md transition-all border border-border z-10 ${
                    isFavorite ? 'bg-red-500/20 text-red-400' : 'bg-black/40 text-foreground hover:bg-white hover:text-red-500'
                  }`}
                >
                  <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                {equipamento.destaque && (
                  <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2 z-10 border border-border">
                    <Star size={14} fill="#f97316" className="text-cta" /> Super Parceiro
                  </div>
                )}
              </div>

              {/* Cabecalho do Produto */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-bold text-sm uppercase tracking-wider px-3 py-1 bg-glass-hover rounded-lg border border-border-subtle text-cta`}>
                    {equipamento.categoria || vc.label}
                  </span>
                  <div className="flex items-center gap-4 text-foreground-secondary font-medium text-sm">
                    <span className="flex items-center gap-1"><MapPin size={16} /> {equipamento.cidade}, {equipamento.uf}</span>
                    {(equipamento.locador_reviews_count || 0) > 0 && (
                      <span className="flex items-center gap-1 text-foreground font-bold"><Star size={16} fill="white" /> {(equipamento.locador_rating_average || 0).toFixed(1)}</span>
                    )}
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-foreground leading-tight mb-6">{equipamento.nome}</h1>

                {/* Card do Dono Dark */}
                <div className="flex items-center justify-between p-5 rounded-3xl border border-border-subtle bg-surface-card hover:border-border transition-colors cursor-pointer group/owner">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-surface-elevated border-2 border-surface-elevated flex items-center justify-center text-foreground-secondary font-bold text-xl">
                        {locadorInicial}
                      </div>
                      {equipamento.locador_verificado && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-surface-card">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-wide">Proprietário</p>
                      <h4 className="font-bold text-foreground text-lg group-hover/owner:text-cta transition-colors">{locadorNome}</h4>
                      {(equipamento.locador_reviews_count || 0) > 0 ? (
                        <div className="flex items-center gap-3 text-xs font-medium text-foreground-secondary mt-1">
                          <span className="flex items-center gap-1 text-cta font-bold">
                            <Star size={12} fill="currentColor" /> {(equipamento.locador_rating_average || 0).toFixed(1)}
                          </span>
                          <span>({equipamento.locador_reviews_count} avaliações)</span>
                        </div>
                      ) : (
                        <p className="text-xs text-foreground-muted mt-1">Sem avaliações</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleOpenProfileModal}
                    className="px-5 py-2.5 rounded-xl bg-surface-elevated text-foreground-secondary font-bold text-sm hover:bg-glass-hover hover:text-foreground transition-colors"
                  >
                    Ver Perfil
                  </button>
                </div>
              </div>

              {/* Descricao */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Descrição</h3>
                <p className="text-foreground-secondary leading-relaxed text-lg">{descricao}</p>
              </div>
            </div>

            {/* ===== COL-SPAN-1: ACTION CARD (STICKY DARK) ===== */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 bg-surface-card rounded-[2.5rem] p-8 border border-border-subtle shadow-2xl">

                {/* Valor de Referência */}
                <div className="mb-6 pb-6 border-b border-border-subtle">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-foreground-muted uppercase mb-1">Diária a partir de</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-foreground font-tech">R$ {preco.toFixed(0)}</span>
                      </div>
                    </div>
                    {disponivel && (
                      <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Disponível
                      </div>
                    )}
                  </div>
                </div>

                {/* Ficha Técnica */}
                {specs.length > 0 && (
                  <div className="bg-surface-inset/50 rounded-2xl p-5 mb-8 border border-border-subtle">
                    <h4 className="font-bold text-foreground mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <span className="text-cta">{createElement(vc.icon, { size: 16 })}</span>
                      Ficha Técnica
                    </h4>
                    <div className="space-y-3">
                      {specs.map((spec, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-foreground-muted font-medium">{spec.label}</span>
                          <span className="font-bold text-foreground-secondary text-right font-tech">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                {disponivel ? (
                  <button
                    onClick={() => setShowSolicitarModal(true)}
                    className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    <MessageCircle size={20} />
                    Solicitar Reserva
                  </button>
                ) : (
                  <div className="w-full py-4 bg-gray-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 mb-4">
                    <Clock size={20} /> Indisponível no momento
                  </div>
                )}

                <p className="text-center text-xs text-foreground-muted leading-tight px-4">
                  <ShieldCheck size={14} className="inline mr-1 text-green-500" />
                  Pagamento seguro via Trakto.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========== LOCATOR PROFILE MODAL (Dark) ========== */}
      {showProfileModal && locadorNome && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 border border-border-subtle">

            {/* Header Colorido */}
            <div className="h-32 bg-surface-inset relative">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 bg-glass-hover hover:bg-glass-hover text-foreground p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Info Principal */}
            <div className="px-8 pb-8 -mt-12">
              <div className="flex justify-between items-end mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-surface-card shadow-md bg-surface-elevated flex items-center justify-center text-foreground-secondary font-bold text-3xl">
                    {locadorInicial}
                  </div>
                  {equipamento.locador_verificado && (
                    <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full border-2 border-surface-card">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-foreground">{locadorNome}</h2>
                  <p className="text-foreground-muted text-sm font-medium">Membro desde 2023</p>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-glass-hover p-4 rounded-2xl text-center border border-border-subtle">
                  <p className="text-2xl font-black text-foreground">{equipamento.locador_reviews_count || 0}</p>
                  <p className="text-[10px] uppercase font-bold text-foreground-muted">Avaliações</p>
                </div>
                <div className="bg-cta/10 p-4 rounded-2xl text-center border border-cta/20">
                  <div className="flex items-center justify-center gap-1 text-cta font-black text-2xl">
                    {(equipamento.locador_reviews_count || 0) > 0 ? (equipamento.locador_rating_average || 0).toFixed(1) : '--'} <Star size={16} fill="currentColor" />
                  </div>
                  <p className="text-[10px] uppercase font-bold text-cta/60">Nota Média</p>
                </div>
                <div className="bg-glass-hover p-4 rounded-2xl text-center border border-border-subtle">
                  <p className="text-lg font-black text-foreground">1 hora</p>
                  <p className="text-[10px] uppercase font-bold text-foreground-muted">Tempo Resp.</p>
                </div>
              </div>

              {/* Avaliações */}
              <div>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  Últimas Avaliações <span className="text-xs font-normal text-foreground-muted">({locadorReviews.length})</span>
                </h3>
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                  {loadingReviews ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
                    </div>
                  ) : locadorReviews.length === 0 ? (
                    <p className="text-sm text-foreground-muted text-center py-4">Nenhuma avaliação ainda</p>
                  ) : (
                    locadorReviews.map(review => (
                      <div key={review.id} className="p-4 rounded-2xl border border-border-subtle bg-surface-elevated">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm text-foreground-secondary">{review.reviewer_name}</span>
                          <span className="text-xs text-foreground-muted">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-cta mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-foreground-muted"} />
                          ))}
                        </div>
                        {review.comment && <p className="text-sm text-foreground-secondary">{review.comment}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== SOLICITAR MODAL (Dark) ========== */}
      <SolicitarModal
        isOpen={showSolicitarModal}
        onClose={() => setShowSolicitarModal(false)}
        equipamento={equipamento}
        onEnviar={handleEnviarSolicitacao}
        loading={enviandoSolicitacao}
      />
    </>
  )
}
