import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Equipamento, isEquipamentoDisponivel, getLocadorDisplayName, CATEGORIA_CORES, ESTADOS_BR } from '../contexts/AppContext'
import { Loader2, HardHat, Package, Plus, MessageCircle, X, Search, MapPin, BadgeCheck, Construction, Building2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import ReviewStars from '../components/ReviewStars'

// Componente de carrossel de fotos simples
// IMPORTANTE: fotos[] vem como array de paths, precisa converter para URLs públicas
function FotosCarrossel({ fotos, imagemPrincipal, nomeEquipamento }: {
  fotos?: string[] | null
  imagemPrincipal?: string | null
  nomeEquipamento: string
}) {
  const [fotoAtual, setFotoAtual] = useState(0)
  const [imagemErro, setImagemErro] = useState(false)

  // Monta lista de fotos: prioriza fotos[0..n] > imagem_url
  // Converte paths para URLs públicas do Storage se necessário
  const listaFotos = useMemo(() => {
    const paths: string[] = []

    // Prioriza o array fotos
    if (fotos && Array.isArray(fotos) && fotos.length > 0) {
      fotos.forEach(f => { if (f) paths.push(f) })
    } else if (imagemPrincipal) {
      paths.push(imagemPrincipal)
    }

    // Converte paths para URLs públicas se não forem já URLs completas ou base64
    return paths.map(path => {
      // Se já é URL completa (http/https) ou base64 (data:image), usa direto
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:image')) {
        return path
      }
      // Se for path relativo do Storage (caso antigo), gera URL pública
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
    })
  }, [fotos, imagemPrincipal])

  if (listaFotos.length === 0 || imagemErro) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Package className="w-16 h-16 text-gray-300" />
      </div>
    )
  }

  const proximaFoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFotoAtual((prev) => (prev + 1) % listaFotos.length)
  }

  const fotoAnterior = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFotoAtual((prev) => (prev - 1 + listaFotos.length) % listaFotos.length)
  }

  // Prepara URL da foto (não adiciona cache buster em base64)
  const fotoUrl = listaFotos[fotoAtual]
  const finalUrl = fotoUrl.startsWith('data:') ? fotoUrl : `${fotoUrl}?t=${Date.now()}`

  return (
    <div className="relative w-full h-full group">
      <img
        src={finalUrl}
        alt={`${nomeEquipamento} - Foto ${fotoAtual + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.error('Erro ao carregar imagem:', listaFotos[fotoAtual].substring(0, 100))
          console.error('Event:', e)
          setImagemErro(true)
        }}
        onLoad={() => {
          console.log('Imagem carregada com sucesso!')
        }}
      />

      {/* Botões de navegação - só aparecem se tem mais de 1 foto */}
      {listaFotos.length > 1 && (
        <>
          <button
            onClick={fotoAnterior}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={proximaFoto}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicadores de foto */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {listaFotos.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setFotoAtual(index)
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === fotoAtual ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Contador de fotos */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded">
            {fotoAtual + 1}/{listaFotos.length}
          </div>
        </>
      )}
    </div>
  )
}

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
  onEnviar: (dados: {
    mensagem: string
    quantidadeDias: number
    endereco: {
      logradouro: string
      cep: string
      cidade: string
      uf: string
    }
  }) => Promise<void>
  loading: boolean
}) {
  const [mensagem, setMensagem] = useState('')
  const [quantidadeDias, setQuantidadeDias] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [cep, setCep] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')

  // Atualiza mensagem quando modal abre com equipamento
  useEffect(() => {
    if (isOpen && equipamento?.nome) {
      setMensagem(
        `Olá! Tenho interesse em alugar o equipamento "${equipamento.nome}". Podemos conversar sobre disponibilidade e condições?`
      )
      // Limpa os campos ao abrir
      setQuantidadeDias('')
      setLogradouro('')
      setCep('')
      setCidade('')
      setUf('')
    }
  }, [isOpen, equipamento?.nome])

  if (!isOpen || !equipamento) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quantidadeDias || !logradouro || !cep || !cidade || !uf) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }

    await onEnviar({
      mensagem,
      quantidadeDias: parseInt(quantidadeDias),
      endereco: {
        logradouro,
        cep,
        cidade,
        uf
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Solicitar Equipamento</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="bg-amber-50 p-3 rounded-lg border-2 border-amber-200">
            <p className="text-sm text-gray-600">Equipamento:</p>
            <p className="font-semibold text-gray-800 text-lg">{equipamento.nome}</p>
            {equipamento.preco_diaria && (
              <p className="text-amber-600 font-bold text-xl mt-1">
                R$ {equipamento.preco_diaria.toFixed(2)}/dia
              </p>
            )}
          </div>

          {/* Quantidade de dias */}
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">
              Quantos dias você precisa? *
            </label>
            <input
              type="number"
              value={quantidadeDias}
              onChange={(e) => setQuantidadeDias(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="Ex: 7"
              min="1"
              required
            />
          </div>

          {/* Endereço de entrega */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-base">Local de Entrega *</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço completo (Rua, Número)
              </label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="Ex: Rua das Flores, 123"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="00000-000"
                  maxLength={9}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UF
                </label>
                <select
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  required
                >
                  <option value="">Selecione</option>
                  {ESTADOS_BR.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="Ex: São Paulo"
                required
              />
            </div>
          </div>

          {/* Mensagem opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem adicional (opcional)
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              rows={3}
              placeholder="Informações adicionais..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-600 text-white text-lg font-bold rounded-xl hover:bg-amber-700 focus:ring-4 focus:ring-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {loading && <Loader2 className="w-6 h-6 animate-spin" />}
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </button>
        </form>
      </div>
    </div>
  )
}

function SearchBar({
  searchTerm,
  setSearchTerm,
  selectedUF,
  setSelectedUF,
  selectedCidade,
  setSelectedCidade,
  cidadesDisponiveis
}: {
  searchTerm: string
  setSearchTerm: (value: string) => void
  selectedUF: string
  setSelectedUF: (value: string) => void
  selectedCidade: string
  setSelectedCidade: (value: string) => void
  cidadesDisponiveis: string[]
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Campo de busca por nome */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar equipamento..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>

        {/* Seletor de Estado */}
        <div className="w-full md:w-32">
          <select
            value={selectedUF}
            onChange={(e) => {
              setSelectedUF(e.target.value)
              setSelectedCidade('')
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
          >
            <option value="">UF</option>
            {ESTADOS_BR.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>

        {/* Campo de cidade */}
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={selectedCidade}
            onChange={(e) => setSelectedCidade(e.target.value)}
            placeholder="Cidade..."
            list="cidades-list"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
          <datalist id="cidades-list">
            {cidadesDisponiveis.map((cidade) => (
              <option key={cidade} value={cidade} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  )
}

function EquipamentoCard({
  equipamento,
  onSolicitar,
  isOwner
}: {
  equipamento: Equipamento
  onSolicitar: (eq: Equipamento) => void
  isOwner: boolean
}) {
  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(equipamento.preco_diaria)

  const isDisponivel = isEquipamentoDisponivel(equipamento)
  const nomeLocadora = getLocadorDisplayName(equipamento)

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow ${!isDisponivel ? 'opacity-75' : ''}`}>
      <div className="aspect-video bg-gray-100 relative">
        {/* Carrossel de fotos */}
        <FotosCarrossel
          fotos={equipamento.fotos}
          imagemPrincipal={equipamento.fotos && equipamento.fotos.length > 0 ? equipamento.fotos[0] : undefined}
          nomeEquipamento={equipamento.nome}
        />
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          {equipamento.categoria && (
            <span className={`px-2 py-1 ${CATEGORIA_CORES[equipamento.categoria] || 'bg-gray-600'} text-white text-xs font-medium rounded-full`}>
              {equipamento.categoria}
            </span>
          )}
          {!isDisponivel && (
            <span className="px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-full uppercase">
              Indisponível
            </span>
          )}
        </div>
        {isOwner && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-slate-700 text-white text-xs font-medium rounded-full z-10">
            Seu anúncio
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Preço em destaque estilo OLX */}
        <div className="mb-2">
          <span className="text-amber-600 font-bold text-2xl">
            {precoFormatado}
          </span>
          <span className="text-gray-500 text-sm font-medium">/dia</span>
        </div>

        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800 text-base line-clamp-2">
            {equipamento.nome}
          </h3>
          {false && (
            <span title="Locador Verificado">
              <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
            </span>
          )}
        </div>

        {/* Localização em destaque */}
        {(equipamento.cidade || equipamento.uf) && (
          <div className="flex items-center gap-1 text-gray-600 text-sm mb-2 bg-gray-50 px-2 py-1 rounded-md w-fit">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span className="font-medium">
              {equipamento.cidade}{equipamento.cidade && equipamento.uf ? ', ' : ''}{equipamento.uf}
            </span>
          </div>
        )}

        {/* Nome da Locadora - escalabilidade para múltiplas locadoras */}
        {nomeLocadora && (
          <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="font-medium truncate" title={nomeLocadora}>
              {nomeLocadora}
            </span>
          </div>
        )}

        {/* Avaliações */}
        <div className="mb-2">
          <ReviewStars
            rating={0 || 0}
            totalReviews={0 || 0}
            size="sm"
          />
        </div>

        {equipamento.descricao && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">
            {equipamento.descricao}
          </p>
        )}

        <div className="flex items-center justify-end">
          {!isOwner && isDisponivel && (
            <button
              onClick={() => onSolicitar(equipamento)}
              className="flex items-center gap-1 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Solicitar
            </button>
          )}
          {!isOwner && !isDisponivel && (
            <span className="px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
              Indisponível
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16">
      <HardHat className="w-20 h-20 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-600 mb-2">
        Nenhum equipamento disponível
      </h3>
      <p className="text-gray-400 text-center max-w-md">
        No momento não temos equipamentos cadastrados. Volte em breve para conferir nossas novidades!
      </p>
    </div>
  )
}

