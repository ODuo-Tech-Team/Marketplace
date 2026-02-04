import { useEffect, useState, useRef, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  useApp, CATEGORIAS, ESTADOS_BR, isLinhaAmarela, EQUIPMENT_STATUS, VOLTAGENS,
  type Equipamento, type NovoEquipamento, type Chat, type Consumivel
} from '../contexts/AppContext'
import {
  HardHat, Plus, X, Loader2, Package, ImagePlus, Trash2, RotateCcw, Pencil,
  MessageCircle, DollarSign, Truck as TruckIcon, Calendar, MoreVertical,
  ChevronDown, TrendingUp, Search, Send, ArrowRightLeft, Clock, CheckCircle2
} from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ConsumiveisManager } from '../components/ConsumiveisManager'
import { HorimetroInput } from '../components/chat/HorimetroInput'
import DynamicSpecFields from '../components/DynamicSpecFields'
import { VERTICALS, VERTICAL_CONFIGS, type VerticalKey, getVerticalConfig, isLinhaAmarelaCategory } from '../config/verticals'
import CalendarioDisponibilidade from '../components/CalendarioDisponibilidade'

// Interface para equipamento em uso (com dados da proposta/cliente)
interface EquipamentoEmUso {
  equipamento: Equipamento
  proposta_id: string
  cliente_nome: string
  data_entrega?: string
  data_inicio?: string
  data_fim?: string
}

type TabType = 'negociacao' | 'a_enviar' | 'em_locacao' | 'devolucoes' | 'todos'

