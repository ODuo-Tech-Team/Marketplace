import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Equipamento, isEquipamentoDisponivel, getLocadorDisplayName, ESTADOS_BR, isLinhaAmarela } from '../contexts/AppContext'
import { Loader2, Package, X, Search, MapPin, BadgeCheck, Construction, Building2, ChevronLeft, ChevronRight, Check, Truck as TruckIcon, Crown, Gauge, Zap, Bell, HardHat } from 'lucide-react'
import OwnerDashboard from '../components/OwnerDashboard'

// ========== CARROSSEL DE FOTOS (Premium) ==========
function FotosCarrossel({ fotos, imagemPrincipal, nomeEquipamento }: {
  fotos?: string[] | null
  imagemPrincipal?: string | null
  nomeEquipamento: string
}) {
  const [indiceAtual, setIndiceAtual] = useState(0)

  const todasFotos = useMemo(() => {
    const urlsFotos: string[] = []
    if (fotos && fotos.length > 0) {
      fotos.forEach(path => {
        if (!path) return
        if (path.startsWith('http') || path.startsWith('data:')) {
          urlsFotos.push(path)
        } else {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          if (supabaseUrl) {
            urlsFotos.push(`${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`)
          }
        }
      })
    }
    if (urlsFotos.length === 0 && imagemPrincipal) {
      urlsFotos.push(imagemPrincipal)
    }
    return urlsFotos
  }, [fotos, imagemPrincipal])

  if (todasFotos.length === 0) {
    return (
      <div className="w-full h-56 bg-slate-100 flex items-center justify-center">
        <Package className="w-12 h-12 text-slate-300" />
      </div>
    )
  }

  if (todasFotos.length === 1) {
    return (
      <div className="w-full h-56 overflow-hidden">
        <img src={todasFotos[0]} alt={nomeEquipamento} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-56 overflow-hidden">
      <img
        src={todasFotos[indiceAtual]}
        alt={`${nomeEquipamento} - ${indiceAtual + 1}`}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setIndiceAtual(i => i > 0 ? i - 1 : todasFotos.length - 1) }}
          className="ml-2 p-1.5 bg-white/80 backdrop-blur text-slate-700 rounded-full hover:bg-white shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIndiceAtual(i => i < todasFotos.length - 1 ? i + 1 : 0) }}
          className="mr-2 p-1.5 bg-white/80 backdrop-blur text-slate-700 rounded-full hover:bg-white shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {todasFotos.map((_, idx) => (
          <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === indiceAtual ? 'bg-white scale-110' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}

