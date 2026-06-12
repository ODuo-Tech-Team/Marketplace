import { useState, useEffect } from 'react'
import {
  X, Calendar, MapPin, MessageSquare, ArrowRight,
  ShieldCheck, Loader2, Package, HardHat
} from 'lucide-react'
import { type Equipamento, isLinhaAmarela, ESTADOS_BR } from '../contexts/AppContext'

function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
}

interface SolicitarModalProps {
  isOpen: boolean
  onClose: () => void
  equipamento: Equipamento | null
  onEnviar: (dados: {
    mensagem: string
    quantidadeDias: number
    endereco: { logradouro: string; cep: string; cidade: string; uf: string }
    dataInicio?: string
    dataFim?: string
    precisaOperador?: boolean
  }) => Promise<void>
  loading: boolean
}

export default function SolicitarModal({ isOpen, onClose, equipamento, onEnviar, loading }: SolicitarModalProps) {
  const [mensagem, setMensagem] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [cep, setCep] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [precisaOperador, setPrecisaOperador] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMensagem('')
      setDataInicio('')
      setDataFim('')
      setLogradouro('')
      setCep('')
      setCidade('')
      setUf('')
      setPrecisaOperador(false)
    }
  }, [isOpen])

  const calcDias = (): number => {
    if (!dataInicio || !dataFim) return 0
    const d1 = new Date(dataInicio)
    const d2 = new Date(dataFim)
    return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1)
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
      precisaOperador: precisaOperador || undefined,
    })
  }

  const hoje = new Date().toISOString().split('T')[0]
  const valorEstimado = equipamento ? (equipamento.preco_diaria || 0) * quantidadeDias : 0
  const fotoUrl = getImageUrl(equipamento?.fotos?.[0])
  const isLA = equipamento?.categoria ? isLinhaAmarela(equipamento.categoria) : false

  if (!isOpen || !equipamento) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-gray-100 dark:border-neutral-800 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Glow Decorativo */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-neutral-800 flex-shrink-0">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Solicitar Reserva</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-slate-500 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Resumo do Produto */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700">
            <div className="w-16 h-16 rounded-xl bg-white dark:bg-neutral-700 overflow-hidden flex-shrink-0">
              {fotoUrl ? (
                <img src={fotoUrl} alt={equipamento.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">Voce esta alugando</p>
              <h4 className="text-slate-900 dark:text-white font-bold leading-tight">{equipamento.nome}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">R$ {equipamento.preco_diaria?.toFixed(2)} / dia</p>
            </div>
          </div>

          {/* Periodo */}
          <div>
            <label className="text-xs font-bold text-foreground-secondary uppercase mb-2 block ml-1">Periodo de Uso</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3 focus-within:border-cta/50 focus-within:ring-1 focus-within:ring-cta/20 transition-all">
                <Calendar size={18} className="text-cta flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-foreground-muted font-bold">Inicio</p>
                  <input
                    type="date"
                    value={dataInicio}
                    min={hoje}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="bg-transparent text-foreground text-sm font-bold w-full outline-none"
                    required
                  />
                </div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3 focus-within:border-cta/50 focus-within:ring-1 focus-within:ring-cta/20 transition-all">
                <Calendar size={18} className="text-cta flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-foreground-muted font-bold">Fim</p>
                  <input
                    type="date"
                    value={dataFim}
                    min={dataInicio || hoje}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="bg-transparent text-foreground text-sm font-bold w-full outline-none"
                    required
                  />
                </div>
              </div>
            </div>
            {quantidadeDias > 0 && (
              <p className="text-sm text-foreground-muted mt-2 ml-1">
                {quantidadeDias} dias - Estimativa: <span className="text-cta font-bold">R$ {valorEstimado.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Endereco */}
          <div>
            <label className="text-xs font-bold text-foreground-secondary uppercase mb-2 block ml-1">Local da Entrega (Obra/Evento)</label>
            <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3 focus-within:border-cta/50 focus-within:ring-1 focus-within:ring-cta/20 transition-all mb-3">
              <MapPin size={20} className="text-cta flex-shrink-0" />
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                placeholder="Rua, numero, bairro"
                className="bg-transparent text-foreground text-sm font-bold w-full outline-none placeholder:text-foreground-muted"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="CEP"
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-medium placeholder:text-foreground-muted outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20 transition-all"
              />
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-medium placeholder:text-foreground-muted outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20 transition-all"
              />
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-medium outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20 transition-all"
              >
                <option value="">UF</option>
                {ESTADOS_BR.map(estado => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </div>
          </div>

          {/* Checkbox Operador - Linha Amarela */}
          {isLA && equipamento.oferece_operador && (
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-cta/10 border-2 border-cta/30 rounded-2xl hover:bg-cta/20 transition-colors">
              <input
                type="checkbox"
                checked={precisaOperador}
                onChange={(e) => setPrecisaOperador(e.target.checked)}
                className="w-6 h-6 text-cta rounded-lg focus:ring-cta bg-surface-elevated border-surface-elevated"
              />
              <HardHat className="w-6 h-6 text-cta flex-shrink-0" />
              <span className="text-sm font-bold text-cta">Preciso de operador para esta maquina</span>
            </label>
          )}

          {/* Mensagem */}
          <div>
            <label className="text-xs font-bold text-foreground-secondary uppercase mb-2 block ml-1">Mensagem Inicial</label>
            <div className="bg-surface border border-border rounded-xl p-3 flex items-start gap-3 focus-within:border-cta/50 focus-within:ring-1 focus-within:ring-cta/20 transition-all">
              <MessageSquare size={20} className="text-foreground-muted mt-1 flex-shrink-0" />
              <textarea
                rows={2}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Ola, gostaria de saber se..."
                className="bg-transparent text-foreground text-sm font-medium w-full outline-none placeholder:text-foreground-muted resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !dataInicio || !dataFim}
              className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
              {loading ? 'Enviando...' : 'Solicitar Cotacao'}
            </button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500" /> Sem compromisso. Negocie valores no chat.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