// ========== MODAL DE NOVO EQUIPAMENTO ==========
function NovoEquipamentoModal({
  isOpen,
  onClose,
  onSubmit,
  onUploadImagens,
  loading,
  equipamentoInicial
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dados: NovoEquipamento) => Promise<void>
  onUploadImagens: (files: File[]) => Promise<{ urls: string[]; error?: string }>
  loading: boolean
  equipamentoInicial?: Equipamento | null
}) {
  const { fetchConsumiveis, addConsumivel, removeConsumivel } = useApp()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [precoDiaria, setPrecoDiaria] = useState('')
  const [categoria, setCategoria] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [ano, setAno] = useState('')
  const [horimetroAtual, setHorimetroAtual] = useState('')
  const [pesoOperacional, setPesoOperacional] = useState('')
  const [voltagem, setVoltagem] = useState('')
  const [ofereceOperador, setOfereceOperador] = useState(false)
  const [consumiveis, setConsumiveis] = useState<Consumivel[]>([])
  const [fotosPreview, setFotosPreview] = useState<string[]>([])
  const [fotosFiles, setFotosFiles] = useState<File[]>([])
  const [uploadingFotos, setUploadingFotos] = useState(false)
  const [fotosError, setFotosError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Multi-vertical
  const [selectedVertical, setSelectedVertical] = useState<VerticalKey>('construcao')
  const [specs, setSpecs] = useState<Record<string, any>>({})
  const verticalConfig = getVerticalConfig(selectedVertical)

  useEffect(() => {
    if (equipamentoInicial && isOpen) {
      setNome(equipamentoInicial.nome || '')
      setDescricao(equipamentoInicial.descricao || '')
      setPrecoDiaria(equipamentoInicial.preco_diaria?.toString() || '')
      setCategoria(equipamentoInicial.categoria || '')
      setCidade(equipamentoInicial.cidade || '')
      setUf(equipamentoInicial.uf || '')
      setAno(equipamentoInicial.ano?.toString() || '')
      setHorimetroAtual(equipamentoInicial.horimetro_atual?.toString() || '')
      setPesoOperacional(equipamentoInicial.peso_operacional?.toString() || '')
      setVoltagem((equipamentoInicial as any).voltagem || '')
      setOfereceOperador(equipamentoInicial.oferece_operador || false)
      // Multi-vertical: pre-fill
      setSelectedVertical((equipamentoInicial.vertical as VerticalKey) || 'construcao')
      setSpecs(equipamentoInicial.specs || {})
      if (equipamentoInicial.fotos?.length) {
        setFotosPreview(equipamentoInicial.fotos)
      }
      // Fetch consumiveis for the equipment being edited
      fetchConsumiveis(equipamentoInicial.id).then(setConsumiveis)
    } else if (isOpen) {
      resetForm()
    }
  }, [equipamentoInicial, isOpen])

  const resetForm = () => {
    setNome(''); setDescricao(''); setPrecoDiaria(''); setCategoria('')
    setCidade(''); setUf(''); setAno(''); setHorimetroAtual('')
    setPesoOperacional(''); setVoltagem(''); setOfereceOperador(false); setConsumiveis([])
    setFotosPreview([]); setFotosFiles([]); setFotosError(null)
    setSelectedVertical('construcao'); setSpecs({})
  }

  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const novosFiles = [...fotosFiles, ...files].slice(0, 5)
    setFotosFiles(novosFiles)
    const novosPreviews: string[] = []
    novosFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        novosPreviews.push(ev.target?.result as string)
        if (novosPreviews.length === novosFiles.length) setFotosPreview(novosPreviews)
      }
      reader.readAsDataURL(file)
    })
    setFotosError(null)
  }

  const removerFoto = (index: number) => {
    setFotosFiles(prev => prev.filter((_, i) => i !== index))
    setFotosPreview(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFotosError(null)
    let fotosUrls: string[] = []
    const fotosExistentes = fotosPreview.filter(url => typeof url === 'string' && (url.startsWith('data:') || url.startsWith('http')))
    if (fotosFiles.length > 0) {
      setUploadingFotos(true)
      const result = await onUploadImagens(fotosFiles)
      setUploadingFotos(false)
      if (result.error) { setFotosError(result.error); return }
      fotosUrls = result.urls
    }
    const todasFotos = [...fotosExistentes, ...fotosUrls]
    // Build specs from dynamic fields (for non-construcao verticals)
    // For construcao, also keep legacy columns for backward compat
    const finalSpecs = selectedVertical === 'construcao'
      ? { ...specs, ano: ano ? parseInt(ano) : null, horimetro_atual: horimetroAtual ? parseFloat(horimetroAtual) : null, peso_operacional: pesoOperacional ? parseFloat(pesoOperacional) : null, voltagem: voltagem || null, oferece_operador: ofereceOperador }
      : specs
    await onSubmit({
      nome, descricao: descricao || undefined, preco_diaria: parseFloat(precoDiaria),
      categoria, cidade, uf, fotos: todasFotos.length > 0 ? todasFotos : undefined,
      // Legacy columns (construcao backward compat)
      ano: ano ? parseInt(ano) : undefined,
      horimetro_atual: horimetroAtual ? parseFloat(horimetroAtual) : undefined,
      peso_operacional: pesoOperacional ? parseFloat(pesoOperacional) : undefined,
      voltagem: voltagem || undefined,
      oferece_operador: ofereceOperador || undefined,
      // Multi-vertical
      vertical: selectedVertical,
      specs: finalSpecs,
    })
    resetForm()
  }

  if (!isOpen) return null
  const mostrarCamposTecnicos = categoria && isLinhaAmarela(categoria)
  const isConstrucao = selectedVertical === 'construcao'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b bg-surface-elevated">
          <h2 className="text-xl font-bold text-foreground">
            {equipamentoInicial ? 'Editar Equipamento' : 'Novo Equipamento'}
          </h2>
          <button onClick={() => { resetForm(); onClose() }} className="p-2 hover:bg-surface-inset rounded-lg">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Seletor de Vertical */}
          <div>
            <label className="block text-sm font-semibold text-foreground-secondary mb-2">Setor / Vertical *</label>
            <div className="grid grid-cols-4 gap-2">
              {VERTICALS.map((vKey) => {
                const vConf = VERTICAL_CONFIGS[vKey]
                const Icon = vConf.icon
                const isActive = selectedVertical === vKey
                return (
                  <button
                    key={vKey}
                    type="button"
                    onClick={() => { setSelectedVertical(vKey); setCategoria(''); setSpecs({}) }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-bold ${
                      isActive
                        ? 'border-cta bg-blue-50 text-cta'
                        : 'border-border text-foreground-muted hover:border-border'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="truncate w-full text-center">{vConf.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Upload de Fotos */}
          <div>
            <label className="block text-sm font-semibold text-foreground-secondary mb-2">Fotos do Equipamento</label>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-cta hover:bg-blue-50 transition-colors">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFotosChange} className="hidden" />
              <ImagePlus className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
              <p className="text-sm text-foreground-secondary">Clique para adicionar fotos</p>
              <p className="text-xs text-foreground-muted mt-1">Maximo 5 fotos</p>
            </div>
            {fotosPreview.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {fotosPreview.map((foto, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={foto} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removerFoto(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fotosError && <p className="text-sm text-red-500 mt-2">{fotosError}</p>}
          </div>
          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-foreground-secondary mb-1">Nome do Equipamento *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-cta focus:border-cta outline-none bg-surface-card text-foreground" placeholder="Ex: Retroescavadeira CAT 416E" required />
          </div>
          {/* Categoria e Preco */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground-secondary mb-1">Categoria *</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-cta outline-none bg-surface-card text-foreground" required>
                <option value="">Selecione</option>
                {verticalConfig.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground-secondary mb-1">Valor Diaria (R$) *</label>
              <input type="number" step="0.01" min="0" value={precoDiaria} onChange={(e) => setPrecoDiaria(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-cta outline-none bg-surface-card text-foreground" placeholder="Ex: 350.00" required />
            </div>
          </div>

          {/* Campos Tecnicos - Construcao usa layout legado, outros usam DynamicSpecFields */}
          {isConstrucao ? (
            <>
              {/* Campos tecnicos para Linha Amarela */}
              {mostrarCamposTecnicos && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-4">
                  <p className="text-sm font-bold text-blue-800">Dados Tecnicos (Linha Amarela)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">Ano</label>
                      <input type="number" value={ano} onChange={(e) => setAno(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-card text-foreground" placeholder="2020" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">Horimetro (h)</label>
                      <input type="number" value={horimetroAtual} onChange={(e) => setHorimetroAtual(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-card text-foreground" placeholder="5000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">Peso (ton)</label>
                      <input type="number" step="0.1" value={pesoOperacional} onChange={(e) => setPesoOperacional(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-card text-foreground" placeholder="4.5" />
                    </div>
                  </div>
                  {/* Checkbox Oferecer Operador */}
                  <label className="flex items-center gap-3 cursor-pointer bg-surface-card p-3 rounded-xl border border-blue-300 hover:bg-blue-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={ofereceOperador}
                      onChange={(e) => setOfereceOperador(e.target.checked)}
                      className="w-5 h-5 text-cta rounded focus:ring-cta"
                    />
                    <HardHat className="w-5 h-5 text-cta" />
                    <span className="text-sm font-semibold text-blue-800">Oferecer operador com esta maquina?</span>
                  </label>
                </div>
              )}
              {/* Campos para Equipamentos Leves (nao Linha Amarela) */}
              {categoria && !isLinhaAmarela(categoria) && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-4">
                  <p className="text-sm font-bold text-blue-800">Dados do Equipamento Leve</p>
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Voltagem *</label>
                    <select
                      value={voltagem}
                      onChange={(e) => setVoltagem(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-surface-card text-foreground"
                      required
                    >
                      <option value="">Selecione a voltagem</option>
                      {VOLTAGENS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  {equipamentoInicial && (
                    <ConsumiveisManager
                      consumiveis={consumiveis}
                      onAdd={async (nome, preco) => {
                        const result = await addConsumivel(equipamentoInicial.id, nome, preco)
                        if (result.success) {
                          const updated = await fetchConsumiveis(equipamentoInicial.id)
                          setConsumiveis(updated)
                        }
                      }}
                      onRemove={async (id) => {
                        const result = await removeConsumivel(id)
                        if (result.success) {
                          setConsumiveis(prev => prev.filter(c => c.id !== id))
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            /* Dynamic spec fields for non-construction verticals */
            categoria && (
              <DynamicSpecFields
                vertical={selectedVertical}
                categoria={categoria}
                specs={specs}
                onChange={setSpecs}
              />
            )
          )}
          {/* Localizacao */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-foreground-secondary mb-1">Cidade *</label>
              <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-cta outline-none bg-surface-card text-foreground" placeholder="Ex: Sao Paulo" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground-secondary mb-1">UF *</label>
              <select value={uf} onChange={(e) => setUf(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-cta outline-none bg-surface-card text-foreground" required>
                <option value="">UF</option>
                {ESTADOS_BR.map(estado => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </div>
          </div>
          {/* Descricao */}
          <div>
            <label className="block text-sm font-semibold text-foreground-secondary mb-1">Descricao</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-cta outline-none resize-none bg-surface-card text-foreground" rows={3} placeholder="Descreva o equipamento, estado de conservacao, etc." />
          </div>
          {/* Botao Submit */}
          <button type="submit" disabled={loading || uploadingFotos} className="w-full py-4 bg-cta text-white text-lg font-bold rounded-xl hover:bg-cta-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {(loading || uploadingFotos) && <Loader2 className="w-5 h-5 animate-spin" />}
            {equipamentoInicial ? 'Salvar Alteracoes' : 'Anunciar Equipamento'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ========== MODAL DE CONFIRMACAO DE RETORNO ==========
function ConfirmarRetornoModal({
  isOpen, onClose, onConfirmar, equipamento, clienteNome, loading
}: {
  isOpen: boolean; onClose: () => void
  onConfirmar: (horimetroDados?: { horimetro_chegada?: number; horimetro_chegada_foto?: string }) => void
  equipamento: Equipamento | null; clienteNome: string; loading: boolean
}) {
  const [horimetroChegada, setHorimetroChegada] = useState('')
  const [horimetroChegadaFoto, setHorimetroChegadaFoto] = useState<string | null>(null)

  if (!isOpen || !equipamento) return null

  const equipamentoIsLA = isLinhaAmarela(equipamento.categoria || '')

  const handleConfirmar = () => {
    if (equipamentoIsLA && horimetroChegada) {
      onConfirmar({
        horimetro_chegada: parseFloat(horimetroChegada),
        horimetro_chegada_foto: horimetroChegadaFoto || undefined
      })
    } else {
      onConfirmar()
    }
    setHorimetroChegada('')
    setHorimetroChegadaFoto(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Confirmar Devolucao</h2>
          <p className="text-foreground-secondary">
            Confirma que o equipamento <strong>{equipamento.nome}</strong> foi devolvido pelo cliente <strong>{clienteNome}</strong>?
          </p>
        </div>
        {/* Horimetro de chegada para Linha Amarela */}
        {equipamentoIsLA && (
          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
            <HorimetroInput
              value={horimetroChegada}
              foto={horimetroChegadaFoto}
              onChange={setHorimetroChegada}
              onFotoChange={setHorimetroChegadaFoto}
              label="Horimetro de Chegada"
            />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => { onClose(); setHorimetroChegada(''); setHorimetroChegadaFoto(null) }} disabled={loading} className="flex-1 py-3 bg-surface-elevated text-foreground-secondary font-semibold rounded-xl hover:bg-surface-inset">Cancelar</button>
          <button onClick={handleConfirmar} disabled={loading} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== COMPONENTE PRINCIPAL - DASHBOARD DO LOCADOR ==========
export default function MeusEquipamentos({ embedded = false, abrirNovo = false, onNovoFechado }: { embedded?: boolean; abrirNovo?: boolean; onNovoFechado?: () => void }) {
  const { user, profile, signOut } = useAuth()
  const {
    fetchMeusEquipamentos,
    addEquipamento,
    atualizarEquipamento,
    deletarEquipamento,
    uploadImagens,
    fetchEntregasPendentes,
    confirmarRetorno,
    despacharEquipamento,
    fetchMeusChats,
    mensagensNaoLidas,
    fetchMensagensNaoLidas,
    setupMensagensRealtime
  } = useApp()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // State local para equipamentos do locador
  const [meusEquipamentos, setMeusEquipamentos] = useState<Equipamento[]>([])
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(true)
  const [meusChats, setMeusChats] = useState<Chat[]>([])
  const [loadingChats, setLoadingChats] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [equipamentoEditando, setEquipamentoEditando] = useState<Equipamento | null>(null)
  const [confirmandoRetorno, setConfirmandoRetorno] = useState(false)
  const [equipamentoParaRetorno, setEquipamentoParaRetorno] = useState<EquipamentoEmUso | null>(null)
  const [equipamentoParaCalendario, setEquipamentoParaCalendario] = useState<Equipamento | null>(null)
  const [equipamentosEmUso, setEquipamentosEmUso] = useState<EquipamentoEmUso[]>([])
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('todos')
  const [despachando, setDespachando] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const nomeUsuario = profile?.nome_empresa || profile?.full_name || 'Locador'

  // Carrega dados iniciais
  useEffect(() => {
    mountedRef.current = true
    const carregar = async () => {
      if (!user?.id) return
      setLoadingEquipamentos(true)
      setLoadingChats(true)
      const [eqs, chats] = await Promise.all([
        fetchMeusEquipamentos(user.id),
        fetchMeusChats(user.id)
      ])
      if (mountedRef.current) {
        setMeusEquipamentos(eqs)
        setLoadingEquipamentos(false)
        setMeusChats(chats)
        setLoadingChats(false)
      }
      fetchMensagensNaoLidas(user.id)
      setupMensagensRealtime(user.id)
    }
    carregar()
    return () => { mountedRef.current = false }
  }, [user?.id])

  // Abre modal se veio do cadastro
  useEffect(() => {
    if (searchParams.get('novo') === '1') setModalOpen(true)
  }, [searchParams])

  // Abre modal quando prop abrirNovo muda (usado pelo OwnerDashboard)
  useEffect(() => {
    if (abrirNovo) {
      setEquipamentoEditando(null)
      setModalOpen(true)
    }
  }, [abrirNovo])

  // Identifica equipamentos em uso (OCUPADO ou EM_TRANSITO)
  useEffect(() => {
    const identificarEquipamentosEmUso = async () => {
      if (!user || !mountedRef.current) return
      const emUso = meusEquipamentos.filter(eq => {
        const s = eq.status?.toUpperCase()
        return s === 'OCUPADO' || s === 'EM_TRANSITO' || s === 'RESERVADO'
      })
      if (emUso.length === 0) { setEquipamentosEmUso([]); return }

      const { data: chats } = await supabase
        .from('chats')
        .select('id, equipamento_id, locatario_id, proposta_id')
        .eq('locador_id', user.id)
        .in('equipamento_id', emUso.map(eq => eq.id))

      if (!chats || chats.length === 0) {
        setEquipamentosEmUso(emUso.map(eq => ({ equipamento: eq, proposta_id: '', cliente_nome: 'Cliente' })))
        return
      }

      const equipamentoIds = emUso.map(eq => eq.id)
      const { data: propostas } = await supabase
        .from('propostas')
        .select('id, equipamento_id, created_at, status_entrega, data_inicio, data_fim')
        .in('equipamento_id', equipamentoIds)
        .in('status', ['aceita', 'pendente'])

      const clienteIds = [...new Set(chats.map(c => c.locatario_id))]
      const { data: clientes } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa, razao_social, email')
        .in('id', clienteIds)

      const clientesMap = new Map((clientes || []).map(c => [
        c.id, c.nome_empresa || c.razao_social || c.full_name || c.email || 'Cliente'
      ]))

      const lista: EquipamentoEmUso[] = emUso.map(eq => {
        const chat = chats.find(c => c.equipamento_id === eq.id)
        const proposta = propostas?.find(p => p.equipamento_id === eq.id)
        return {
          equipamento: eq,
          proposta_id: proposta?.id || chat?.proposta_id || '',
          cliente_nome: chat ? (clientesMap.get(chat.locatario_id) || 'Cliente') : 'Cliente',
          data_entrega: proposta?.created_at,
          data_inicio: (proposta as any)?.data_inicio,
          data_fim: (proposta as any)?.data_fim
        }
      })
      if (mountedRef.current) setEquipamentosEmUso(lista)
    }
    identificarEquipamentosEmUso()
  }, [meusEquipamentos, user])

  // Reload helper
  const reloadData = async () => {
    if (!user?.id) return
    const [eqs, chats] = await Promise.all([
      fetchMeusEquipamentos(user.id),
      fetchMeusChats(user.id)
    ])
    if (mountedRef.current) {
      setMeusEquipamentos(eqs)
      setMeusChats(chats)
    }
  }

  // Handlers
  const handleAddEquipamento = async (dados: NovoEquipamento) => {
    if (!user) return
    setSubmitting(true)
    if (equipamentoEditando) {
      await atualizarEquipamento(equipamentoEditando.id, dados, user.id)
    } else {
      await addEquipamento(dados, user.id)
    }
    setSubmitting(false)
    setModalOpen(false)
    setEquipamentoEditando(null)
    reloadData()
  }

  const handleEditar = (equipamento: Equipamento) => {
    setEquipamentoEditando(equipamento)
    setModalOpen(true)
    setMenuAbertoId(null)
  }

  const handleExcluir = async (equipamentoId: string) => {
    if (!user || !confirm('Tem certeza que deseja excluir este equipamento?')) return
    await deletarEquipamento(equipamentoId, user.id)
    reloadData()
    setMenuAbertoId(null)
  }

  const handleConfirmarRetorno = async (horimetroDados?: { horimetro_chegada?: number; horimetro_chegada_foto?: string }) => {
    if (!equipamentoParaRetorno || !user) return
    setConfirmandoRetorno(true)
    const result = await confirmarRetorno(equipamentoParaRetorno.proposta_id, equipamentoParaRetorno.equipamento.id, horimetroDados)
    setConfirmandoRetorno(false)
    if (result.success) {
      setEquipamentoParaRetorno(null)
      reloadData()
    }
  }

  const handleDespachar = async (propostaId: string, equipamentoId: string) => {
    setDespachando(equipamentoId)
    const result = await despacharEquipamento(propostaId, equipamentoId)
    setDespachando(null)
    if (result.success) reloadData()
  }

  const handleNovaLocacao = async (equipamento: Equipamento) => {
    if (!user) return
    setMenuAbertoId(null)
    const { data: chats } = await supabase
      .from('chats')
      .select('id')
      .eq('equipamento_id', equipamento.id)
      .eq('locador_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (chats && chats.length > 0) {
      navigate(`/chats/${chats[0].id}`)
    } else {
      alert('Nenhuma conversa anterior encontrada para este equipamento.')
    }
  }

  // ========== DADOS FILTRADOS POR ABA ==========
  const chatsNegociacao = useMemo(() => {
    if (!user) return []
    return meusChats.filter(chat => {
      if (chat.locador_id !== user.id) return false
      if (!chat.proposta) return true // sem proposta = em negociacao
      return chat.proposta.status === 'pendente'
    })
  }, [meusChats, user])

  const equipamentosAEnviar = useMemo(() => {
    return meusEquipamentos.filter(eq => eq.status?.toUpperCase() === 'RESERVADO')
  }, [meusEquipamentos])

  const equipamentosEmLocacao = useMemo(() => {
    return meusEquipamentos.filter(eq => {
      const s = eq.status?.toUpperCase()
      return s === 'EM_TRANSITO' || s === 'OCUPADO'
    })
  }, [meusEquipamentos])

  const equipamentosDevolucao = useMemo(() => {
    return equipamentosEmUso.filter(eu => {
      const s = eu.equipamento.status?.toUpperCase()
      return s === 'OCUPADO' || s === 'EM_TRANSITO'
    })
  }, [equipamentosEmUso])

  // KPIs calculados com dados reais
  const kpis = useMemo(() => {
    const total = meusEquipamentos.length
    const alugados = meusEquipamentos.filter(eq => {
      const s = eq.status?.toUpperCase()
      return s === 'OCUPADO' || s === 'RESERVADO' || s === 'EM_TRANSITO'
    }).length
    const taxaOcupacao = total > 0 ? Math.round((alugados / total) * 100) : 0
    // Faturamento estimado das propostas em uso
    const faturamento = equipamentosEmUso.reduce((sum, eu) => sum + (eu.equipamento.preco_diaria || 0) * 30, 0)
    const devolucoesPendentes = equipamentosDevolucao.length
    return { total, alugados, taxaOcupacao, faturamento, devolucoesPendentes }
  }, [meusEquipamentos, equipamentosEmUso, equipamentosDevolucao])

  // Filtro de busca
  const equipamentosFiltrados = useMemo(() => {
    let filtered = meusEquipamentos
    if (searchTerm) {
      const termo = searchTerm.toLowerCase()
      filtered = filtered.filter(eq => eq.nome.toLowerCase().includes(termo) || eq.categoria?.toLowerCase().includes(termo))
    }
    return filtered
  }, [meusEquipamentos, searchTerm])

  // Helper para URL da imagem
  const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null
    if (path.startsWith('http') || path.startsWith('data:')) return path
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
  }

  // Status badge
  const getStatusBadge = (status: string | null) => {
    const s = status?.toUpperCase()
    switch (s) {
      case 'RESERVADO':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">RESERVADO</span>
      case 'EM_TRANSITO':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">EM LOCACAO</span>
      case 'OCUPADO':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">EM USO</span>
      case 'MANUTENCAO':
        return <span className="px-3 py-1 bg-blue-100 text-cta-hover text-xs font-semibold rounded-full">MANUTENCAO</span>
      default:
        return <span className="px-3 py-1 bg-surface-elevated text-foreground-secondary text-xs font-semibold rounded-full">DISPONIVEL</span>
    }
  }

  // Tabs config
  const tabs = [
    { key: 'todos' as TabType, label: 'Todos', count: meusEquipamentos.length, icon: Package },
    { key: 'negociacao' as TabType, label: 'Negociação', count: chatsNegociacao.length, icon: MessageCircle },
    { key: 'a_enviar' as TabType, label: 'A Enviar', count: equipamentosAEnviar.length, icon: Send },
    { key: 'em_locacao' as TabType, label: 'Em Locação', count: equipamentosEmLocacao.length, icon: TruckIcon },
    { key: 'devolucoes' as TabType, label: 'Devoluções', count: equipamentosDevolucao.length, icon: RotateCcw },
  ]

  return (
    <div className={embedded ? 'bg-surface' : 'min-h-screen bg-surface'}>
      {/* ========== HEADER (hidden when embedded in OwnerDashboard) ========== */}
      {!embedded && (
      <header className="bg-surface-card border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-cta rounded-lg flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Loca<span className="text-cta">Obra</span></span>
            </Link>
            <div className="flex items-center gap-4">
              <button onClick={() => { setEquipamentoEditando(null); setModalOpen(true) }} className="flex items-center gap-2 px-4 py-2 bg-cta text-white font-semibold rounded-lg hover:bg-cta-hover transition-colors">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo Equipamento</span>
              </button>
              <Link to="/chats" className="relative p-2 text-foreground-secondary hover:bg-surface-inset rounded-lg">
                <MessageCircle className="w-6 h-6" />
                {mensagensNaoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {mensagensNaoLidas > 9 ? '9+' : mensagensNaoLidas}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-foreground">{nomeUsuario}</p>
                  <p className="text-xs text-cta font-medium">LOCADOR</p>
                </div>
                <div className="w-10 h-10 bg-surface-inset rounded-full flex items-center justify-center">
                  <span className="text-foreground-secondary font-semibold text-sm">{nomeUsuario.charAt(0).toUpperCase()}</span>
                </div>
                <button onClick={signOut} className="text-sm text-foreground-secondary hover:text-foreground font-medium">Sair</button>
              </div>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <main className={embedded ? 'py-2' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {/* Titulo */}
        {!embedded && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Painel do Locador</h1>
          <p className="text-foreground-secondary mt-1">Gerencie sua frota e acompanhe seus ganhos.</p>
        </div>
        )}

        {/* ========== KPIs (hidden when embedded) ========== */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 ${embedded ? 'hidden' : ''}`}>
          <div className="bg-surface-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Faturamento Estimado</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  R$ {kpis.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-foreground-secondary mt-2">{kpis.alugados} equipamentos ativos</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-surface-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Taxa de Ocupacao</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.alugados} / {kpis.total}</p>
                <p className="text-sm text-foreground-secondary mt-2">{kpis.taxaOcupacao}% ocupacao</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-surface-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Devolucoes Pendentes</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.devolucoesPendentes}</p>
                {equipamentosDevolucao[0] && (
                  <p className="text-sm text-cta mt-2">
                    Prox: {equipamentosDevolucao[0].equipamento.nome.substring(0, 20)}...
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-cta" />
              </div>
            </div>
          </div>
        </div>

        {/* ========== TABS + TABELA ========== */}
        <div className="bg-surface-card rounded-xl border border-border overflow-hidden">
          {/* Tab Bar */}
          <div className="border-b border-border px-4 overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-cta text-cta'
                      : 'border-transparent text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.key ? 'bg-blue-100 text-cta-hover' : 'bg-surface-elevated text-foreground-secondary'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          {activeTab === 'todos' && (
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar equipamento..." className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta w-full bg-surface-card text-foreground"
                />
              </div>
            </div>
          )}

          {/* ========== TAB CONTENT ========== */}

          {/* Loading */}
          {(loadingEquipamentos || loadingChats) ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-cta" />
            </div>
          ) : (
            <>
              {/* ===== TAB: TODOS ===== */}
              {activeTab === 'todos' && (
                equipamentosFiltrados.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground-secondary mb-2">Nenhum equipamento cadastrado</h3>
                    <p className="text-foreground-muted mb-4">Comece adicionando seu primeiro equipamento</p>
                    <button onClick={() => setModalOpen(true)} className="px-6 py-3 bg-cta text-white font-semibold rounded-lg hover:bg-cta-hover">
                      <Plus className="w-5 h-5 inline mr-2" />Adicionar Equipamento
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-elevated">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Equipamento</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Diaria</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Cliente</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {equipamentosFiltrados.map((equipamento) => {
                          const emUso = equipamentosEmUso.find(eu => eu.equipamento.id === equipamento.id)
                          const fotoUrl = getImageUrl(equipamento.fotos?.[0])
                          const isDisponivel = !equipamento.status || equipamento.status.toUpperCase() === 'DISPONIVEL'

                          return (
                            <tr key={equipamento.id} className="hover:bg-surface-elevated transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-surface-inset overflow-hidden flex-shrink-0">
                                    {fotoUrl ? (
                                      <img src={fotoUrl} alt={equipamento.nome} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-foreground-muted" /></div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{equipamento.nome}</p>
                                    <p className="text-sm text-foreground-secondary">{equipamento.categoria}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">{getStatusBadge(equipamento.status)}</td>
                              <td className="px-6 py-4">
                                <span className="font-semibold text-foreground">R$ {equipamento.preco_diaria?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </td>
                              <td className="px-6 py-4">
                                {emUso ? (
                                  <div>
                                    <p className="text-sm text-foreground font-medium">{emUso.cliente_nome}</p>
                                    {emUso.data_fim && <p className="text-xs text-foreground-secondary">Ate {new Date(emUso.data_fim).toLocaleDateString('pt-BR')}</p>}
                                  </div>
                                ) : (
                                  <span className="text-foreground-muted">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="relative inline-block">
                                  <button onClick={() => setMenuAbertoId(menuAbertoId === equipamento.id ? null : equipamento.id)} className="p-2 hover:bg-surface-inset rounded-lg">
                                    <MoreVertical className="w-5 h-5 text-foreground-secondary" />
                                  </button>
                                  {menuAbertoId === equipamento.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-surface-card border border-border rounded-lg shadow-lg py-1 w-48 z-10">
                                      <button onClick={() => handleEditar(equipamento)} className="w-full px-4 py-2 text-left text-sm text-foreground-secondary hover:bg-surface-elevated flex items-center gap-2">
                                        <Pencil className="w-4 h-4" />Editar
                                      </button>
                                      <button onClick={() => { setEquipamentoParaCalendario(equipamento); setMenuAbertoId(null) }} className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />Calendario
                                      </button>
                                      {isDisponivel && (
                                        <button onClick={() => handleNovaLocacao(equipamento)} className="w-full px-4 py-2 text-left text-sm text-cta hover:bg-blue-50 flex items-center gap-2">
                                          <ArrowRightLeft className="w-4 h-4" />Nova Locacao
                                        </button>
                                      )}
                                      {emUso && (equipamento.status?.toUpperCase() === 'OCUPADO' || equipamento.status?.toUpperCase() === 'EM_TRANSITO') && (
                                        <button onClick={() => { setEquipamentoParaRetorno(emUso); setMenuAbertoId(null) }} className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                                          <RotateCcw className="w-4 h-4" />Confirmar Devolucao
                                        </button>
                                      )}
                                      {emUso && equipamento.status?.toUpperCase() === 'RESERVADO' && (
                                        <button onClick={() => { handleDespachar(emUso.proposta_id, equipamento.id); setMenuAbertoId(null) }} className="w-full px-4 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2">
                                          <Send className="w-4 h-4" />Despachar
                                        </button>
                                      )}
                                      <button onClick={() => handleExcluir(equipamento.id)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <Trash2 className="w-4 h-4" />Excluir
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ===== TAB: NEGOCIACAO ===== */}
              {activeTab === 'negociacao' && (
                chatsNegociacao.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageCircle className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground-secondary mb-2">Nenhuma negociacao pendente</h3>
                    <p className="text-foreground-muted">Quando clientes solicitarem cotacao, aparecera aqui.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {chatsNegociacao.map(chat => (
                      <Link
                        key={chat.id}
                        to={`/chats/${chat.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-surface-elevated transition-colors"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-6 h-6 text-cta" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground truncate">{chat.locatario_nome || 'Cliente'}</p>
                            <span className="text-xs text-foreground-muted">
                              {new Date(chat.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-cta font-medium truncate">
                            {chat.equipamento?.nome || 'Equipamento'}
                          </p>
                          {chat.ultima_mensagem && (
                            <p className="text-sm text-foreground-secondary truncate mt-0.5">{chat.ultima_mensagem}</p>
                          )}
                        </div>
                        <div>
                          {chat.proposta?.status === 'pendente' ? (
                            <span className="px-3 py-1 bg-blue-100 text-cta-hover text-xs font-semibold rounded-full">Proposta Pendente</span>
                          ) : (
                            <span className="px-3 py-1 bg-surface-elevated text-foreground-secondary text-xs font-semibold rounded-full">Aguardando Proposta</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              )}

              {/* ===== TAB: A ENVIAR ===== */}
              {activeTab === 'a_enviar' && (
                equipamentosAEnviar.length === 0 ? (
                  <div className="text-center py-16">
                    <Send className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground-secondary mb-2">Nenhum equipamento para enviar</h3>
                    <p className="text-foreground-muted">Equipamentos com proposta aceita aparecerao aqui.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {equipamentosAEnviar.map(eq => {
                      const emUso = equipamentosEmUso.find(eu => eu.equipamento.id === eq.id)
                      const fotoUrl = getImageUrl(eq.fotos?.[0])
                      return (
                        <div key={eq.id} className="flex items-center gap-4 px-6 py-4">
                          <div className="w-14 h-14 rounded-lg bg-surface-inset overflow-hidden flex-shrink-0">
                            {fotoUrl ? (
                              <img src={fotoUrl} alt={eq.nome} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-foreground-muted" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{eq.nome}</p>
                            <p className="text-sm text-foreground-secondary">{emUso?.cliente_nome || eq.locado_para || 'Cliente'}</p>
                            {emUso?.data_inicio && (
                              <p className="text-xs text-foreground-muted mt-0.5">
                                Inicio: {new Date(emUso.data_inicio).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => emUso && handleDespachar(emUso.proposta_id, eq.id)}
                            disabled={despachando === eq.id}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                          >
                            {despachando === eq.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Despachar
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              )}

              {/* ===== TAB: EM LOCACAO ===== */}
              {activeTab === 'em_locacao' && (
                equipamentosEmLocacao.length === 0 ? (
                  <div className="text-center py-16">
                    <TruckIcon className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground-secondary mb-2">Nenhum equipamento em locacao</h3>
                    <p className="text-foreground-muted">Equipamentos em transito ou em uso aparecerao aqui.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {equipamentosEmLocacao.map(eq => {
                      const emUso = equipamentosEmUso.find(eu => eu.equipamento.id === eq.id)
                      const fotoUrl = getImageUrl(eq.fotos?.[0])
                      return (
                        <div key={eq.id} className="flex items-center gap-4 px-6 py-4">
                          <div className="w-14 h-14 rounded-lg bg-surface-inset overflow-hidden flex-shrink-0">
                            {fotoUrl ? (
                              <img src={fotoUrl} alt={eq.nome} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-foreground-muted" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{eq.nome}</p>
                            <p className="text-sm text-foreground-secondary">{emUso?.cliente_nome || eq.locado_para || 'Cliente'}</p>
                            {emUso?.data_fim && (
                              <p className="text-xs text-foreground-muted mt-0.5">
                                Retorno previsto: {new Date(emUso.data_fim).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-foreground">R$ {eq.preco_diaria?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia</p>
                            {emUso && (
                              <button
                                onClick={() => setEquipamentoParaRetorno(emUso)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Devolucao
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}

              {/* ===== TAB: DEVOLUCOES ===== */}
              {activeTab === 'devolucoes' && (
                equipamentosDevolucao.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckCircle2 className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground-secondary mb-2">Nenhuma devolucao pendente</h3>
                    <p className="text-foreground-muted">Equipamentos aguardando devolucao aparecerao aqui.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {equipamentosDevolucao.map(eu => {
                      const fotoUrl = getImageUrl(eu.equipamento.fotos?.[0])
                      return (
                        <div key={eu.equipamento.id} className="flex items-center gap-4 px-6 py-4">
                          <div className="w-14 h-14 rounded-lg bg-surface-inset overflow-hidden flex-shrink-0">
                            {fotoUrl ? (
                              <img src={fotoUrl} alt={eu.equipamento.nome} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-foreground-muted" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{eu.equipamento.nome}</p>
                            <p className="text-sm text-foreground-secondary">{eu.cliente_nome}</p>
                            {eu.data_fim && (
                              <p className="text-xs text-cta font-medium mt-0.5">
                                Prazo: {new Date(eu.data_fim).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setEquipamentoParaRetorno(eu)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Confirmar Devolucao
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>

      {/* ========== MODAIS ========== */}
      <NovoEquipamentoModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEquipamentoEditando(null); onNovoFechado?.() }}
        onSubmit={handleAddEquipamento}
        onUploadImagens={(files) => uploadImagens(files, user?.id || '')}
        loading={submitting}
        equipamentoInicial={equipamentoEditando}
      />
      <ConfirmarRetornoModal
        isOpen={!!equipamentoParaRetorno}
        onClose={() => setEquipamentoParaRetorno(null)}
        onConfirmar={handleConfirmarRetorno}
        equipamento={equipamentoParaRetorno?.equipamento || null}
        clienteNome={equipamentoParaRetorno?.cliente_nome || ''}
        loading={confirmandoRetorno}
      />
      <CalendarioDisponibilidade
        isOpen={!!equipamentoParaCalendario}
        onClose={() => setEquipamentoParaCalendario(null)}
        equipamento={equipamentoParaCalendario}
      />
      {menuAbertoId && <div className="fixed inset-0 z-0" onClick={() => setMenuAbertoId(null)} />}
    </div>
  )
}
