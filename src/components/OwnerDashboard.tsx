import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  useApp, type Equipamento, type Chat, type Proposta, type EntregaPendente,
  type NovoEquipamento, type Consumivel, type InspectionPhotoPosition,
  isLinhaAmarela, ESTADOS_BR, VOLTAGENS
} from '../contexts/AppContext'
import { VERTICAL_CONFIGS, VERTICALS, type VerticalKey, getVerticalConfig } from '../config/verticals'
import { supabase } from '../lib/supabase'
import { getStorageUrl } from '../lib/storage'
import {
  LayoutDashboard, Package, MessageSquare, Wallet,
  Plus, Search, Truck, Calendar, TrendingUp, ChevronRight, ChevronLeft,
  ArrowUpRight, ArrowDownLeft,
  Loader2, LogOut, Bell, Send, Pencil, Trash2, RotateCcw,
  MoreVertical, BarChart3, CreditCard, CheckCircle2,
  ImagePlus, HardHat, X, Wrench, Zap, Sun, Moon, Store
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import Sparkline from './Sparkline'
import TraktoLogo from './TraktoLogo'
import { HorimetroInput } from './chat/HorimetroInput'
import { ConsumiveisManager } from './ConsumiveisManager'
import { ContractGenerator } from './ContractGenerator'
import { FinancialWallet } from './FinancialWallet'
import { FileText } from 'lucide-react'
import InspectionWizard from './chat/InspectionWizard'

type TabKey = 'overview' | 'chat' | 'fleet' | 'finance' | 'wallet' | 'contracts' | 'calendar' | 'store'

// ========== LOVABLE/G4 THEME MAP ==========
const THEME_MAP: Record<string, {
  text: string; bg: string; bgLight: string; border: string; glow: string; stroke: string; gradient: string
}> = {
  amber:   { text: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-600',   bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',   border: 'border-indigo-200 dark:border-indigo-800',   glow: 'shadow-indigo-500/20',   stroke: '#4f46e5', gradient: 'from-indigo-600 to-purple-600' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', bgLight: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', glow: 'shadow-emerald-500/20', stroke: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
  blue:    { text: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-500',    bgLight: 'bg-blue-50 dark:bg-blue-950/30',       border: 'border-blue-200 dark:border-blue-800',       glow: 'shadow-blue-500/20',    stroke: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
  rose:    { text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-500',    bgLight: 'bg-rose-50 dark:bg-rose-950/30',       border: 'border-rose-200 dark:border-rose-800',       glow: 'shadow-rose-500/20',    stroke: '#f43f5e', gradient: 'from-rose-500 to-pink-600' },
  lime:    { text: 'text-lime-600 dark:text-lime-400',       bg: 'bg-lime-500',    bgLight: 'bg-lime-50 dark:bg-lime-950/30',       border: 'border-lime-200 dark:border-lime-800',       glow: 'shadow-lime-500/20',    stroke: '#84cc16', gradient: 'from-lime-500 to-green-600' },
}

// ========== LOVABLE STATUS BADGE ==========
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() || 'DISPONIVEL'
  const styles: Record<string, string> = {
    DISPONIVEL:  'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    RESERVADO:   'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
    EM_TRANSITO: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    OCUPADO:     'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  }
  const labels: Record<string, string> = {
    DISPONIVEL:  'Disponível',
    RESERVADO:   'Reservado',
    EM_TRANSITO: 'Em Trânsito',
    OCUPADO:     'Em Uso',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${styles[s] || styles.DISPONIVEL}`}>
      {labels[s] || status}
    </span>
  )
}

// ========== TAB CONFIG ==========
const TAB_TITLES: Record<TabKey, string> = {
  overview: 'Visão Geral',
  chat: 'Negociações',
  fleet: 'Frota',
  finance: 'Financeiro',
  wallet: 'Carteira',
  contracts: 'Contratos',
  calendar: 'Calendário',
  store: 'Minha Loja',
}

// ========== CONFIRMAR EXCLUSÃO MODAL (Lovable) ==========
function ConfirmarExclusaoModal({
  isOpen, onClose, onConfirmar, equipamentoNome, loading
}: {
  isOpen: boolean; onClose: () => void; onConfirmar: () => void
  equipamentoNome: string; loading: boolean
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl shadow-indigo-500/10 w-full max-w-md p-6 border border-gray-100 dark:border-neutral-800">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800">
            <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Equipamento</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Tem certeza que deseja excluir <strong className="text-slate-900 dark:text-white">{equipamentoNome}</strong>?
          </p>
          <p className="text-red-600 dark:text-red-400 text-xs mt-2">Esta ação é irreversível.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3.5 bg-gray-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors border border-gray-200 dark:border-neutral-700">
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={loading} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== CONFIRMAR DESPACHO MODAL (Lovable) ==========
function ConfirmarDespachoModal({
  isOpen, onClose, onConfirmar, equipamentoNome, clienteNome, loading
}: {
  isOpen: boolean; onClose: () => void; onConfirmar: () => void
  equipamentoNome: string; clienteNome: string; loading: boolean
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl shadow-indigo-500/10 w-full max-w-md p-6 border border-gray-100 dark:border-neutral-800">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-200 dark:border-indigo-800">
            <Send className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Despachar Equipamento</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Confirma o envio de <strong className="text-slate-900 dark:text-white">{equipamentoNome}</strong> para <strong className="text-slate-900 dark:text-white">{clienteNome}</strong>?
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3.5 bg-gray-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors border border-gray-200 dark:border-neutral-700">
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={loading} className="flex-1 py-3.5 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Despachar
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== CONFIRMAR RETORNO MODAL (Lovable) ==========
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
      onConfirmar({ horimetro_chegada: parseFloat(horimetroChegada), horimetro_chegada_foto: horimetroChegadaFoto || undefined })
    } else {
      onConfirmar()
    }
    setHorimetroChegada('')
    setHorimetroChegadaFoto(null)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl shadow-indigo-500/10 w-full max-w-md p-6 border border-gray-100 dark:border-neutral-800">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
            <RotateCcw className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirmar Devolução</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Confirma que <strong className="text-slate-900 dark:text-white">{equipamento.nome}</strong> foi devolvido por <strong className="text-slate-900 dark:text-white">{clienteNome}</strong>?
          </p>
        </div>
        {equipamentoIsLA && (
          <div className="mb-6 bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <HorimetroInput
              value={horimetroChegada}
              foto={horimetroChegadaFoto}
              onChange={setHorimetroChegada}
              onFotoChange={setHorimetroChegadaFoto}
              label="Horímetro de Chegada"
            />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => { onClose(); setHorimetroChegada(''); setHorimetroChegadaFoto(null) }} disabled={loading} className="flex-1 py-3.5 bg-gray-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors border border-gray-200 dark:border-neutral-700">
            Cancelar
          </button>
          <button onClick={handleConfirmar} disabled={loading} className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== NOVO EQUIPAMENTO MODAL (Lovable) ==========
function NovoEquipamentoDarkModal({
  isOpen, onClose, onSubmit, onUploadImagens, loading, equipamentoInicial
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
  const [selectedVertical, setSelectedVertical] = useState<VerticalKey>('construcao')
  const [specs, setSpecs] = useState<Record<string, unknown>>({})
  const vcModal = getVerticalConfig(selectedVertical)

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
      setVoltagem((equipamentoInicial as unknown as Record<string, unknown>).voltagem as string || '')
      setOfereceOperador(equipamentoInicial.oferece_operador || false)
      setSelectedVertical((equipamentoInicial.vertical as VerticalKey) || 'construcao')
      setSpecs(equipamentoInicial.specs || {})
      if (equipamentoInicial.fotos?.length) setFotosPreview(equipamentoInicial.fotos)
      fetchConsumiveis(equipamentoInicial.id).then(setConsumiveis)
    } else if (isOpen) {
      resetForm()
    }
  }, [equipamentoInicial, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setNome(''); setDescricao(''); setPrecoDiaria(''); setCategoria('')
    setCidade(''); setUf(''); setAno(''); setHorimetroAtual('')
    setPesoOperacional(''); setVoltagem(''); setOfereceOperador(false); setConsumiveis([])
    setFotosPreview([]); setFotosFiles([]); setFotosError(null)
    setSelectedVertical('construcao'); setSpecs({})
  }

  const handleFotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Filtra arquivos já existentes (evita duplicação)
    const filesExistentes = new Set(fotosFiles.map(f => `${f.name}-${f.size}`))
    const novosArquivos = files.filter(f => !filesExistentes.has(`${f.name}-${f.size}`))
    if (novosArquivos.length === 0) return

    const novosFiles = [...fotosFiles, ...novosArquivos].slice(0, 5)
    setFotosFiles(novosFiles)

    // Usa Promise.all para ler todos os arquivos de uma vez (evita race conditions)
    const lerArquivo = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => resolve(ev.target?.result as string)
        reader.readAsDataURL(file)
      })
    }

    const novosPreviews = await Promise.all(novosFiles.map(lerArquivo))
    setFotosPreview(novosPreviews)
    setFotosError(null)

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
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
    const finalSpecs = selectedVertical === 'construcao'
      ? { ...specs, ano: ano ? parseInt(ano) : null, horimetro_atual: horimetroAtual ? parseFloat(horimetroAtual) : null, peso_operacional: pesoOperacional ? parseFloat(pesoOperacional) : null, voltagem: voltagem || null, oferece_operador: ofereceOperador }
      : specs
    await onSubmit({
      nome, descricao: descricao || undefined, preco_diaria: parseFloat(precoDiaria),
      categoria, cidade, uf, fotos: todasFotos.length > 0 ? todasFotos : undefined,
      ano: ano ? parseInt(ano) : undefined,
      horimetro_atual: horimetroAtual ? parseFloat(horimetroAtual) : undefined,
      peso_operacional: pesoOperacional ? parseFloat(pesoOperacional) : undefined,
      voltagem: voltagem || undefined,
      oferece_operador: ofereceOperador || undefined,
      vertical: selectedVertical,
      specs: finalSpecs,
    })
    resetForm()
  }

  if (!isOpen) return null
  const mostrarCamposTecnicos = categoria && isLinhaAmarela(categoria)
  const isConstrucao = selectedVertical === 'construcao'

  // Lovable inline DynamicSpecFields renderer
  const renderDarkSpecFields = () => {
    if (isConstrucao || !categoria) return null
    const visibleFields = vcModal.specFields.filter(f => !f.showCondition || f.showCondition(categoria))
    if (visibleFields.length === 0) return null
    const booleanFields = visibleFields.filter(f => f.type === 'boolean')
    const inputFields = visibleFields.filter(f => f.type !== 'boolean')
    return (
      <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados Específicos ({vcModal.label})</h3>
        <div className="grid grid-cols-2 gap-3">
          {inputFields.map(field => {
            const value = specs[field.key]
            if (field.type === 'select') {
              return (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{field.label} {field.required && '*'}</label>
                  <select value={(value as string) || ''} onChange={e => setSpecs({ ...specs, [field.key]: e.target.value || null })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" required={field.required}>
                    <option value="" className="bg-white dark:bg-neutral-900">Selecione...</option>
                    {field.options?.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-neutral-900">{opt}</option>)}
                  </select>
                </div>
              )
            }
            return (
              <div key={field.key}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{field.label} {field.unit && `(${field.unit})`} {field.required && '*'}</label>
                <input type={field.type === 'number' ? 'number' : 'text'} value={(value as string) ?? ''}
                  onChange={e => setSpecs({ ...specs, [field.key]: field.type === 'number' ? (e.target.value ? Number(e.target.value) : null) : (e.target.value || null) })}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
                  required={field.required} />
              </div>
            )
          })}
        </div>
        {booleanFields.length > 0 && (
          <div className="space-y-3 pt-2">
            {booleanFields.map(field => (
              <label key={field.key} className="flex items-center gap-3 cursor-pointer bg-white dark:bg-neutral-900 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                <input type="checkbox" checked={!!specs[field.key]}
                  onChange={e => setSpecs({ ...specs, [field.key]: e.target.checked })}
                  className="w-5 h-5 rounded accent-indigo-600" />
                <HardHat className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{field.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl shadow-indigo-500/10 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-neutral-800">
        {/* Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-[2rem]" />
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {equipamentoInicial ? 'Editar Equipamento' : 'Novo Equipamento'}
          </h2>
          <button onClick={() => { resetForm(); onClose() }} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Fotos */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Fotos do Equipamento</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl p-4 text-center cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFotosChange} className="hidden" />
              <ImagePlus className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Clique para adicionar fotos</p>
              <p className="text-xs text-slate-400 mt-1">Máximo 5 fotos</p>
            </div>
            {fotosPreview.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {fotosPreview.map((foto, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
                    <img src={foto} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removerFoto(i)} className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full backdrop-blur-sm">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fotosError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{fotosError}</p>}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Nome do Equipamento *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
              placeholder="Ex: Retroescavadeira CAT 416E" required />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Tipo *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {vcModal.categories.map(cat => {
                const isActive = categoria === cat
                // Pick icon per category name pattern
                const CatIcon = cat.toLowerCase().includes('máquina') || cat.toLowerCase().includes('pesad') ? Truck
                  : cat.toLowerCase().includes('ferramenta') || cat.toLowerCase().includes('implement') ? Wrench
                  : cat.toLowerCase().includes('equip') || cat.toLowerCase().includes('comput') || cat.toLowerCase().includes('diagnóstico') || cat.toLowerCase().includes('suporte') || cat.toLowerCase().includes('mobiliário') ? Package
                  : cat.toLowerCase().includes('som') || cat.toLowerCase().includes('audio') ? Zap
                  : cat.toLowerCase().includes('estrut') ? HardHat
                  : cat.toLowerCase().includes('irrigação') || cat.toLowerCase().includes('rede') ? Search
                  : Package
                return (
                  <button key={cat} type="button" onClick={() => setCategoria(cat)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-[11px] font-bold leading-tight text-center ${
                      isActive
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-100 dark:border-neutral-700 text-slate-400 hover:border-gray-200 dark:hover:border-neutral-600 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}>
                    <CatIcon size={20} />
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Diária */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Valor da Diária (R$) *</label>
            <input type="number" step="0.01" min="0" value={precoDiaria} onChange={e => setPrecoDiaria(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
              placeholder="350.00" required />
          </div>

          {/* Campos Técnicos - Construção */}
          {isConstrucao ? (
            <>
              {mostrarCamposTecnicos && (
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-4">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Dados Técnicos (Linha Amarela)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ano</label>
                      <input type="number" value={ano} onChange={e => setAno(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400" placeholder="2020" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Horímetro (h)</label>
                      <input type="number" value={horimetroAtual} onChange={e => setHorimetroAtual(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400" placeholder="5000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Peso (ton)</label>
                      <input type="number" step="0.1" value={pesoOperacional} onChange={e => setPesoOperacional(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400" placeholder="4.5" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-neutral-900 p-3 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
                    <input type="checkbox" checked={ofereceOperador} onChange={e => setOfereceOperador(e.target.checked)} className="w-5 h-5 rounded accent-indigo-600" />
                    <HardHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Oferecer operador com esta máquina?</span>
                  </label>
                </div>
              )}
              {categoria && !isLinhaAmarela(categoria) && (
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-4">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Dados do Equipamento Leve</p>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Voltagem *</label>
                    <select value={voltagem} onChange={e => setVoltagem(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" required>
                      <option value="" className="bg-white dark:bg-neutral-900">Selecione a voltagem</option>
                      {VOLTAGENS.map(v => <option key={v} value={v} className="bg-white dark:bg-neutral-900">{v}</option>)}
                    </select>
                  </div>
                  {equipamentoInicial && (
                    <ConsumiveisManager
                      consumiveis={consumiveis}
                      onAdd={async (nomeC, preco) => {
                        const result = await addConsumivel(equipamentoInicial.id, nomeC, preco)
                        if (result.success) {
                          const updated = await fetchConsumiveis(equipamentoInicial.id)
                          setConsumiveis(updated)
                        }
                      }}
                      onRemove={async (id) => {
                        const result = await removeConsumivel(id)
                        if (result.success) setConsumiveis(prev => prev.filter(c => c.id !== id))
                      }}
                    />
                  )}
                </div>
              )}
            </>
          ) : renderDarkSpecFields()}

          {/* Localização */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Cidade *</label>
              <input type="text" value={cidade} onChange={e => setCidade(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
                placeholder="São Paulo" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">UF *</label>
              <select value={uf} onChange={e => setUf(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" required>
                <option value="" className="bg-white dark:bg-neutral-900">UF</option>
                {ESTADOS_BR.map(estado => <option key={estado} value={estado} className="bg-white dark:bg-neutral-900">{estado}</option>)}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none placeholder:text-slate-400"
              rows={3} placeholder="Descreva o equipamento, estado de conservação, etc." />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || uploadingFotos}
            className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white text-lg font-bold rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20">
            {(loading || uploadingFotos) && <Loader2 className="w-5 h-5 animate-spin" />}
            {equipamentoInicial ? 'Salvar Alterações' : 'Anunciar Equipamento'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ========== EQUIPAMENTO EM USO ==========
interface EquipamentoEmUso {
  equipamento: Equipamento
  proposta_id: string
  cliente_nome: string
  data_entrega?: string
  data_inicio?: string
  data_fim?: string
}

// ========== CALENDÁRIO UNIFICADO ==========
interface CalendarioProps {
  equipamentos: Equipamento[]
  propostas: Array<{
    id: string
    equipamento_id: string
    status: string
    data_inicio?: string | null
    data_fim?: string | null
    valor_total?: number | null
    locatario_nome?: string | null
  }>
  onEquipamentoClick?: (id: string) => void
}

// Cores distintas para diferenciar equipamentos
const EQUIPMENT_COLORS = [
  { bg: 'bg-emerald-500', dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500' },
  { bg: 'bg-blue-500', dot: 'bg-blue-400', text: 'text-blue-400', border: 'border-blue-500' },
  { bg: 'bg-purple-500', dot: 'bg-purple-400', text: 'text-purple-400', border: 'border-purple-500' },
  { bg: 'bg-amber-500', dot: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-500' },
  { bg: 'bg-rose-500', dot: 'bg-rose-400', text: 'text-rose-400', border: 'border-rose-500' },
  { bg: 'bg-cyan-500', dot: 'bg-cyan-400', text: 'text-cyan-400', border: 'border-cyan-500' },
  { bg: 'bg-indigo-500', dot: 'bg-indigo-400', text: 'text-indigo-400', border: 'border-indigo-500' },
  { bg: 'bg-teal-500', dot: 'bg-teal-400', text: 'text-teal-400', border: 'border-teal-500' },
]

function CalendarioUnificado({ equipamentos, propostas, onEquipamentoClick }: CalendarioProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Mapa de cores por equipamento (baseado no ID para consistência)
  const equipmentColorMap = useMemo(() => {
    const map = new Map<string, typeof EQUIPMENT_COLORS[0]>()
    equipamentos.forEach((eq, idx) => {
      map.set(eq.id, EQUIPMENT_COLORS[idx % EQUIPMENT_COLORS.length])
    })
    return map
  }, [equipamentos])

  // Gerar código curto único para cada equipamento
  const getEquipmentCode = (equipamentoId: string, nome: string) => {
    const eq = equipamentos.find(e => e.id === equipamentoId)
    if (!eq) return 'EQ'
    // Pega iniciais do nome + últimos 2 dígitos do ID
    const initials = nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    const idSuffix = equipamentoId.slice(-2).toUpperCase()
    return `${initials}-${idSuffix}`
  }

  // Generate days for the current month view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: Array<{ date: Date | null; isCurrentMonth: boolean }> = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false })
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    return days
  }

  // Generate days for the current week view (Dom-Sáb)
  const getDaysInWeek = (date: Date) => {
    const dayOfWeek = date.getDay() // 0 = Sunday
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - dayOfWeek)

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push({ date: d, isCurrentMonth: d.getMonth() === date.getMonth() })
    }
    return days
  }

  // Get reservations for a specific date
  // Mostra apenas alocações ativas (aceitas) ou pendentes - exclui finalizadas/devolvidas
  const getReservationsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return propostas
      .filter(p => {
        // Exibe apenas propostas aceitas (em uso) ou pendentes (aguardando confirmação)
        // Exclui 'finalizada', 'recusada' e outros status de histórico
        if (p.status !== 'aceita' && p.status !== 'pendente') return false
        if (!p.data_inicio) return false
        const inicio = p.data_inicio.split('T')[0]
        const fim = p.data_fim?.split('T')[0] || inicio
        return dateStr >= inicio && dateStr <= fim
      })
      .map(p => {
        const eq = equipamentos.find(e => e.id === p.equipamento_id)
        const color = equipmentColorMap.get(p.equipamento_id) || EQUIPMENT_COLORS[0]
        const code = getEquipmentCode(p.equipamento_id, eq?.nome || 'EQ')
        // Determinar se é início, fim ou meio do período
        const isStart = dateStr === p.data_inicio?.split('T')[0]
        const isEnd = dateStr === (p.data_fim?.split('T')[0] || p.data_inicio?.split('T')[0])
        return { ...p, equipamento: eq, color, code, isStart, isEnd }
      })
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = getDaysInWeek(currentDate)
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const weekDayNamesFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  // Navigation functions
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }
  const nextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const today = new Date()
  const isToday = (date: Date | null) => date && date.toDateString() === today.toDateString()
  const isSelected = (date: Date | null) => date && selectedDate && date.toDateString() === selectedDate.toDateString()

  // Week range for header display
  const getWeekRange = () => {
    const startOfWeek = weekDays[0].date
    const endOfWeek = weekDays[6].date
    const sameMonth = startOfWeek.getMonth() === endOfWeek.getMonth()
    if (sameMonth) {
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]}`
    }
    return `${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()].substring(0, 3)} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()].substring(0, 3)}`
  }

  // Get all active reservations for the timeline view
  const activeReservations = propostas
    .filter(p => (p.status === 'aceita' || p.status === 'pendente') && p.data_inicio)
    .map(p => {
      const eq = equipamentos.find(e => e.id === p.equipamento_id)
      const color = equipmentColorMap.get(p.equipamento_id) || EQUIPMENT_COLORS[0]
      const code = getEquipmentCode(p.equipamento_id, eq?.nome || 'EQ')
      return { ...p, equipamento: eq, color, code }
    })
    .sort((a, b) => new Date(a.data_inicio!).getTime() - new Date(b.data_inicio!).getTime())

  // Detalhes da data selecionada
  const selectedDateReservations = selectedDate ? getReservationsForDate(selectedDate) : []

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Calendar Header */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-5 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={viewMode === 'month' ? prevMonth : prevWeek}
              className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 transition-all"
            >
              <ChevronLeft size={20} className="text-slate-500" />
            </button>
            <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white min-w-[180px] md:min-w-[250px] text-center tracking-tight">
              {viewMode === 'month'
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : getWeekRange()}
            </h3>
            <button
              onClick={viewMode === 'month' ? nextMonth : nextWeek}
              className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 transition-all"
            >
              <ChevronRight size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToToday}
              className="px-3 md:px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-xl text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 transition-all"
            >
              Hoje
            </button>
            <div className="flex rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
              >
                Mês
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
              >
                Semana
              </button>
            </div>
          </div>
        </div>

        {/* ===== MONTH VIEW ===== */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-0.5 md:gap-1">
            {/* Week day headers */}
            {weekDayNames.map(day => (
              <div key={day} className="p-1 md:p-3 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}

            {/* Days */}
            {days.map((day, idx) => {
              const reservations = day.date ? getReservationsForDate(day.date) : []

              return (
                <div
                  key={idx}
                  onClick={() => day.date && setSelectedDate(day.date)}
                  className={`min-h-[60px] md:min-h-[100px] p-1 md:p-2 rounded-lg md:rounded-xl border transition-all cursor-pointer ${
                    day.date
                      ? isSelected(day.date)
                        ? 'bg-purple-100 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400'
                        : isToday(day.date)
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                          : 'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-500'
                      : 'bg-transparent border-transparent'
                  }`}
                >
                  {day.date && (
                    <>
                      <div className={`text-xs md:text-sm font-bold mb-0.5 md:mb-1 ${
                        isSelected(day.date) ? 'text-purple-600 dark:text-purple-400' :
                        isToday(day.date) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {day.date.getDate()}
                      </div>

                      {/* Mobile: Mostrar dots coloridos */}
                      <div className="md:hidden flex flex-wrap gap-0.5 justify-center">
                        {reservations.length <= 4 ? (
                          reservations.map((res, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${res.color.bg}`} />
                          ))
                        ) : (
                          <>
                            {reservations.slice(0, 3).map((res, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full ${res.color.bg}`} />
                            ))}
                            <span className="text-[8px] text-slate-400 font-bold">+{reservations.length - 3}</span>
                          </>
                        )}
                      </div>

                      {/* Desktop: Mostrar códigos ou contador */}
                      <div className="hidden md:block space-y-0.5">
                        {reservations.length <= 2 ? (
                          reservations.map((res, i) => (
                            <div
                              key={i}
                              className={`${res.color.bg} text-white text-[9px] font-bold px-1.5 py-0.5 rounded truncate`}
                              title={`${res.equipamento?.nome || 'Equipamento'} - ${res.locatario_nome || 'Cliente'}`}
                            >
                              {res.code} {res.isStart ? '↓' : res.isEnd ? '↑' : ''}
                            </div>
                          ))
                        ) : (
                          <div className="bg-slate-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded text-center">
                            {reservations.length} locações
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ===== WEEK VIEW ===== */}
        {viewMode === 'week' && (
          <div className="space-y-2">
            {weekDays.map((day, idx) => {
              const reservations = getReservationsForDate(day.date)
              const dayIsToday = isToday(day.date)
              const dayIsSelected = isSelected(day.date)

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day.date)}
                  className={`p-3 md:p-4 rounded-xl border transition-all cursor-pointer ${
                    dayIsSelected
                      ? 'bg-purple-100 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400'
                      : dayIsToday
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                        : 'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-500'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Day info */}
                    <div className="flex-shrink-0 w-16 md:w-20 text-center">
                      <div className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                        dayIsSelected ? 'text-purple-500' : dayIsToday ? 'text-indigo-500' : 'text-slate-400'
                      }`}>
                        {weekDayNamesFull[idx]}
                      </div>
                      <div className={`text-2xl md:text-3xl font-black ${
                        dayIsSelected ? 'text-purple-600 dark:text-purple-400' :
                        dayIsToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {monthNames[day.date.getMonth()].substring(0, 3)}
                      </div>
                    </div>

                    {/* Reservations for this day */}
                    <div className="flex-1 min-w-0">
                      {reservations.length === 0 ? (
                        <div className="text-sm text-slate-400 py-2">
                          Nenhuma locação
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {reservations.map((res, i) => (
                            <div
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation()
                                res.equipamento && onEquipamentoClick?.(res.equipamento.id)
                              }}
                              className={`p-2 md:p-3 rounded-lg border-l-4 ${res.color.border} bg-white dark:bg-neutral-900 hover:scale-[1.01] transition-all`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`text-[10px] md:text-xs font-bold ${res.color.text} ${res.color.bg} bg-opacity-20 px-2 py-0.5 rounded`}>
                                    {res.code}
                                  </span>
                                  <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                    {res.equipamento?.nome || 'Equipamento'}
                                  </span>
                                  {res.isStart && <span className="text-[10px] text-emerald-500 font-medium">↓ Início</span>}
                                  {res.isEnd && !res.isStart && <span className="text-[10px] text-rose-500 font-medium">↑ Fim</span>}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    res.status === 'aceita' ? 'bg-emerald-500/20 text-emerald-500' :
                                    res.status === 'pendente' ? 'bg-amber-500/20 text-amber-500' :
                                    'bg-slate-500/20 text-slate-400'
                                  }`}>
                                    {res.status === 'aceita' ? 'ATIVO' : res.status === 'pendente' ? 'PENDENTE' : 'FIM'}
                                  </span>
                                  {res.valor_total && (
                                    <span className="text-xs font-bold text-emerald-500 hidden md:inline">
                                      R$ {res.valor_total.toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-[10px] md:text-xs text-slate-400 mt-1">
                                Cliente: <span className="text-slate-600 dark:text-slate-300">{res.locatario_nome || 'Não informado'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend - Equipment Colors */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-neutral-800">
          <span className="text-[10px] md:text-xs text-slate-400 font-medium">Equipamentos:</span>
          {equipamentos.slice(0, 6).map((eq) => {
            const color = equipmentColorMap.get(eq.id) || EQUIPMENT_COLORS[0]
            const code = getEquipmentCode(eq.id, eq.nome)
            return (
              <div key={eq.id} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded ${color.bg}`}></span>
                <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 font-medium">{code}</span>
              </div>
            )
          })}
          {equipamentos.length > 6 && (
            <span className="text-[10px] md:text-xs text-slate-400">+{equipamentos.length - 6} mais</span>
          )}
        </div>
      </div>

      {/* Selected Date Details - Cards abaixo do calendário */}
      {selectedDate && (
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-5 md:p-8 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          {selectedDateReservations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-neutral-800 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma locação neste dia</p>
              <p className="text-xs text-slate-400 mt-1">Todos os equipamentos estão disponíveis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateReservations.map((res, i) => (
                <div
                  key={i}
                  onClick={() => res.equipamento && onEquipamentoClick?.(res.equipamento.id)}
                  className={`p-4 rounded-2xl border-l-4 ${res.color.border} bg-gray-50 dark:bg-neutral-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${res.color.text} bg-neutral-900 px-2 py-0.5 rounded`}>
                          {res.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          res.status === 'aceita' ? 'bg-emerald-500/20 text-emerald-400' :
                          res.status === 'pendente' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {res.status === 'aceita' ? 'ATIVO' : res.status === 'pendente' ? 'PENDENTE' : 'FINALIZADO'}
                        </span>
                        {res.isStart && <span className="text-[10px] text-emerald-400 font-medium">↓ Início</span>}
                        {res.isEnd && !res.isStart && <span className="text-[10px] text-rose-400 font-medium">↑ Devolução</span>}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {res.equipamento?.nome || 'Equipamento'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Cliente: <span className="font-medium text-slate-700 dark:text-slate-300">{res.locatario_nome || 'Não informado'}</span>
                      </p>
                      {res.data_inicio && res.data_fim && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Período: {new Date(res.data_inicio).toLocaleDateString('pt-BR')} → {new Date(res.data_fim).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    {res.valor_total && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-emerald-500">R$ {res.valor_total.toFixed(0)}</p>
                        <p className="text-[10px] text-slate-400">total</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Reservations List */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-4 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Próximas Reservas</h3>
        {activeReservations.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-full inline-block mb-4 border border-gray-200 dark:border-neutral-700">
              <Calendar className="w-12 h-12 text-slate-400" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhuma reserva ativa</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Quando você tiver reservas, elas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeReservations.slice(0, 10).map((res) => {
              const inicio = res.data_inicio ? new Date(res.data_inicio) : null
              const fim = res.data_fim ? new Date(res.data_fim) : null
              const config = res.equipamento?.vertical ? VERTICAL_CONFIGS[res.equipamento.vertical as VerticalKey] : null
              const theme = THEME_MAP[config?.theme.primary || 'amber'] || THEME_MAP.amber

              return (
                <div
                  key={res.id}
                  onClick={() => res.equipamento && onEquipamentoClick?.(res.equipamento.id)}
                  className={`p-4 rounded-2xl border ${theme.border} ${theme.bgLight} cursor-pointer hover:scale-[1.01] transition-all`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-2.5 rounded-xl ${theme.bg} text-white flex-shrink-0`}>
                        {config?.icon ? <config.icon size={20} /> : <Package size={20} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{res.equipamento?.nome || 'Equipamento'}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{res.locatario_nome || 'Cliente'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Calendar size={14} />
                        {inicio?.toLocaleDateString('pt-BR')}
                        {fim && fim.getTime() !== inicio?.getTime() && (
                          <> - {fim.toLocaleDateString('pt-BR')}</>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${res.status === 'aceita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {res.status === 'aceita' ? 'Confirmado' : 'Aguardando'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ========== STORE SETTINGS TAB COMPONENT ==========
function StoreSettingsTab() {
  const { user, profile, recarregarProfile } = useAuth()

  // Estados do formulario
  const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || null)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const [corMarca, setCorMarca] = useState(profile?.cor_marca || '#4f46e5')
  const [lojaSlug, setLojaSlug] = useState(profile?.loja_slug || '')
  const [bio, setBio] = useState(profile?.bio || '')

  const [slugValidation, setSlugValidation] = useState<{ checking: boolean; available: boolean | null; reason: string | null }>({
    checking: false, available: null, reason: null
  })
  const [saving, setSaving] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const bannerInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync com profile
  useEffect(() => {
    if (profile) {
      setBannerUrl(profile.banner_url || null)
      setAvatarUrl(profile.avatar_url || null)
      setCorMarca(profile.cor_marca || '#4f46e5')
      setLojaSlug(profile.loja_slug || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  // Validar slug
  const validateSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugValidation({ checking: false, available: null, reason: slug ? 'Minimo 3 caracteres' : null })
      return
    }

    setSlugValidation({ checking: true, available: null, reason: null })

    try {
      const { data, error } = await supabase.rpc('check_slug_availability', { p_slug: slug, p_user_id: user?.id || null })
      if (error) throw error
      setSlugValidation({ checking: false, available: data.available, reason: data.available ? null : data.reason })
    } catch {
      setSlugValidation({ checking: false, available: null, reason: 'Erro ao verificar' })
    }
  }, [user?.id])

  const handleSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
    setLojaSlug(normalized)
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
    slugDebounceRef.current = setTimeout(() => validateSlug(normalized), 500)
  }

  // Upload de imagem
  const uploadStoreImage = async (file: File, type: 'banner' | 'logo'): Promise<string | null> => {
    if (!user) return null
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `lojas/${user.id}/${type}-${Date.now()}.${fileExt}`

      // Deleta antiga
      const oldUrl = type === 'banner' ? bannerUrl : avatarUrl
      if (oldUrl) {
        const oldPath = oldUrl.split('/equipamentos/')[1]
        if (oldPath) await supabase.storage.from('equipamentos').remove([oldPath])
      }

      const { error } = await supabase.storage.from('equipamentos').upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (error) throw error

      return getStorageUrl(fileName)
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro upload:', err)
      return null
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const url = await uploadStoreImage(file, 'banner')
    if (url) setBannerUrl(url)
    setUploadingBanner(false)
    e.target.value = ''
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const url = await uploadStoreImage(file, 'logo')
    if (url) setAvatarUrl(url)
    setUploadingLogo(false)
    e.target.value = ''
  }

  // Salvar
  const handleSave = async () => {
    if (!user) return
    if (lojaSlug && !slugValidation.available && lojaSlug !== profile?.loja_slug) {
      return
    }

    setSaving(true)
    try {
      const updateData: Record<string, unknown> = {
        banner_url: bannerUrl,
        avatar_url: avatarUrl,
        bio: bio || null
      }

      const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id)
      if (error) throw error

      await recarregarProfile()
      // Toast seria ideal aqui
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro ao salvar:', err)
    } finally {
      setSaving(false)
    }
  }

  const nomeExibicao = profile?.nome_empresa || profile?.full_name || 'Minha Loja'

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="space-y-4">
          {/* Banner */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ImagePlus size={16} className="text-indigo-600 dark:text-indigo-400" />
              Banner de Capa
            </h3>
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            <div
              onClick={() => bannerInputRef.current?.click()}
              className="h-32 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-xl cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all overflow-hidden relative group"
            >
              {bannerUrl ? (
                <>
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Alterar</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  {uploadingBanner ? <Loader2 className="animate-spin" size={20} /> : <><ImagePlus size={20} /><span className="text-xs mt-1">1200x300 px</span></>}
                </div>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Store size={16} className="text-indigo-600 dark:text-indigo-400" />
              Logo da Empresa
            </h3>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div
              onClick={() => logoInputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-full cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all overflow-hidden relative group"
            >
              {avatarUrl ? (
                <>
                  <img src={avatarUrl} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-medium">Alterar</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  {uploadingLogo ? <Loader2 className="animate-spin" size={18} /> : <Store size={18} />}
                </div>
              )}
            </div>
          </div>

          {/* Cor da Marca */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Cor da Marca</h3>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={corMarca}
                onChange={(e) => setCorMarca(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border border-gray-200 dark:border-neutral-700"
              />
              <input
                type="text"
                value={corMarca}
                onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setCorMarca(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-mono outline-none"
              />
            </div>
          </div>

          {/* URL Personalizada */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">URL Personalizada</h3>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-r-0 border-gray-200 dark:border-neutral-700 rounded-l-xl text-xs text-slate-500 font-mono">
                /loja/
              </span>
              <input
                type="text"
                value={lojaSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-r-xl text-sm font-mono outline-none"
                placeholder="minha-empresa"
                maxLength={30}
              />
            </div>
            {lojaSlug && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                {slugValidation.checking ? (
                  <><Loader2 size={12} className="animate-spin text-slate-400" /><span className="text-slate-400">Verificando...</span></>
                ) : slugValidation.available === true ? (
                  <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-emerald-600 font-medium">Disponivel</span></>
                ) : slugValidation.available === false ? (
                  <><X size={12} className="text-red-500" /><span className="text-red-600 font-medium">{slugValidation.reason}</span></>
                ) : slugValidation.reason ? (
                  <span className="text-amber-600">{slugValidation.reason}</span>
                ) : null}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Slogan / Bio</h3>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm outline-none resize-none"
                placeholder="Descreva sua empresa..."
              />
              <span className="absolute bottom-2 right-2 text-[10px] text-slate-400">{bio.length}/200</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="xl:sticky xl:top-8 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Preview</h3>
            <span className="text-[10px] text-slate-500 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">Ao vivo</span>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden shadow-sm">
            {/* Banner Preview */}
            <div
              className="h-28 relative"
              style={{ background: bannerUrl ? `url(${bannerUrl}) center/cover` : `linear-gradient(135deg, ${corMarca}40, ${corMarca}80)` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            </div>
            {/* Avatar Preview */}
            <div className="relative px-4 -mt-8">
              <div className="w-16 h-16 rounded-xl border-4 border-white dark:border-neutral-900 shadow-lg overflow-hidden" style={{ backgroundColor: corMarca }}>
                {avatarUrl ? <img src={avatarUrl} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Store className="w-6 h-6 text-white" /></div>}
              </div>
            </div>
            <div className="p-4 pt-2">
              <h4 className="font-bold text-slate-900 dark:text-white">{nomeExibicao}</h4>
              {lojaSlug && <p className="text-[10px] text-slate-400 font-mono">/loja/{lojaSlug}</p>}
              {bio && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{bio}</p>}
              <button className="mt-3 w-full py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: corMarca }}>
                Botao Exemplo
              </button>
            </div>
          </div>

          {/* Acoes */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploadingBanner || uploadingLogo}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Salvar
            </button>
            {(profile?.loja_slug || lojaSlug) && (
              <a
                href={`/loja/${profile?.loja_slug || lojaSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 border-2 border-gray-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-2"
              >
                Ver Loja
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ========== MAIN COMPONENT ==========
export default function OwnerDashboard() {
  const { user, profile, signOut } = useAuth()
  const {
    fetchMeusEquipamentos,
    fetchMeusChats,
    fetchEntregasPendentes,
    mensagensNaoLidas,
    fetchMensagensNaoLidas,
    setupMensagensRealtime,
    marcarMensagensComoLidas,
    despacharEquipamento,
    confirmarRetorno,
    deletarEquipamento,
    addEquipamento,
    atualizarEquipamento,
    uploadImagens,
    uploadInspectionPhotos,
    saveInspectionAndDispatch
  } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { theme: currentTheme, toggleTheme } = useTheme()

  // Lê aba inicial da URL (ex: /dashboard?tab=fleet)
  const tabFromUrl = searchParams.get('tab') as TabKey | null
  const validTabs: TabKey[] = ['overview', 'chat', 'fleet', 'finance', 'wallet', 'contracts', 'calendar', 'store']
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [meusEquipamentos, setMeusEquipamentos] = useState<Equipamento[]>([])
  const [meusChats, setMeusChats] = useState<Chat[]>([])
  const [entregasPendentes, setEntregasPendentes] = useState<EntregaPendente[]>([])
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [equipamentosEmUso, setEquipamentosEmUso] = useState<EquipamentoEmUso[]>([])
  const [loading, setLoading] = useState(true)
  const [chatSearch, setChatSearch] = useState('')
  const [fleetSearch, setFleetSearch] = useState('')
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null)
  const [despachando, setDespachando] = useState<string | null>(null)
  const [equipamentoParaRetorno, setEquipamentoParaRetorno] = useState<EquipamentoEmUso | null>(null)
  const [confirmandoRetorno, setConfirmandoRetorno] = useState(false)
  const [equipamentoParaExcluir, setEquipamentoParaExcluir] = useState<Equipamento | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [despachoModal, setDespachoModal] = useState<{ propostaId: string; equipamentoId: string; equipamentoNome: string; clienteNome: string; chatId?: string } | null>(null)
  const [inspectionWizardOpen, setInspectionWizardOpen] = useState(false)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [submittingNovo, setSubmittingNovo] = useState(false)
  const [equipamentoEditando, setEquipamentoEditando] = useState<Equipamento | null>(null)
  const mountedRef = useRef(true)

  // ---------- DATA LOADING ----------
  useEffect(() => {
    mountedRef.current = true
    const load = async () => {
      if (!user?.id) return
      const [eqs, chats, entregas] = await Promise.all([
        fetchMeusEquipamentos(user.id),
        fetchMeusChats(user.id),
        fetchEntregasPendentes(user.id)
      ])
      if (!mountedRef.current) return

      setMeusEquipamentos(eqs)
      setMeusChats(chats)
      setEntregasPendentes(entregas)

      // Busca TODAS as propostas dos equipamentos do locador para exibir no calendário
      // Não depende dos chats - busca diretamente pelos equipamentos
      if (eqs.length > 0) {
        const equipamentoIds = eqs.map((eq: Equipamento) => eq.id)
        const { data: propsData } = await supabase
          .from('propostas')
          .select('*')
          .in('equipamento_id', equipamentoIds)
          .in('status', ['aceita', 'pendente', 'finalizada'])
        if (mountedRef.current && propsData) {
          setPropostas(propsData as Proposta[])
        }
      }

      setLoading(false)
      fetchMensagensNaoLidas(user.id)
      setupMensagensRealtime(user.id)
    }
    load()
    return () => { mountedRef.current = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- REFRESH UNREAD COUNT ----------
  useEffect(() => {
    if (user?.id) fetchMensagensNaoLidas(user.id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- EQUIPAMENTOS EM USO ----------
  useEffect(() => {
    const identify = async () => {
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
      const { data: props } = await supabase
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
        const proposta = props?.find(p => p.equipamento_id === eq.id)
        return {
          equipamento: eq,
          proposta_id: proposta?.id || chat?.proposta_id || '',
          cliente_nome: chat ? (clientesMap.get(chat.locatario_id) || 'Cliente') : 'Cliente',
          data_entrega: proposta?.created_at,
          data_inicio: (proposta as Record<string, unknown>)?.data_inicio as string | undefined,
          data_fim: (proposta as Record<string, unknown>)?.data_fim as string | undefined
        }
      })
      if (mountedRef.current) setEquipamentosEmUso(lista)
    }
    identify()
  }, [meusEquipamentos, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- NICHE DETECTION ----------
  const ownerVertical = useMemo((): VerticalKey => {
    if (meusEquipamentos.length === 0) return 'construcao'
    const counts: Partial<Record<VerticalKey, number>> = {}
    meusEquipamentos.forEach(eq => {
      const v = (eq.vertical || 'construcao') as VerticalKey
      if ((VERTICALS as readonly string[]).includes(v)) {
        counts[v] = (counts[v] || 0) + 1
      }
    })
    const sorted = Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number))
    return (sorted[0]?.[0] || 'construcao') as VerticalKey
  }, [meusEquipamentos])

  const verticalConfig = VERTICAL_CONFIGS[ownerVertical]
  const theme = THEME_MAP[verticalConfig.theme.primary] || THEME_MAP.amber
  const VerticalIcon = verticalConfig.icon

  // ---------- PROPOSTA MAP ----------
  const propostaMap = useMemo(() => new Map(propostas.map(p => [p.id, p])), [propostas])

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    const total = meusEquipamentos.length
    const alugados = meusEquipamentos.filter(eq => {
      const s = eq.status?.toUpperCase()
      return s === 'OCUPADO' || s === 'RESERVADO' || s === 'EM_TRANSITO'
    }).length
    const disponiveis = meusEquipamentos.filter(eq => {
      const s = eq.status?.toUpperCase()
      return !s || s === 'DISPONIVEL'
    }).length
    const faturamento = propostas
      .filter(p => p.status === 'aceita' || p.status === 'finalizada')
      .reduce((sum, p) => sum + (p.valor_total || 0), 0)
    const solicitacoesPendentes = meusChats.filter(c => {
      if (c.locador_id !== user?.id) return false
      const prop = c.proposta_id ? propostaMap.get(c.proposta_id) : null
      return !prop || prop.status === 'pendente'
    }).length
    return { total, alugados, disponiveis, faturamento, solicitacoesPendentes }
  }, [meusEquipamentos, meusChats, propostas, propostaMap, user?.id])

  // ---------- SPARKLINE TREND DATA ----------
  const trendData = useMemo(() => {
    const gen = (current: number): number[] => {
      const pts: number[] = []
      for (let i = 6; i >= 0; i--) {
        const variation = 0.7 + Math.sin(i * 0.9) * 0.3
        pts.push(Math.round(current * variation))
      }
      pts[6] = current
      return pts
    }
    return { faturamento: gen(kpis.faturamento), alugados: gen(kpis.alugados), solicitacoes: gen(kpis.solicitacoesPendentes) }
  }, [kpis])

  // ---------- LOGISTICS ----------
  const equipamentosParaDespachar = useMemo(() =>
    meusEquipamentos.filter(eq => eq.status?.toUpperCase() === 'RESERVADO'), [meusEquipamentos])
  const equipamentosParaDevolucao = useMemo(() =>
    meusEquipamentos.filter(eq => { const s = eq.status?.toUpperCase(); return s === 'OCUPADO' || s === 'EM_TRANSITO' }), [meusEquipamentos])

  // ---------- FLEET BREAKDOWN ----------
  const fleetBreakdown = useMemo(() => {
    const total = kpis.total || 1
    return [
      { label: 'Alugados', value: kpis.alugados, color: 'bg-blue-500', pct: Math.round((kpis.alugados / total) * 100) },
      { label: 'Disponíveis', value: kpis.disponiveis, color: 'bg-emerald-500', pct: Math.round((kpis.disponiveis / total) * 100) },
    ]
  }, [kpis])

  // ---------- KPIs POR VERTICAL/AREA ----------
  const kpisPorVertical = useMemo(() => {
    const verticalStats: Record<string, { total: number; ocupados: number; receita: number; vertical: VerticalKey }> = {}

    // Agrupar equipamentos por vertical
    meusEquipamentos.forEach(eq => {
      const v = (eq.vertical || 'construcao') as VerticalKey
      if (!verticalStats[v]) {
        verticalStats[v] = { total: 0, ocupados: 0, receita: 0, vertical: v }
      }
      verticalStats[v].total += 1
      const status = eq.status?.toUpperCase()
      if (status === 'OCUPADO' || status === 'RESERVADO' || status === 'EM_TRANSITO') {
        verticalStats[v].ocupados += 1
      }
    })

    // Calcular receita por vertical (baseado nas propostas)
    propostas
      .filter(p => p.status === 'aceita' || p.status === 'finalizada')
      .forEach(p => {
        const eq = meusEquipamentos.find(e => e.id === p.equipamento_id)
        if (eq) {
          const v = (eq.vertical || 'construcao') as VerticalKey
          if (verticalStats[v]) {
            verticalStats[v].receita += (p.valor_total || 0)
          }
        }
      })

    // Converter para array com taxa de ocupação
    return Object.values(verticalStats)
      .map(stat => {
        const config = VERTICAL_CONFIGS[stat.vertical]
        const taxaOcupacao = stat.total > 0 ? Math.round((stat.ocupados / stat.total) * 100) : 0
        return {
          vertical: stat.vertical,
          label: config?.label || stat.vertical,
          icon: config?.icon || Package,
          total: stat.total,
          ocupados: stat.ocupados,
          receita: stat.receita,
          taxaOcupacao,
          theme: THEME_MAP[config?.theme.primary || 'amber'] || THEME_MAP.amber
        }
      })
      .filter(stat => stat.total > 0)
      .sort((a, b) => b.receita - a.receita)
  }, [meusEquipamentos, propostas])

  // ---------- CHAT FILTERING ----------
  const chatsDoLocador = useMemo(() => {
    return meusChats
      .filter(c => c.locador_id === user?.id)
      .filter(c => {
        if (!chatSearch) return true
        const term = chatSearch.toLowerCase()
        return (c.locatario_nome || '').toLowerCase().includes(term) || (c.equipamento?.nome || '').toLowerCase().includes(term)
      })
  }, [meusChats, user?.id, chatSearch])

  // ---------- FLEET FILTERING ----------
  const equipamentosFiltrados = useMemo(() => {
    if (!fleetSearch) return meusEquipamentos
    const t = fleetSearch.toLowerCase()
    return meusEquipamentos.filter(eq => eq.nome.toLowerCase().includes(t) || eq.categoria?.toLowerCase().includes(t))
  }, [meusEquipamentos, fleetSearch])

  // ---------- FINANCE DATA ----------
  const financeData = useMemo(() => {
    const accepted = propostas.filter(p => p.status === 'aceita' || p.status === 'finalizada')
    const totalRevenue = accepted.reduce((sum, p) => sum + (p.valor_total || 0), 0)
    const avgDailyRate = accepted.length > 0 ? accepted.reduce((sum, p) => sum + (p.valor_diaria || 0), 0) / accepted.length : 0

    const now = new Date()
    const monthlyRevenue: Array<{ label: string; value: number }> = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const monthTotal = accepted
        .filter(p => { const d = new Date(p.created_at); return d >= monthDate && d <= monthEnd })
        .reduce((sum, p) => sum + (p.valor_total || 0), 0)
      monthlyRevenue.push({ label: monthLabel, value: monthTotal })
    }

    const recentTransactions = [...accepted]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)

    return { totalRevenue, avgDailyRate, monthlyRevenue, recentTransactions, totalContracts: accepted.length }
  }, [propostas])

  // ---------- AUTO-MARK READ ----------
  useEffect(() => {
    if (activeTab === 'chat' && user?.id && chatsDoLocador.length > 0) {
      chatsDoLocador.forEach(chat => { marcarMensagensComoLidas(chat.id, user.id) })
    }
  }, [activeTab, chatsDoLocador.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- HANDLERS ----------
  const handleSair = async () => {
    try { await signOut() } catch (err) { if (import.meta.env.DEV) console.error('[OwnerDashboard] Erro ao sair:', err) }
    finally { navigate('/') }
  }
  const handleTabChange = (tab: TabKey) => { setActiveTab(tab); if (user?.id) fetchMensagensNaoLidas(user.id) }
  const handleOpenChat = async (chatId: string) => {
    if (user?.id) marcarMensagensComoLidas(chatId, user.id)
    navigate(`/chats/${chatId}`)
  }
  const reloadData = async () => {
    if (!user?.id) return
    const [eqs, chats] = await Promise.all([fetchMeusEquipamentos(user.id), fetchMeusChats(user.id)])
    if (mountedRef.current) {
      setMeusEquipamentos(eqs); setMeusChats(chats)
      const pIds = chats.filter((c: Chat) => c.proposta_id).map((c: Chat) => c.proposta_id!)
      if (pIds.length > 0) { const { data } = await supabase.from('propostas').select('*').in('id', pIds); if (data) setPropostas(data as Proposta[]) }
    }
  }

  // Handler para marcar pagamento como recebido
  const handleMarcarPago = async (propostaId: string, pago: boolean) => {
    // Atualiza estado local otimisticamente
    setPropostas(prev => prev.map(p =>
      p.id === propostaId ? { ...p, status: pago ? 'finalizada' : 'aceita' } : p
    ))

    // Atualiza no banco de dados
    const { error } = await supabase
      .from('propostas')
      .update({ status: pago ? 'finalizada' : 'aceita' })
      .eq('id', propostaId)

    if (error) {
      if (import.meta.env.DEV) console.error('[OwnerDashboard] Erro ao atualizar status:', error)
      // Reverte em caso de erro
      setPropostas(prev => prev.map(p =>
        p.id === propostaId ? { ...p, status: pago ? 'aceita' : 'finalizada' } : p
      ))
    }
  }

  // Abre o wizard de vistoria para despachar equipamento
  const abrirDespachoModal = async (propostaId: string, equipamento: Equipamento, clienteNome: string) => {
    // Busca o chatId associado à proposta
    const { data: chatData } = await supabase
      .from('chats')
      .select('id')
      .eq('proposta_id', propostaId)
      .single()

    setDespachoModal({
      propostaId,
      equipamentoId: equipamento.id,
      equipamentoNome: equipamento.nome,
      clienteNome,
      chatId: chatData?.id
    })
    setInspectionWizardOpen(true)
  }

  // Callback quando a vistoria for completada no OwnerDashboard
  const handleInspectionComplete = async (
    photos: Map<InspectionPhotoPosition, File>,
    avarias: string,
    declaracaoAceita: boolean
  ) => {
    if (!despachoModal || !user) return

    setDespachando(despachoModal.equipamentoId)
    try {
      // 1. Upload das fotos de inspeção
      const uploadResult = await uploadInspectionPhotos(photos, user.id, despachoModal.propostaId)

      if (uploadResult.error) {
        if (import.meta.env.DEV) console.error('Erro ao fazer upload das fotos:', uploadResult.error)
        setDespachando(null)
        return
      }

      // 2. Salva inspeção e despacha equipamento
      const result = await saveInspectionAndDispatch(
        despachoModal.propostaId,
        despachoModal.equipamentoId,
        despachoModal.chatId || '',
        {
          photos: uploadResult.photos,
          avarias,
          declaracaoAceita
        }
      )

      if (result.success) {
        setInspectionWizardOpen(false)
        setDespachoModal(null)
        reloadData()
      } else {
        if (import.meta.env.DEV) console.error('Erro ao despachar:', result.error)
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro inesperado ao despachar:', err)
    } finally {
      setDespachando(null)
    }
  }

  // Mantém compatibilidade com o modal antigo (caso precise voltar atrás)
  const handleDespacharConfirmado = async () => {
    if (!despachoModal) return
    setDespachando(despachoModal.equipamentoId)
    const result = await despacharEquipamento(despachoModal.propostaId, despachoModal.equipamentoId)
    setDespachando(null)
    setDespachoModal(null)
    if (result.success) reloadData()
  }
  const handleConfirmarRetorno = async (horimetroDados?: { horimetro_chegada?: number; horimetro_chegada_foto?: string }) => {
    if (!equipamentoParaRetorno || !user) return
    setConfirmandoRetorno(true)
    const result = await confirmarRetorno(equipamentoParaRetorno.proposta_id, equipamentoParaRetorno.equipamento.id, horimetroDados)
    setConfirmandoRetorno(false)
    if (result.success) { setEquipamentoParaRetorno(null); reloadData() }
  }
  const handleExcluirConfirmado = async () => {
    if (!user || !equipamentoParaExcluir) return
    setExcluindo(true)
    await deletarEquipamento(equipamentoParaExcluir.id, user.id)
    setExcluindo(false)
    setEquipamentoParaExcluir(null)
    reloadData()
  }
  const handleAddEquipamento = async (dados: NovoEquipamento) => {
    if (!user) return
    setSubmittingNovo(true)
    if (equipamentoEditando) {
      await atualizarEquipamento(equipamentoEditando.id, dados, user.id)
    } else {
      await addEquipamento(dados, user.id)
    }
    setSubmittingNovo(false)
    setShowNovoModal(false)
    setEquipamentoEditando(null)
    reloadData()
  }
  const handleEditar = (equipamento: Equipamento) => {
    setEquipamentoEditando(equipamento)
    setShowNovoModal(true)
    setMenuAbertoId(null)
  }
  const openNovoModal = () => {
    setEquipamentoEditando(null)
    setShowNovoModal(true)
  }
  const handleNovaLocacao = async (equipamento: Equipamento) => {
    if (!user) return
    setMenuAbertoId(null)
    const { data: chats } = await supabase
      .from('chats').select('id').eq('equipamento_id', equipamento.id).eq('locador_id', user.id)
      .order('created_at', { ascending: false }).limit(1)
    if (chats && chats.length > 0) navigate(`/chats/${chats[0].id}`)
    else alert('Nenhuma conversa anterior encontrada.')
  }

  const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null
    if (path.startsWith('http') || path.startsWith('data:')) return path
    return getStorageUrl(path)
  }

  // ---------- NAV ITEMS ----------
  const navItems: Array<{ key: TabKey; icon: typeof LayoutDashboard; label: string; badge?: number }> = [
    { key: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
    { key: 'chat', icon: MessageSquare, label: 'Negociações', badge: mensagensNaoLidas },
    { key: 'fleet', icon: Package, label: 'Minha Frota' },
    { key: 'wallet', icon: Wallet, label: 'Carteira' },
    { key: 'contracts', icon: FileText, label: 'Contratos' },
    { key: 'calendar', icon: Calendar, label: 'Calendário' },
    // Minha Loja - só aparece se tem_loja === true
    ...(profile?.tem_loja ? [{ key: 'store' as TabKey, icon: Store, label: 'Minha Loja' }] : []),
  ]

  const nomeEmpresa = profile?.nome_empresa || profile?.full_name || 'Parceiro'

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white flex overflow-hidden">

      {/* ========== 1. SIDEBAR (Lovable/G4 Light) ========== */}
      <aside className="w-20 lg:w-72 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white flex-col justify-between fixed h-full z-20 shadow-sm transition-all duration-300 hidden md:flex border-r border-gray-100 dark:border-neutral-800">
        <div>
          <div className="h-24 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100 dark:border-neutral-800">
            <TraktoLogo size="sm" />
          </div>

          <nav className="p-4 lg:p-6 space-y-3 mt-4">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`w-full flex items-center p-3.5 lg:p-4 rounded-2xl transition-all duration-300 group relative ${
                  activeTab === item.key
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`${activeTab === item.key ? 'text-indigo-600 dark:text-indigo-400' : ''} transition-colors`}>
                  <item.icon size={22} />
                </span>
                <span className="ml-4 hidden lg:block text-sm tracking-wide">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full hidden lg:block shadow-lg shadow-red-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 lg:p-6 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          {/* Toggle de Tema - Desktop */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all text-left group"
            title={currentTheme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-shrink-0 border border-gray-200 dark:border-neutral-700">
              {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {currentTheme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              </p>
              <p className="text-xs text-slate-400">Alternar tema</p>
            </div>
          </button>

          {/* Perfil e Sair */}
          <button onClick={handleSair} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all text-left">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg ${theme.glow} flex-shrink-0`}>
              {nomeEmpresa.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{nomeEmpresa}</p>
              <p className="text-xs text-slate-400">Plano Profissional</p>
            </div>
            <LogOut size={18} className="ml-auto text-slate-400 hover:text-red-500 hidden lg:block flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* ========== MOBILE HEADER (Simplificado) ========== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
        <div className="px-4 flex items-center justify-between h-14">
          <TraktoLogo size="sm" />
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title={currentTheme === 'light' ? 'Modo escuro' : 'Modo claro'}
            >
              {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button onClick={() => handleTabChange('chat')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white relative transition-colors">
              <Bell size={20} />
              {mensagensNaoLidas > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#0a0a0a]" />}
            </button>
            {activeTab === 'fleet' && (
              <button onClick={() => openNovoModal()} className="p-2 bg-indigo-600 dark:bg-purple-600 text-white rounded-xl hover:bg-indigo-500 dark:hover:bg-purple-500 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleSair} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========== MOBILE BOTTOM NAV ========== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/10 z-50"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="h-16 flex justify-around items-center px-1 overflow-x-auto">
          {navItems.map(item => {
            const isActive = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 min-w-[48px] h-full transition-all duration-200 relative active:scale-95"
              >
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-indigo-600 dark:bg-purple-500 rounded-b-full" />
                )}
                <div className={`relative p-1.5 rounded-lg transition-all ${isActive ? 'text-indigo-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-white dark:border-[#0a0a0a]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-medium transition-colors leading-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* ========== 2. MAIN CONTENT ========== */}
      <main className="flex-1 md:ml-20 lg:ml-72 p-4 pt-20 pb-24 md:pt-0 md:pb-0 md:p-8 lg:p-12 overflow-y-auto transition-all">

        {/* Topbar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4 md:gap-6">
          <div>
            <h1 className="text-xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-0.5 md:mb-1">{TAB_TITLES[activeTab]}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm">
              {mensagensNaoLidas > 0 ? (
                <>Você tem <span className="text-indigo-600 dark:text-indigo-400 font-bold underline cursor-pointer" onClick={() => handleTabChange('chat')}>{mensagensNaoLidas} nova{mensagensNaoLidas > 1 ? 's' : ''}</span></>
              ) : (
                <>Gestão <strong className="text-slate-900 dark:text-white">{verticalConfig.label}</strong></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            {activeTab === 'fleet' && (
              <button
                onClick={() => openNovoModal()}
                className="flex-1 md:flex-none bg-slate-900 dark:bg-indigo-600 text-white px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:-translate-y-1 transition-all group flex-shrink-0 text-sm md:text-base"
              >
                <Plus size={18} className="md:w-5 md:h-5 bg-white/20 rounded-lg p-0.5 group-hover:rotate-90 transition-transform" />
                <span className="hidden sm:inline">Novo Anúncio</span>
                <span className="sm:hidden">Novo</span>
              </button>
            )}
          </div>
        </header>

        {/* ========== TAB CONTENT ========== */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>
        ) : (
          <>
            {/* ===== OVERVIEW ===== */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hero KPI Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Receita - Card Principal com fundo escuro */}
                  <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-900 rounded-2xl md:rounded-[2rem] p-5 md:p-8 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[100px] opacity-30 -translate-y-1/2 translate-x-1/2" />
                    <div className="flex justify-between items-start mb-4 md:mb-6 relative z-10">
                      <div>
                        <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Receita Total</p>
                        <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                          R$ {kpis.faturamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </h3>
                      </div>
                      {kpis.faturamento > 0 && (
                        <span className="px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <TrendingUp size={12} className="md:w-[14px] md:h-[14px]" /> Ativo
                        </span>
                      )}
                    </div>
                    <div className="w-full h-20 md:h-32 overflow-hidden relative z-10">
                      <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`grad-${verticalConfig.theme.primary}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d={`M0,100 ${trendData.faturamento.map((val, i) => `${i * 50},${100 - (val / (Math.max(...trendData.faturamento) || 1)) * 80}`).join(' ')} L300,100 Z`} fill={`url(#grad-${verticalConfig.theme.primary})`} />
                        <polyline points={trendData.faturamento.map((val, i) => `${i * 50},${100 - (val / (Math.max(...trendData.faturamento) || 1)) * 80}`).join(' ')} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                      </svg>
                    </div>
                  </div>

                  {/* Solicitações */}
                  <div onClick={() => handleTabChange('chat')} className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-5 md:p-8 relative overflow-hidden group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-500/10 transition-all shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-5 blur-3xl rounded-full" />
                    <div className="flex justify-between items-start mb-4 md:mb-8 relative z-10">
                      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"><MessageSquare size={24} className="md:w-7 md:h-7" /></div>
                      {kpis.solicitacoesPendentes > 0 && (
                        <span className="text-[9px] md:text-[10px] font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 md:px-3 py-1 rounded-full animate-pulse">Ação Necessária</span>
                      )}
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-1 md:mb-2">{kpis.solicitacoesPendentes}</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm">Novas Solicitações</p>
                    </div>
                  </div>
                </div>

                {/* Grid Secundário */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
                  {/* Agenda */}
                  <div className="xl:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-4 md:p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-4 md:mb-8">
                      <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700"><Calendar size={16} className="md:w-5 md:h-5 text-slate-500" /></div>
                        Agenda do Dia
                      </h3>
                      <button onClick={() => handleTabChange('fleet')} className="text-xs md:text-sm font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Ver Tudo</button>
                    </div>
                    <div className="relative space-y-0">
                      {(entregasPendentes.length > 0 || equipamentosParaDespachar.length > 0 || equipamentosParaDevolucao.length > 0) && (
                        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-neutral-700" />
                      )}
                      {entregasPendentes.map(e => (
                        <div key={e.proposta_id} onClick={() => handleTabChange('fleet')} className="group relative flex items-center gap-2 md:gap-4 p-3 md:p-4 pl-10 md:pl-12 rounded-xl md:rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all cursor-pointer">
                          <div className="absolute left-[14px] md:left-[17px] top-1/2 -translate-y-1/2 w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-neutral-900 shadow-sm z-10" />
                          <div className="relative">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"><ArrowUpRight size={16} className="md:w-5 md:h-5" /></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">Saída: {e.equipamento_nome}</p>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide truncate">Cliente: {e.cliente_nome}</p>
                          </div>
                          <span className="text-[9px] md:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-indigo-200 dark:border-indigo-800 flex-shrink-0">Pendente</span>
                        </div>
                      ))}
                      {equipamentosParaDespachar.filter(eq => !entregasPendentes.some(ep => ep.equipamento_id === eq.id)).map(eq => (
                        <div key={eq.id} onClick={() => handleTabChange('fleet')} className="group relative flex items-center gap-2 md:gap-4 p-3 md:p-4 pl-10 md:pl-12 rounded-xl md:rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all cursor-pointer">
                          <div className="absolute left-[14px] md:left-[17px] top-1/2 -translate-y-1/2 w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-neutral-900 shadow-sm z-10" />
                          <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"><ArrowUpRight size={16} className="md:w-5 md:h-5" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">Saída: {eq.nome}</p>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">Aguardando despacho</p>
                          </div>
                          <span className="text-[9px] md:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-indigo-200 dark:border-indigo-800 flex-shrink-0">Pendente</span>
                        </div>
                      ))}
                      {equipamentosParaDevolucao.map(eq => (
                        <div key={eq.id} onClick={() => handleTabChange('fleet')} className="group relative flex items-center gap-2 md:gap-4 p-3 md:p-4 pl-10 md:pl-12 rounded-xl md:rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all cursor-pointer">
                          <div className="absolute left-[14px] md:left-[17px] top-1/2 -translate-y-1/2 w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 shadow-sm z-10" />
                          <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><ArrowDownLeft size={16} className="md:w-5 md:h-5" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">Retorno: {eq.nome}</p>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">{eq.status?.toUpperCase() === 'EM_TRANSITO' ? 'Em trânsito' : 'Retorno pendente'}</p>
                          </div>
                          <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex-shrink-0">Ativo</span>
                        </div>
                      ))}
                      {entregasPendentes.length === 0 && equipamentosParaDespachar.length === 0 && equipamentosParaDevolucao.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Nenhuma movimentação logística hoje.</div>
                      )}
                    </div>
                  </div>

                  {/* Fleet Status */}
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-4 md:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">Status da Frota</h3>
                      <div className="flex items-end gap-2 mb-4 md:mb-8">
                        <span className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">{kpis.total}</span>
                        <span className="text-xs md:text-sm font-bold text-slate-400 mb-1 md:mb-2">Total de Itens</span>
                      </div>
                      <div className="space-y-4 md:space-y-6">
                        {fleetBreakdown.map((stat, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs md:text-sm font-bold mb-1.5 md:mb-2">
                              <span className="text-slate-500 dark:text-slate-400">{stat.label}</span><span className="text-slate-900 dark:text-white">{stat.value}</span>
                            </div>
                            <div className="w-full h-2 md:h-3 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${stat.color} transition-all duration-700`} style={{ width: `${stat.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleTabChange('fleet')} className="w-full mt-4 md:mt-8 py-3 md:py-4 border-2 border-gray-200 dark:border-neutral-700 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 group">
                      Gerenciar Inventário <ChevronRight size={16} className="md:w-[18px] md:h-[18px] group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* KPIs por Vertical */}
                {kpisPorVertical.length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-4 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white">Taxa de Ocupação</h3>
                      <span className="text-[10px] md:text-xs text-slate-400 font-medium">Por receita</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {kpisPorVertical.map((kpi) => {
                        const Icon = kpi.icon
                        return (
                          <div
                            key={kpi.vertical}
                            className={`relative p-3 md:p-5 rounded-xl md:rounded-2xl border ${kpi.theme.border} ${kpi.theme.bgLight} overflow-hidden transition-all hover:scale-[1.02]`}
                          >
                            {/* Background accent */}
                            <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.theme.bg} opacity-10 rounded-full blur-2xl -translate-y-8 translate-x-8`} />

                            {/* Header */}
                            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 relative">
                              <div className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl ${kpi.theme.bg} text-white`}>
                                <Icon size={16} className="md:w-5 md:h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate">{kpi.label}</h4>
                                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">{kpi.total} eq.</span>
                              </div>
                            </div>

                            {/* Occupation Rate */}
                            <div className="mb-2 md:mb-3 relative">
                              <div className="flex items-baseline gap-1 mb-1.5 md:mb-2">
                                <span className={`text-xl md:text-3xl font-black ${kpi.theme.text}`}>{kpi.taxaOcupacao}%</span>
                              </div>
                              <div className="w-full h-1.5 md:h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${kpi.taxaOcupacao >= 70 ? 'bg-emerald-500' : kpi.taxaOcupacao >= 40 ? 'bg-amber-500' : 'bg-red-400'} transition-all duration-700`}
                                  style={{ width: `${kpi.taxaOcupacao}%` }}
                                />
                              </div>
                            </div>

                            {/* Revenue */}
                            <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-200 dark:border-neutral-700 relative">
                              <span className="text-[10px] md:text-xs text-slate-400 hidden md:inline">Receita</span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">
                                R$ {kpi.receita >= 1000 ? `${(kpi.receita / 1000).toFixed(1)}k` : kpi.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== NEGOCIAÇÕES ===== */}
            {activeTab === 'chat' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 lg:p-8 pb-3 lg:pb-4">
                  <h3 className="text-base md:text-xl font-extrabold text-slate-900 dark:text-white mb-3 md:mb-4 tracking-tight">Mensagens</h3>
                  <div className="relative group">
                    <Search size={16} className="md:w-[18px] md:h-[18px] absolute left-3 top-2.5 md:top-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input type="text" placeholder="Buscar conversa..." value={chatSearch} onChange={e => setChatSearch(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400" />
                  </div>
                </div>
                {chatsDoLocador.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-full inline-block mb-4 border border-gray-200 dark:border-neutral-700"><MessageSquare className="w-12 h-12 text-slate-400" /></div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhuma negociação</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quando clientes enviarem solicitações, aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="px-3 lg:px-6 pb-3 lg:pb-6 space-y-1.5 md:space-y-2">
                    {chatsDoLocador.map(chat => {
                      const prop = chat.proposta_id ? propostaMap.get(chat.proposta_id) : null
                      const statusProposta = prop?.status
                      return (
                        <div key={chat.id} onClick={() => handleOpenChat(chat.id)} className="p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all border border-transparent hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700 hover:scale-[1.01]">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs md:text-sm flex-shrink-0 border border-indigo-200 dark:border-indigo-800">
                                {(chat.locatario_nome || 'C').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white truncate">{chat.locatario_nome || 'Cliente'}</h4>
                                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${
                                  statusProposta === 'pendente' ? 'text-indigo-600 dark:text-indigo-400' : statusProposta === 'aceita' ? 'text-emerald-600 dark:text-emerald-400' : statusProposta === 'finalizada' ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'
                                }`}>
                                  {statusProposta === 'pendente' ? 'Negociação' : statusProposta === 'aceita' ? 'Ativo' : statusProposta === 'finalizada' ? 'Finalizado' : 'Nova'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium flex-shrink-0">{new Date(chat.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1.5 md:mt-2 pl-10 md:pl-[52px]">
                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 truncate flex-1 mr-2">{chat.equipamento?.nome || 'Equipamento'}</p>
                            {statusProposta === 'aceita' ? (
                              <span className="px-1.5 md:px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[9px] md:text-[10px] font-extrabold rounded-full border border-emerald-200 dark:border-emerald-800 flex-shrink-0">Aceita</span>
                            ) : statusProposta === 'pendente' ? (
                              <span className="bg-indigo-600 text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md shadow-indigo-500/30 flex-shrink-0">1</span>
                            ) : statusProposta === 'finalizada' ? (
                              <span className="px-1.5 md:px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 text-slate-500 text-[9px] md:text-[10px] font-extrabold rounded-full border border-gray-200 dark:border-neutral-700 flex-shrink-0">Fim</span>
                            ) : (
                              <span className="px-1.5 md:px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[9px] md:text-[10px] font-extrabold rounded-full border border-blue-200 dark:border-blue-800 flex-shrink-0">Nova</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== MINHA FROTA ===== */}
            {activeTab === 'fleet' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Logística: Cards Para Enviar / Para Devolver */}
                {(equipamentosParaDespachar.length > 0 || equipamentosParaDevolucao.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                    {/* Para Enviar */}
                    {equipamentosParaDespachar.length > 0 && (
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-indigo-200 dark:border-indigo-800 p-4 md:p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                          <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800"><Send size={14} className="md:w-4 md:h-4 text-indigo-600 dark:text-indigo-400" /></div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">Para Enviar</h3>
                          <span className="ml-auto text-[9px] md:text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 md:px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">{equipamentosParaDespachar.length}</span>
                        </div>
                        <div className="space-y-2">
                          {equipamentosParaDespachar.map(eq => {
                            const emUso = equipamentosEmUso.find(eu => eu.equipamento.id === eq.id)
                            const fotoUrl = getImageUrl(eq.fotos?.[0])
                            return (
                              <div key={eq.id} className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white dark:bg-neutral-900 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-neutral-700">
                                  {fotoUrl ? <img src={fotoUrl} alt={eq.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate">{eq.nome}</p>
                                  {emUso && <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 truncate">{emUso.cliente_nome}</p>}
                                </div>
                                {emUso && (
                                  <button
                                    onClick={() => abrirDespachoModal(emUso.proposta_id, eq, emUso.cliente_nome)}
                                    className="px-2 md:px-3 py-1 md:py-1.5 bg-indigo-600 text-white text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl hover:bg-indigo-500 transition-colors flex items-center gap-1 flex-shrink-0 shadow-lg shadow-indigo-500/20"
                                  >
                                    <Send size={10} className="md:w-3 md:h-3" />
                                    <span className="hidden md:inline">Despachar</span>
                                    <span className="md:hidden">Enviar</span>
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Para Devolver */}
                    {equipamentosParaDevolucao.length > 0 && (
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-emerald-200 dark:border-emerald-800 p-4 md:p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                          <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"><RotateCcw size={14} className="md:w-4 md:h-4 text-emerald-600 dark:text-emerald-400" /></div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">Para Devolver</h3>
                          <span className="ml-auto text-[9px] md:text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 md:px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">{equipamentosParaDevolucao.length}</span>
                        </div>
                        <div className="space-y-2">
                          {equipamentosParaDevolucao.map(eq => {
                            const emUso = equipamentosEmUso.find(eu => eu.equipamento.id === eq.id)
                            const fotoUrl = getImageUrl(eq.fotos?.[0])
                            return (
                              <div key={eq.id} className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white dark:bg-neutral-900 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-neutral-700">
                                  {fotoUrl ? <img src={fotoUrl} alt={eq.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate">{eq.nome}</p>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {emUso ? emUso.cliente_nome : (eq.status?.toUpperCase() === 'EM_TRANSITO' ? 'Em trânsito' : 'Em uso')}
                                  </p>
                                </div>
                                <div className="hidden sm:block"><StatusBadge status={eq.status || 'OCUPADO'} /></div>
                                {emUso && (
                                  <button
                                    onClick={() => setEquipamentoParaRetorno(emUso)}
                                    className="px-2 md:px-3 py-1 md:py-1.5 bg-emerald-600 text-white text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl hover:bg-emerald-500 transition-colors flex items-center gap-1 flex-shrink-0 shadow-lg shadow-emerald-500/20"
                                  >
                                    <RotateCcw size={10} className="md:w-3 md:h-3" />
                                    <span className="hidden md:inline">Devolver</span>
                                    <span className="md:hidden">Dev.</span>
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
                  <div className="p-4 lg:p-8 pb-3 lg:pb-4">
                    <div className="relative group max-w-sm">
                      <Search size={16} className="md:w-[18px] md:h-[18px] absolute left-3 top-2.5 md:top-3 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                      <input type="text" placeholder="Buscar equipamento..." value={fleetSearch} onChange={e => setFleetSearch(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400" />
                    </div>
                  </div>

                  {equipamentosFiltrados.length === 0 ? (
                    <div className="text-center py-12 md:py-16">
                      <div className="p-3 md:p-4 bg-gray-100 dark:bg-neutral-800 rounded-full inline-block mb-3 md:mb-4 border border-gray-200 dark:border-neutral-700"><Package className="w-8 h-8 md:w-12 md:h-12 text-slate-400" /></div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum equipamento</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-4">Comece adicionando seu primeiro equipamento.</p>
                      <button onClick={() => openNovoModal()} className="px-4 md:px-6 py-2.5 md:py-3 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all text-sm">
                        <Plus className="w-4 h-4 md:w-5 md:h-5 inline mr-2" />Adicionar
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 lg:px-8 pb-4 lg:pb-6">
                      <div className="space-y-2 md:space-y-3">
                        {equipamentosFiltrados.map(eq => {
                          const emUso = equipamentosEmUso.find(eu => eu.equipamento.id === eq.id)
                          const fotoUrl = getImageUrl(eq.fotos?.[0])
                          return (
                            <div key={eq.id} className="flex items-center gap-2.5 md:gap-4 p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md hover:shadow-indigo-500/5 transition-all group">
                              {/* Foto */}
                              <div className="w-11 h-11 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-white dark:bg-neutral-900 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-neutral-700">
                                {fotoUrl ? <img src={fotoUrl} alt={eq.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 md:w-6 md:h-6 text-slate-400" /></div>}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate">{eq.nome}</p>
                                <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">{eq.categoria}</p>
                                {/* Mobile: mostrar preço e status inline */}
                                <div className="flex items-center gap-2 mt-1 md:hidden">
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[10px]">R$ {eq.preco_diaria?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/dia</span>
                                  <StatusBadge status={eq.status || 'DISPONIVEL'} />
                                </div>
                              </div>

                              {/* Status - Desktop */}
                              <div className="hidden md:block"><StatusBadge status={eq.status || 'DISPONIVEL'} /></div>

                              {/* Diária - Desktop */}
                              <div className="hidden md:block text-right">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">R$ {eq.preco_diaria?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>

                              {/* Cliente - Desktop */}
                              <div className="hidden lg:block w-32 text-right">
                                {emUso ? (
                                  <div>
                                    <p className="text-xs text-slate-900 dark:text-white font-medium truncate">{emUso.cliente_nome}</p>
                                    {emUso.data_fim && <p className="text-[10px] text-slate-500 dark:text-slate-400">Até {new Date(emUso.data_fim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>}
                                  </div>
                                ) : <span className="text-slate-400 text-xs">—</span>}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                                <button onClick={() => handleEditar(eq)} className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white" title="Editar">
                                  <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                {emUso && eq.status?.toUpperCase() === 'RESERVADO' && (
                                  <button onClick={() => abrirDespachoModal(emUso.proposta_id, eq, emUso.cliente_nome)}
                                    className="p-1.5 md:p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors text-indigo-600 dark:text-indigo-400" title="Despachar">
                                    <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                  </button>
                                )}
                                {emUso && (eq.status?.toUpperCase() === 'OCUPADO' || eq.status?.toUpperCase() === 'EM_TRANSITO') && (
                                  <button onClick={() => setEquipamentoParaRetorno(emUso)} className="p-1.5 md:p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors text-emerald-600 dark:text-emerald-400" title="Confirmar Devolução">
                                    <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                  </button>
                                )}
                                <button onClick={() => setEquipamentoParaExcluir(eq)} className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-slate-400 hover:text-red-500 dark:hover:text-red-400" title="Excluir">
                                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== FINANCEIRO ===== */}
            {activeTab === 'finance' && (
              <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Finance KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6">
                  <div className="bg-white dark:bg-neutral-900 rounded-xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-3 md:p-8 shadow-sm relative overflow-hidden hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-xl hover:shadow-emerald-500/10 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-5 blur-3xl rounded-full" />
                    <div className="flex justify-between items-start mb-2 md:mb-4 relative z-10">
                      <div className="p-2 md:p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg md:rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><CreditCard size={16} className="md:w-6 md:h-6" /></div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[9px] md:text-xs font-bold uppercase tracking-wider mb-1">Receita</p>
                    <h3 className="text-lg md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">R$ {financeData.totalRevenue >= 1000 ? `${(financeData.totalRevenue / 1000).toFixed(1)}k` : financeData.totalRevenue.toFixed(0)}</h3>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 rounded-xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-3 md:p-8 shadow-sm relative overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-500/10 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-5 blur-3xl rounded-full" />
                    <div className="flex justify-between items-start mb-2 md:mb-4 relative z-10">
                      <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg md:rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"><BarChart3 size={16} className="md:w-6 md:h-6" /></div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[9px] md:text-xs font-bold uppercase tracking-wider mb-1">Contratos</p>
                    <h3 className="text-lg md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{financeData.totalContracts}</h3>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 rounded-xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-3 md:p-8 shadow-sm relative overflow-hidden hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-xl hover:shadow-purple-500/10 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-5 blur-3xl rounded-full" />
                    <div className="flex justify-between items-start mb-2 md:mb-4 relative z-10">
                      <div className="p-2 md:p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg md:rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"><TrendingUp size={16} className="md:w-6 md:h-6" /></div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[9px] md:text-xs font-bold uppercase tracking-wider mb-1">Média/Dia</p>
                    <h3 className="text-lg md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">R$ {financeData.avgDailyRate.toFixed(0)}</h3>
                  </div>
                </div>

                {/* Chart + Transactions */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
                  {/* Bar Chart */}
                  <div className="xl:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-4 md:p-8 shadow-sm">
                    <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700"><BarChart3 size={16} className="md:w-5 md:h-5 text-slate-500" /></div>
                      Fluxo de Receita
                    </h3>
                    <div className="h-32 md:h-48 flex items-end gap-1.5 md:gap-3">
                      {financeData.monthlyRevenue.map((month, i) => {
                        const maxVal = Math.max(...financeData.monthlyRevenue.map(m => m.value), 1)
                        const heightPct = (month.value / maxVal) * 100
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 md:gap-2">
                            <p className="text-[8px] md:text-[10px] font-bold text-slate-400">{month.value > 0 ? `${(month.value / 1000).toFixed(0)}k` : ''}</p>
                            <div className="w-full relative" style={{ height: '100px' }}>
                              <div className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-lg md:rounded-xl transition-all duration-700 opacity-80 hover:opacity-100" style={{ height: `${Math.max(heightPct, 4)}%` }} />
                            </div>
                            <p className="text-[9px] md:text-[11px] font-bold text-slate-400 capitalize">{month.label.substring(0, 3)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-4 md:p-8 shadow-sm">
                    <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">Transações Recentes</h3>
                    {financeData.recentTransactions.length === 0 ? (
                      <div className="text-center py-6 md:py-8">
                        <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-slate-400 mx-auto mb-2 md:mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">Nenhuma transação</p>
                      </div>
                    ) : (
                      <div className="space-y-2 md:space-y-3">
                        {financeData.recentTransactions.map(tx => {
                          const matchedChat = meusChats.find(c => c.proposta_id === tx.id)
                          const eqNome = matchedChat?.equipamento?.nome || 'Equipamento'
                          const clienteNome = matchedChat?.locatario_nome || 'Cliente'
                          return (
                            <div key={tx.id} className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl md:rounded-2xl border border-gray-200 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${tx.status === 'finalizada' ? 'bg-gray-100 dark:bg-neutral-700 text-slate-500' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                                <CreditCard size={14} className="md:w-[18px] md:h-[18px]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">{eqNome}</p>
                                <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">{clienteNome}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">+R$ {(tx.valor_total || 0).toFixed(0)}</p>
                                <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400">{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== CARTEIRA (WALLET) ===== */}
            {activeTab === 'wallet' && (
              <FinancialWallet
                locacoes={propostas
                  .filter(p => p.status === 'aceita' || p.status === 'finalizada')
                  .map(p => {
                    const chat = meusChats.find(c => c.proposta_id === p.id)
                    const diasLocacao = p.quantidade_dias || 1
                    return {
                      id: p.id,
                      equipamentoNome: chat?.equipamento?.nome || 'Equipamento',
                      clienteNome: chat?.locatario_nome || 'Cliente',
                      valorTotal: p.valor_total || 0,
                      valorDiaria: p.valor_diaria || 0,
                      dataInicio: p.data_inicio || p.created_at.split('T')[0],
                      dataFim: p.data_fim || p.created_at.split('T')[0],
                      diasLocacao,
                      status: p.status === 'finalizada' ? 'finalizada' as const : 'em_andamento' as const,
                      pago: p.status === 'finalizada', // Por enquanto, finalizada = pago
                      dataPagamento: p.status === 'finalizada' ? p.data_fim || undefined : undefined
                    }
                  })
                }
                onMarcarPago={(locacaoId, pago) => handleMarcarPago(locacaoId, pago)}
              />
            )}

            {/* ===== CONTRATOS ===== */}
            {activeTab === 'contracts' && (
              <ContractGenerator
                locadorNome={profile?.nome_empresa || profile?.full_name || ''}
                locadorDoc={profile?.document_id || ''}
              />
            )}

            {/* ===== CALENDÁRIO ===== */}
            {activeTab === 'calendar' && (
              <CalendarioUnificado
                equipamentos={meusEquipamentos}
                propostas={propostas}
                onEquipamentoClick={(id) => {
                  const eq = meusEquipamentos.find(e => e.id === id)
                  if (eq) {
                    setEquipamentoEditando(eq)
                    setShowNovoModal(true)
                  }
                }}
              />
            )}

            {/* ===== MINHA LOJA ===== */}
            {activeTab === 'store' && profile?.tem_loja && (
              <StoreSettingsTab />
            )}
          </>
        )}
      </main>

      {/* ========== MODAIS ========== */}
      <NovoEquipamentoDarkModal
        isOpen={showNovoModal}
        onClose={() => { setShowNovoModal(false); setEquipamentoEditando(null) }}
        onSubmit={handleAddEquipamento}
        onUploadImagens={(files) => uploadImagens(files, user?.id || '')}
        loading={submittingNovo}
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
      <ConfirmarExclusaoModal
        isOpen={!!equipamentoParaExcluir}
        onClose={() => setEquipamentoParaExcluir(null)}
        onConfirmar={handleExcluirConfirmado}
        equipamentoNome={equipamentoParaExcluir?.nome || ''}
        loading={excluindo}
      />
      {/* Wizard de Vistoria Digital (Súmula 492) */}
      <InspectionWizard
        isOpen={inspectionWizardOpen}
        onClose={() => {
          setInspectionWizardOpen(false)
          setDespachoModal(null)
        }}
        onComplete={handleInspectionComplete}
        loading={despachando === despachoModal?.equipamentoId}
        equipamentoNome={despachoModal?.equipamentoNome || 'Equipamento'}
      />
    </div>
  )
}