// ========== CARD DE EQUIPAMENTO (Premium) ==========
function EquipamentoCard({
  equipamento,
  onSolicitar
}: {
  equipamento: Equipamento
  onSolicitar: () => void
}) {
  const disponivel = isEquipamentoDisponivel(equipamento)
  const isLA = equipamento.categoria ? isLinhaAmarela(equipamento.categoria) : false
  const isDestaque = equipamento.destaque === true

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col">
      {/* Imagem */}
      <div className="h-56 bg-slate-100 relative overflow-hidden">
        <FotosCarrossel
          fotos={equipamento.fotos}
          nomeEquipamento={equipamento.nome}
        />

        {/* Badge DESTAQUE */}
        {isDestaque && (
          <span className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1 backdrop-blur-md">
            <Crown size={12} fill="currentColor" /> DESTAQUE
          </span>
        )}

        {/* Badge Categoria PESADO / LEVE */}
        {isLA ? (
          <span className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur text-amber-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-white/50">
            <Gauge size={14} className="text-amber-600" /> PESADO
          </span>
        ) : (
          <span className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur text-blue-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-white/50">
            <Zap size={14} className="text-blue-600" /> LEVE
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wider">
            <MapPin size={10} /> {equipamento.cidade}/{equipamento.uf}
          </p>
          <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-amber-600 transition-colors line-clamp-1">
            {equipamento.nome}
          </h3>
        </div>

        {/* Locador */}
        {getLocadorDisplayName(equipamento) && (
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-1">
            {getLocadorDisplayName(equipamento)}
            {equipamento.locador_verificado && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
          </p>
        )}

        {/* Dados técnicos para Linha Amarela */}
        {isLA && (equipamento.ano || equipamento.horimetro_atual) && (
          <div className="flex gap-2 mb-2 text-[10px] text-slate-500 font-medium">
            {equipamento.ano && <span className="bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Ano: {equipamento.ano}</span>}
            {equipamento.horimetro_atual && <span className="bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{equipamento.horimetro_atual}h</span>}
          </div>
        )}

        {/* Preço e Botão */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">A partir de</p>
            <p className="text-xl font-black text-slate-900">
              R$ {equipamento.preco_diaria?.toFixed(0)?.replace('.', ',')}
              <span className="text-sm font-medium text-slate-400">/dia</span>
            </p>
          </div>
          {disponivel ? (
            <button
              onClick={onSolicitar}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-95"
            >
              Alugar
            </button>
          ) : (
            <span className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold">
              Indisponível
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ========== MODAL DE SOLICITAÇÃO ==========
function SolicitarModal({
  isOpen,
  onClose,
  equipamento,
  onEnviar,
  loading
}: {
  isOpen: boolean
  onClose: () => void
  equipamento: Equipamento | null
  onEnviar: (dados: { mensagem: string; quantidadeDias: number; endereco: { logradouro: string; cep: string; cidade: string; uf: string }; dataInicio?: string; dataFim?: string }) => Promise<void>
  loading: boolean
}) {
  const [mensagem, setMensagem] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [cep, setCep] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')

  useEffect(() => {
    if (isOpen) {
      setMensagem('')
      setDataInicio('')
      setDataFim('')
      setLogradouro('')
      setCep('')
      setCidade('')
      setUf('')
    }
  }, [isOpen])

  const calcDias = (): number => {
    if (!dataInicio || !dataFim) return 0
    const d1 = new Date(dataInicio)
    const d2 = new Date(dataFim)
    return Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)))
  }
  const quantidadeDias = calcDias()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipamento) return
    await onEnviar({
      mensagem: mensagem || `Ola! Tenho interesse em alugar ${equipamento.nome}. Podemos negociar?`,
      quantidadeDias: quantidadeDias || 1,
      endereco: { logradouro, cep, cidade, uf },
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    })
  }

  const hoje = new Date().toISOString().split('T')[0]
  const valorEstimado = equipamento ? (equipamento.preco_diaria || 0) * quantidadeDias : 0

  if (!isOpen || !equipamento) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Solicitar Orçamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Equipamento Info */}
          <div className="flex gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
              {equipamento.fotos?.[0] ? (
                <img
                  src={equipamento.fotos[0].startsWith('http') ? equipamento.fotos[0] : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/equipamentos/${equipamento.fotos[0]}`}
                  alt={equipamento.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-900">{equipamento.nome}</p>
              <p className="text-sm text-slate-500">{equipamento.cidade}/{equipamento.uf}</p>
              <p className="text-amber-600 font-black">R$ {equipamento.preco_diaria?.toFixed(2)}/dia</p>
            </div>
          </div>

          {/* Periodo */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Periodo de Locacao *</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Data Inicio</label>
                <input
                  type="date"
                  value={dataInicio}
                  min={hoje}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio || hoje}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                  required
                />
              </div>
            </div>
            {quantidadeDias > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                {quantidadeDias} dias - Valor estimado: <span className="text-amber-600 font-bold">R$ {valorEstimado.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Endereço de Entrega */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-700">Endereço de Entrega</p>
            <input
              type="text"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              placeholder="Rua, número, bairro"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="CEP"
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
              >
                <option value="">UF</option>
                {ESTADOS_BR.map(estado => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mensagem (opcional)</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Deixe uma mensagem para o locador..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !dataInicio || !dataFim}
              className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Enviar Solicitação
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ========== FILTRO DE CATEGORIAS (Premium Pills) ==========
function CategoriasFiltro({
  categoriaSelecionada,
  onSelect
}: {
  categoriaSelecionada: string
  onSelect: (cat: string) => void
}) {
  const categoriasComIcone = [
    { nome: 'Todos', icone: Package },
    { nome: 'Linha Amarela', icone: Construction },
    { nome: 'Ferramentas', icone: HardHat },
    { nome: 'Construção', icone: Building2 },
    { nome: 'Outros', icone: Package }
  ]

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar">
      {categoriasComIcone.map(({ nome, icone: Icone }, i) => {
        const isSelected = categoriaSelecionada === nome || (nome === 'Todos' && !categoriaSelecionada)
        return (
          <button
            key={nome}
            onClick={() => onSelect(nome === 'Todos' ? '' : nome)}
            className={`px-6 py-3 rounded-full text-sm font-bold shadow-sm whitespace-nowrap transition-all border flex items-center gap-2 ${
              isSelected
                ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-md'
            }`}
          >
            <Icone className="w-4 h-4" />
            {nome}
          </button>
        )
      })}
    </div>
  )
}

// ========== COMPONENTE PRINCIPAL ==========
export default function Home() {
  const { profile } = useAuth()
  const isLocador = profile?.tipo_usuario === 'locador'

  if (isLocador) {
    return <OwnerDashboard />
  }

  return <RenterView />
}

// ========== VISÃO DO LOCATÁRIO (MARKETPLACE PREMIUM) ==========
function RenterView() {
  const { user, profile, signOut } = useAuth()
  const { equipamentos, loadingEquipamentos, iniciarChat, mensagensNaoLidas, fetchMensagensNaoLidas, setupMensagensRealtime } = useApp()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [sucessoEnvio, setSucessoEnvio] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUF, setSelectedUF] = useState('')
  const [selectedCidade, setSelectedCidade] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')

  const nomeUsuario = profile?.nome_empresa || profile?.full_name || 'Usuário'
  const cidadeUsuario = profile?.cidade || ''
  const ufUsuario = profile?.uf || ''
  const localUsuario = cidadeUsuario && ufUsuario ? `${cidadeUsuario}, ${ufUsuario}` : 'Brasil'

  useEffect(() => {
    if (user?.id) {
      fetchMensagensNaoLidas(user.id)
      setupMensagensRealtime(user.id)
    }
  }, [user?.id])

  const cidadesDisponiveis = useMemo(() => {
    const cidades = new Set(
      equipamentos
        .filter(eq => !selectedUF || eq.uf === selectedUF)
        .map(eq => eq.cidade)
        .filter((c): c is string => !!c)
    )
    return Array.from(cidades).sort()
  }, [equipamentos, selectedUF])

  const equipamentosFiltrados = useMemo(() => {
    return equipamentos
      .filter(eq => {
        const disponivel = isEquipamentoDisponivel(eq)
        if (!disponivel) return false
        if (searchTerm && !eq.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false
        if (selectedUF && eq.uf !== selectedUF) return false
        if (selectedCidade && eq.cidade !== selectedCidade) return false
        if (selectedCategoria) {
          if (selectedCategoria === 'Linha Amarela') {
            if (!eq.categoria || !isLinhaAmarela(eq.categoria)) return false
          } else if (eq.categoria !== selectedCategoria) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        const aDestaque = a.destaque ? 1 : 0
        const bDestaque = b.destaque ? 1 : 0
        if (bDestaque !== aDestaque) return bDestaque - aDestaque
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
        return bDate - aDate
      })
  }, [equipamentos, searchTerm, selectedUF, selectedCidade, selectedCategoria])

  const handleSolicitar = (equipamento: Equipamento) => {
    setSelectedEquipamento(equipamento)
    setModalOpen(true)
  }

  const handleEnviarSolicitacao = async (dados: {
    mensagem: string
    quantidadeDias: number
    endereco: { logradouro: string; cep: string; cidade: string; uf: string }
    dataInicio?: string
    dataFim?: string
  }) => {
    if (!selectedEquipamento || !user || enviando) return

    setEnviando(true)

    try {
      const result = await iniciarChat(
        selectedEquipamento.id,
        selectedEquipamento.locador_id,
        user.id,
        dados.mensagem,
        { quantidadeDias: dados.quantidadeDias, endereco: dados.endereco }
      )

      if (result.success) {
        setModalOpen(false)
        setSelectedEquipamento(null)
        setSucessoEnvio(true)
        setTimeout(() => setSucessoEnvio(false), 4000)
      } else {
        alert(result.error || 'Erro ao criar solicitação. Tente novamente.')
      }
    } catch (err) {
      alert('Erro inesperado. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* ========== NAVBAR PREMIUM ========== */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 px-6 flex justify-between items-center sticky top-0 z-50 transition-all">
        <Link to="/" className="flex items-center gap-2.5 font-black text-2xl text-slate-900 tracking-tight hover:opacity-80 transition-opacity">
          <div className="bg-amber-500 p-1.5 rounded-lg shadow-amber-200 shadow-sm">
            <TruckIcon className="text-white" size={24} />
          </div>
          LocaObra
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/chats" className="text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors hidden sm:block">
            Meus Pedidos
          </Link>
          <Link to="/chats" className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <Bell size={20} />
            {mensagensNaoLidas > 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </Link>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{nomeUsuario}</p>
              <p className="text-[10px] text-slate-500 font-medium">{localUsuario}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm shadow-inner border border-white">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>
            <button onClick={signOut} className="text-xs text-slate-400 hover:text-slate-700 font-bold transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ========== HERO SECTION ========== */}
      <div className="bg-slate-900 px-4 pt-10 pb-16 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
            Equipamentos para sua obra <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">na palma da mão.</span>
          </h1>

          {/* Busca Premium */}
          <div className="bg-white p-2.5 rounded-2xl shadow-2xl shadow-black/20 flex flex-col md:flex-row max-w-3xl mx-auto transform transition-transform hover:scale-[1.01]">
            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-slate-100">
              <Search className="text-slate-400 mr-3" size={22} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="O que você precisa? (Ex: Retroescavadeira...)"
                className="w-full outline-none text-slate-700 font-medium text-base bg-transparent placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center px-4 py-3 w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 md:bg-transparent">
              <MapPin className="text-amber-500 mr-2" size={22} />
              <select
                value={selectedUF}
                onChange={(e) => { setSelectedUF(e.target.value); setSelectedCidade('') }}
                className="w-full outline-none text-slate-700 font-bold bg-transparent text-sm"
              >
                <option value="">Todo o Brasil</option>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <button
              onClick={() => {/* search is automatic */}}
              className="bg-amber-500 hover:bg-amber-400 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/25 active:scale-95 text-lg"
            >
              Buscar
            </button>
          </div>

          {/* Filtros de Categoria - dentro do hero */}
          <div className="flex justify-center gap-3 overflow-x-auto no-scrollbar pt-2">
            <CategoriasFiltro
              categoriaSelecionada={selectedCategoria}
              onSelect={setSelectedCategoria}
            />
          </div>
        </div>
      </div>

      {/* ========== GRID ========== */}
      <div className="max-w-7xl mx-auto px-6 pt-6 relative z-20">
        {/* Filtro de cidade (aparece quando UF selecionado) */}
        {selectedUF && cidadesDisponiveis.length > 0 && (
          <div className="mb-6">
            <select
              value={selectedCidade}
              onChange={(e) => setSelectedCidade(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            >
              <option value="">Todas as cidades</option>
              {cidadesDisponiveis.map(cidade => <option key={cidade} value={cidade}>{cidade}</option>)}
            </select>
          </div>
        )}

        {/* Contador */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 font-medium">
            <span className="text-slate-900 font-bold">{equipamentosFiltrados.length}</span> equipamentos encontrados
          </p>
        </div>

        {/* Loading */}
        {loadingEquipamentos ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          </div>
        ) : equipamentosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-slate-100 p-4 rounded-full mb-4 inline-block">
              <Package className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-2">Nenhum equipamento encontrado</h3>
            <p className="text-slate-400">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {equipamentosFiltrados.map(equipamento => (
              <EquipamentoCard
                key={equipamento.id}
                equipamento={equipamento}
                onSolicitar={() => handleSolicitar(equipamento)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========== MODAIS ========== */}
      <SolicitarModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        equipamento={selectedEquipamento}
        onEnviar={handleEnviarSolicitacao}
        loading={enviando}
      />

      {/* Popup de Sucesso */}
      {sucessoEnvio && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Solicitação Enviada!</h2>
            <p className="text-slate-500 mb-4">Sua solicitação foi enviada com sucesso. O locador irá analisar e responder em breve.</p>
            <p className="text-sm text-slate-400 mb-6">Acompanhe pelo menu de <strong className="text-slate-700">Meus Pedidos</strong></p>
            <button
              onClick={() => setSucessoEnvio(false)}
              className="w-full py-3 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