function EmptySearchState({ onClear }: { onClear: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl">
      <Construction className="w-20 h-20 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-600 mb-2">
        Nenhuma máquina encontrada
      </h3>
      <p className="text-gray-400 text-center max-w-md mb-4">
        Não encontramos equipamentos com esses critérios de busca. Tente mudar os filtros ou buscar em outra região.
      </p>
      <button
        onClick={onClear}
        className="px-6 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
      >
        Limpar Filtros
      </button>
    </div>
  )
}

function LoadingGrid() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-200 rounded w-24" />
              <div className="h-9 bg-gray-200 rounded w-28" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default function Home() {
  const { user, profile, signOut } = useAuth()
  const { equipamentos, loadingEquipamentos, iniciarChat, mensagensNaoLidas, fetchMensagensNaoLidas, setupMensagensRealtime } = useApp()
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Estados de busca
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUF, setSelectedUF] = useState('')
  const [selectedCidade, setSelectedCidade] = useState('')

  // Busca mensagens não lidas e configura Realtime
  useEffect(() => {
    if (user?.id) {
      fetchMensagensNaoLidas(user.id)
      setupMensagensRealtime(user.id)
    }
  }, [user?.id])

  // Lista de cidades disponíveis baseada nos equipamentos e UF selecionado
  const cidadesDisponiveis = useMemo(() => {
    const cidades = new Set<string>()
    equipamentos.forEach((eq) => {
      if (eq.cidade) {
        if (!selectedUF || eq.uf === selectedUF) {
          cidades.add(eq.cidade)
        }
      }
    })
    return Array.from(cidades).sort()
  }, [equipamentos, selectedUF])

  // Filtra equipamentos
  const equipamentosFiltrados = useMemo(() => {
    return equipamentos.filter((eq) => {
      // Filtro por nome
      if (searchTerm) {
        const termo = searchTerm.toLowerCase()
        const nomeMatch = eq.nome.toLowerCase().includes(termo)
        const categoriaMatch = eq.categoria?.toLowerCase().includes(termo)
        const descricaoMatch = eq.descricao?.toLowerCase().includes(termo)
        if (!nomeMatch && !categoriaMatch && !descricaoMatch) {
          return false
        }
      }

      // Filtro por UF
      if (selectedUF && eq.uf !== selectedUF) {
        return false
      }

      // Filtro por cidade
      if (selectedCidade) {
        const cidadeLower = selectedCidade.toLowerCase()
        if (!eq.cidade?.toLowerCase().includes(cidadeLower)) {
          return false
        }
      }

      return true
    })
  }, [equipamentos, searchTerm, selectedUF, selectedCidade])

  const hasFilters = searchTerm || selectedUF || selectedCidade

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedUF('')
    setSelectedCidade('')
  }

  const handleSolicitar = (equipamento: Equipamento) => {
    // Garante que o equipamento está selecionado antes de abrir o modal
    setSelectedEquipamento(equipamento)
    // Usa setTimeout para garantir que o estado foi atualizado antes de abrir o modal
    setTimeout(() => {
      setModalOpen(true)
    }, 0)
  }

  const handleEnviarSolicitacao = async (dados: {
    mensagem: string
    quantidadeDias: number
    endereco: {
      logradouro: string
      cep: string
      cidade: string
      uf: string
    }
  }) => {
    if (!selectedEquipamento || !user) return

    setEnviando(true)
    const result = await iniciarChat(
      selectedEquipamento.id,
      selectedEquipamento.locador_id,
      user.id,
      dados.mensagem,
      {
        quantidadeDias: dados.quantidadeDias,
        endereco: dados.endereco
      }
    )

    if (result.success && result.chatId) {
      setModalOpen(false)
      navigate(`/chat/${result.chatId}`)
    }

    setEnviando(false)
  }

  // Nome dinâmico do usuário: nome_empresa > full_name > email > 'Perfil'
  const nomeUsuario = profile?.nome_empresa || profile?.full_name || user?.email || 'Perfil'

  // Verifica se é locador para exibir botão de anunciar
  const isLocador = profile?.tipo_usuario === 'locador'

  // DEBUG: Log do profile
  useEffect(() => {
    if (profile) {
      console.log('[Home] Profile carregado:', {
        email: profile.email,
        full_name: profile.full_name,
        tipo_usuario: profile.tipo_usuario,
        nome_empresa: profile.nome_empresa,
        isLocador
      })
    } else {
      console.warn('[Home] Profile não carregado ainda')
    }
  }, [profile, isLocador])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-zinc-200">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HardHat className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-600">LocaObra</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/chats"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Minhas Conversas"
            >
              <MessageCircle className="w-5 h-5" />
              {mensagensNaoLidas > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {mensagensNaoLidas > 9 ? '9+' : mensagensNaoLidas}
                </span>
              )}
            </Link>
            {/* Botão de Meus Equipamentos - Só aparece para locadores */}
            {isLocador && (
              <Link
                to="/meus-equipamentos"
                className="flex items-center gap-1 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Meus Equipamentos</span>
              </Link>
            )}
            <span className="text-gray-600 hidden md:block font-medium">
              {nomeUsuario}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Equipamentos Disponíveis
          </h2>
          <p className="text-gray-600">
            Alugue os melhores equipamentos para sua obra
          </p>
        </div>

        {/* Barra de Busca */}
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedUF={selectedUF}
          setSelectedUF={setSelectedUF}
          selectedCidade={selectedCidade}
          setSelectedCidade={setSelectedCidade}
          cidadesDisponiveis={cidadesDisponiveis}
        />

        {/* Contador de resultados */}
        {!loadingEquipamentos && hasFilters && equipamentosFiltrados.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {equipamentosFiltrados.length} equipamento{equipamentosFiltrados.length !== 1 ? 's' : ''} encontrado{equipamentosFiltrados.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {loadingEquipamentos && (
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Carregando equipamentos...</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingEquipamentos ? (
            <LoadingGrid />
          ) : equipamentos.length === 0 ? (
            <EmptyState />
          ) : equipamentosFiltrados.length === 0 && hasFilters ? (
            <EmptySearchState onClear={clearFilters} />
          ) : (
            equipamentosFiltrados.map((equipamento) => (
              <EquipamentoCard
                key={equipamento.id}
                equipamento={equipamento}
                onSolicitar={handleSolicitar}
                isOwner={equipamento.locador_id === user?.id}
              />
            ))
          )}
        </div>
      </main>

      <SolicitarModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        equipamento={selectedEquipamento}
        onEnviar={handleEnviarSolicitacao}
        loading={enviando}
      />
    </div>
  )
}
