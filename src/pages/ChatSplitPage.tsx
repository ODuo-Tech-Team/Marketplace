import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth, type Profile } from '../contexts/AuthContext'
import { useApp, type Mensagem, type Chat, type Proposta, type EnderecoEntrega, ESTADOS_BR, isLinhaAmarela } from '../contexts/AppContext'
import { PropostaRecebidaCard } from '../components/chat/PropostaRecebidaCard'
import ReviewCard from '../components/chat/ReviewCard'
import { supabase } from '../lib/supabase'
import {
  Send, Loader2, X, FileText, Check, Truck, MessageCircle, Package,
  ChevronLeft, PartyPopper, ArrowLeft, Search, ExternalLink, Plus, MapPin,
  RefreshCw, HardHat, Paperclip, Clock, Download
} from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { getStatusInfo, isSystemMessage } from '../utils/chat'
import { gerarTermoLocacao } from '../utils/gerarContrato'
import { ChatStatusBar } from '../components/chat/ChatStatusBar'
import TraktoLogo from '../components/TraktoLogo'
import { ContractGeneratorModal } from '../components/ContractGeneratorModal'
import { mapContextToContractData } from '../utils/contractDataMapper'

function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
}

function getChatStatusInfo(chat: Chat | null): { label: string; gradient: string } {
  if (!chat) return { label: 'Chat', gradient: 'from-slate-400 to-slate-500' }
  return getStatusInfo(chat.proposta?.status, chat.equipamento?.status)
}

// ========== MODAL DE PROPOSTA (LOCADOR) ==========
function PropostaModal({
  isOpen,
  onClose,
  onEnviar,
  loading,
  equipamentoNome,
  equipamentoPreco,
  quantidadeDiasSolicitados,
  enderecoEntrega,
  equipamentoCategoria,
  precisaOperador,
  onPreviewChange
}: {
  isOpen: boolean
  onClose: () => void
  onEnviar: (dados: {
    valorDiaria: number
    quantidadeDias: number
    valorFrete: number
    valorTotal: number
    desconto?: number
    taxaExtra?: number
    comOperador?: boolean
    valorOperadorDiaria?: number
  }) => Promise<void>
  loading: boolean
  equipamentoNome?: string
  equipamentoPreco?: number
  quantidadeDiasSolicitados?: number
  enderecoEntrega?: { logradouro?: string; cidade?: string; uf?: string; cep?: string }
  equipamentoCategoria?: string | null
  precisaOperador?: boolean
  onPreviewChange?: (preview: { valorDiaria: number; valorFrete: number; valorTotal: number; dias: number }) => void
}) {
  const [valorDiaria, setValorDiaria] = useState(equipamentoPreco?.toString() || '')
  const [valorFrete, setValorFrete] = useState('')
  const [desconto, setDesconto] = useState('')
  const [taxaExtra, setTaxaExtra] = useState('')
  const [comOperador, setComOperador] = useState(false)
  const [valorOperadorDiaria, setValorOperadorDiaria] = useState('')

  const isLA = equipamentoCategoria ? isLinhaAmarela(equipamentoCategoria) : false

  useEffect(() => {
    if (equipamentoPreco) setValorDiaria(equipamentoPreco.toString())
  }, [equipamentoPreco])

  useEffect(() => {
    if (isOpen) {
      setComOperador(precisaOperador || false)
      setValorOperadorDiaria('')
    }
  }, [isOpen, precisaOperador])

  const valorDiariaNum = parseFloat(valorDiaria) || 0
  const valorFreteNum = parseFloat(valorFrete) || 0
  const descontoNum = parseFloat(desconto) || 0
  const taxaExtraNum = parseFloat(taxaExtra) || 0
  const valorOperadorNum = comOperador ? (parseFloat(valorOperadorDiaria) || 0) : 0
  const quantidadeDiasNum = quantidadeDiasSolicitados || 0

  const subtotalLocacao = valorDiariaNum * quantidadeDiasNum
  const subtotalOperador = valorOperadorNum * quantidadeDiasNum
  const valorTotal = subtotalLocacao + subtotalOperador + valorFreteNum - descontoNum + taxaExtraNum

  // Live preview para sidebar "Resumo do Acordo"
  useEffect(() => {
    if (isOpen && onPreviewChange) {
      onPreviewChange({ valorDiaria: valorDiariaNum, valorFrete: valorFreteNum, valorTotal, dias: quantidadeDiasNum })
    }
  }, [isOpen, valorDiariaNum, valorFreteNum, valorTotal, quantidadeDiasNum, onPreviewChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (valorDiariaNum <= 0) {
      alert('Preencha o valor da diária!')
      return
    }
    await onEnviar({
      valorDiaria: valorDiariaNum,
      quantidadeDias: quantidadeDiasNum,
      valorFrete: valorFreteNum,
      valorTotal,
      desconto: descontoNum > 0 ? descontoNum : undefined,
      taxaExtra: taxaExtraNum > 0 ? taxaExtraNum : undefined,
      comOperador: comOperador || undefined,
      valorOperadorDiaria: valorOperadorNum > 0 ? valorOperadorNum : undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 glass-backdrop flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-border">
        {/* Dark Header */}
        <div className="bg-surface-elevated p-5 flex items-center justify-between border-b border-border-subtle">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cta rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-foreground" />
            </div>
            Gerar Proposta
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-glass-hover rounded-xl transition-colors">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="bg-surface-inset/50 p-4 rounded-2xl border border-border-subtle">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-1">Equipamento</p>
            <p className="font-bold text-foreground">{equipamentoNome || 'Equipamento'}</p>
          </div>

          {(quantidadeDiasSolicitados || enderecoEntrega?.logradouro) && (
            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">Solicitacao do Cliente</p>
              {quantidadeDiasSolicitados && <p className="text-sm text-blue-300 font-medium">{quantidadeDiasSolicitados} dias solicitados</p>}
              {enderecoEntrega?.logradouro && (
                <p className="text-sm text-blue-300">{enderecoEntrega.logradouro}, {enderecoEntrega.cidade}/{enderecoEntrega.uf}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">Valor Diaria (R$) *</label>
            <input
              type="number"
              step="0.01"
              value={valorDiaria}
              onChange={(e) => setValorDiaria(e.target.value)}
              className="w-full px-4 py-3 bg-surface-inset/50 border border-border rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-all text-foreground placeholder:text-foreground-muted"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">Valor Frete (R$)</label>
            <input
              type="number"
              step="0.01"
              value={valorFrete}
              onChange={(e) => setValorFrete(e.target.value)}
              className="w-full px-4 py-3 bg-surface-inset/50 border border-border rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-all text-foreground placeholder:text-foreground-muted"
              placeholder="0.00 = Frete Gratis"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">Desconto (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className="w-full px-4 py-3 bg-surface-inset/50 border border-border rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-all text-foreground placeholder:text-foreground-muted"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">Taxa Extra (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxaExtra}
                onChange={(e) => setTaxaExtra(e.target.value)}
                className="w-full px-4 py-3 bg-surface-inset/50 border border-border rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-all text-foreground placeholder:text-foreground-muted"
                placeholder="0.00"
              />
            </div>
          </div>

          {isLA && (
            <div className={`p-4 rounded-2xl border-2 space-y-3 ${precisaOperador ? 'bg-cta/20 border-cta/40' : 'bg-cta/10 border-cta/20'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={comOperador}
                  onChange={(e) => setComOperador(e.target.checked)}
                  className="w-5 h-5 text-cta rounded focus:ring-cta"
                />
                <HardHat className="w-5 h-5 text-cta" />
                <span className="text-sm font-bold text-cta">Incluir Operador</span>
                {precisaOperador && (
                  <span className="text-[10px] bg-cta text-white px-2.5 py-0.5 rounded-full font-bold ml-auto uppercase tracking-wider">Solicitado</span>
                )}
              </label>
              {comOperador && (
                <div className="ml-8">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">Custo do Operador (R$ por dia)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorOperadorDiaria}
                    onChange={(e) => setValorOperadorDiaria(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-inset/50 border border-cta/20 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-cta outline-none"
                    placeholder="200.00"
                  />
                  {valorOperadorNum > 0 && quantidadeDiasNum > 0 && (
                    <p className="text-xs text-cta mt-1.5 font-medium">
                      Subtotal operador: R$ {subtotalOperador.toFixed(2)} ({quantidadeDiasNum}d)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-surface-inset/50 p-5 rounded-2xl space-y-2 border border-border-subtle">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-secondary">Locacao ({quantidadeDiasNum}d x R$ {valorDiariaNum.toFixed(2)})</span>
              <span className="font-bold text-foreground-secondary">R$ {subtotalLocacao.toFixed(2)}</span>
            </div>
            {subtotalOperador > 0 && (
              <div className="flex justify-between text-sm text-cta">
                <span>Operador ({quantidadeDiasNum}d x R$ {valorOperadorNum.toFixed(2)})</span>
                <span className="font-bold">+ R$ {subtotalOperador.toFixed(2)}</span>
              </div>
            )}
            {valorFreteNum > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Frete</span>
                <span className="font-bold text-foreground-secondary">R$ {valorFreteNum.toFixed(2)}</span>
              </div>
            )}
            {descontoNum > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Desconto</span>
                <span className="font-bold">- R$ {descontoNum.toFixed(2)}</span>
              </div>
            )}
            {taxaExtraNum > 0 && (
              <div className="flex justify-between text-sm text-cta">
                <span>Taxa Extra</span>
                <span className="font-bold">+ R$ {taxaExtraNum.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-border-subtle mt-3">
              <span className="font-black text-foreground">TOTAL</span>
              <span className="text-2xl font-black text-green-400 font-tech">R$ {valorTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-glass-hover text-foreground-secondary font-bold rounded-xl hover:bg-glass-hover transition-colors border border-border-subtle">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || valorTotal <= 0}
              className="flex-1 py-3.5 bg-cta text-white font-bold rounded-xl hover:bg-cta disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-cta/20 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ========== MODAL DE SUCESSO (LOCATÁRIO) ==========
function SucessoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 glass-backdrop flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-sm text-center p-8 border border-border">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <PartyPopper className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-xl font-black text-foreground mb-2">Proposta Aceita!</h2>
        <p className="text-foreground-secondary mb-6">O locador irá preparar a entrega do equipamento.</p>
        <button onClick={onClose} className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 shadow-lg shadow-green-600/20 transition-all">
          Entendido
        </button>
      </div>
    </div>
  )
}

// ========== MODAL DE NOTIFICAÇÃO (LOCADOR) ==========
function NotificacaoLocadorModal({ isOpen, onClose, onIrParaFrota }: {
  isOpen: boolean
  onClose: () => void
  onIrParaFrota: () => void
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 glass-backdrop flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-sm text-center p-8 border border-border">
        <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <Truck className="w-10 h-10 text-purple-400" />
        </div>
        <h2 className="text-xl font-black text-foreground mb-2">Proposta Aceita!</h2>
        <p className="text-foreground-secondary mb-6">
          O cliente aceitou sua proposta. Gerencie o despacho e entrega do equipamento em Minha Frota.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onIrParaFrota}
            className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            Ir para Minha Frota
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-foreground-muted font-medium rounded-xl hover:text-foreground transition-colors"
          >
            Continuar no Chat
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== LISTA DE CONVERSAS ==========
function ChatList({
  chats,
  loading,
  selectedChatId,
  onSelectChat,
  userId,
  searchTerm,
  onSearchChange,
  onBack
}: {
  chats: Chat[]
  loading: boolean
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  userId: string | undefined
  searchTerm: string
  onSearchChange: (value: string) => void
  onBack: () => void
}) {
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true
    const termo = searchTerm.toLowerCase()
    const isLocador = chat.locador_id === userId
    const outraParte = isLocador ? chat.locatario_nome : chat.locador_nome
    return outraParte?.toLowerCase().includes(termo) || chat.equipamento?.nome?.toLowerCase().includes(termo)
  })

  return (
    <div className="h-full flex flex-col bg-surface-sidebar">
      {/* Header */}
      <div className="p-5 border-b border-border-subtle">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-glass-hover rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
          </button>
          <h2 className="text-xl font-black text-foreground">Mensagens</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar conversa..."
            className="w-full pl-10 pr-4 py-2.5 bg-glass-hover border border-border rounded-xl text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-cta focus:border-cta transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-foreground-muted" />
            <p className="text-sm text-foreground-muted font-medium">Nenhuma conversa</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {filteredChats.map((chat) => {
              const isSelected = chat.id === selectedChatId
              const isLocador = chat.locador_id === userId
              const outraParte = isLocador ? chat.locatario_nome : chat.locador_nome
              const temNaoLida = chat.ultima_mensagem && !chat.ultima_mensagem_lida && chat.ultima_mensagem_sender_id !== userId

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full p-4 flex items-center gap-3.5 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-glass-hover ring-1 ring-border'
                      : temNaoLida
                        ? 'bg-glass-hover hover:bg-glass-hover'
                        : 'hover:bg-glass-hover'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-foreground-secondary font-bold text-lg border border-border">
                      {(outraParte || 'C').charAt(0).toUpperCase()}
                    </div>
                    {temNaoLida && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cta rounded-full border-2 border-surface-sidebar" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm truncate ${temNaoLida ? 'font-bold text-foreground' : 'font-semibold text-foreground-secondary'}`}>
                        {outraParte || 'Cliente'}
                      </h3>
                      {chat.ultima_mensagem_data && (
                        <span className="text-[10px] text-foreground-muted flex-shrink-0 font-medium">
                          {new Date(chat.ultima_mensagem_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground-muted truncate font-medium">{chat.equipamento?.nome}</p>
                    {chat.ultima_mensagem && (
                      <p className={`text-xs truncate mt-0.5 ${temNaoLida ? 'text-foreground font-medium' : 'text-foreground-muted'}`}>
                        {chat.ultima_mensagem}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ========== SIDEBAR DE DETALHES DA LOCAÇÃO ==========
function NegociacaoSidebar({
  chat,
  proposta,
  isLocador,
  isLocatario,
  podeGerarProposta,
  podeGerarContrato,
  isReLocacao,
  onGerarProposta,
  onGerarContrato,
  onAceitarProposta,
  onRecusarProposta,
  respondendo,
  propostaPreview
}: {
  chat: Chat | null
  proposta: Proposta | null
  isLocador: boolean
  isLocatario: boolean
  podeGerarProposta: boolean
  podeGerarContrato: boolean
  isReLocacao: boolean
  onGerarProposta: () => void
  onGerarContrato: () => void
  onAceitarProposta: () => void
  onRecusarProposta: () => void
  respondendo: boolean
  propostaPreview?: { valorDiaria: number; valorFrete: number; valorTotal: number; dias: number } | null
}) {
  if (!chat) return null

  const equipamento = chat.equipamento
  const fotoUrl = getImageUrl(equipamento?.fotos?.[0])
  const eqStatus = equipamento?.status?.toUpperCase()

  const getStatusStep = () => {
    if (proposta?.status === 'finalizada') return 4
    if (eqStatus === 'OCUPADO' || eqStatus === 'EM_TRANSITO') return 3
    if (eqStatus === 'RESERVADO' || proposta?.status === 'aceita') return 2
    if (proposta?.status === 'pendente') return 1
    return 0
  }
  const step = getStatusStep()

  return (
    <div className="h-full flex flex-col bg-surface-sidebar border-l border-border-subtle">
      {/* Header */}
      <div className="p-5 border-b border-border-subtle">
        <h3 className="font-black text-foreground text-lg font-tech">Resumo do Acordo</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Equipamento */}
        <div className="bg-surface-inset/50 rounded-2xl p-4 border border-border-subtle">
          <div className="flex gap-3.5">
            <div className="w-16 h-16 rounded-xl bg-surface-elevated overflow-hidden flex-shrink-0">
              {fotoUrl ? (
                <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-foreground-muted" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">{equipamento?.nome}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mt-0.5">{equipamento?.categoria}</p>
              {equipamento?.preco_diaria && (
                <p className="text-cta font-black mt-1.5 font-tech">R$ {equipamento.preco_diaria.toFixed(2)}/dia</p>
              )}
            </div>
          </div>
        </div>

        {/* Stepper de Status */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted font-tech">Status</p>
          <div className="space-y-1.5">
            {(isLocador ? ['Proposta Enviada', 'Reservado', 'Em Uso', 'Devolvido'] : ['Proposta Enviada', 'Reservado']).map((label, i) => {
              const stepIndex = i + 1
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    stepIndex < step ? 'bg-green-500 text-white' : stepIndex === step ? 'bg-foreground text-surface' : 'bg-surface-elevated text-foreground-muted'
                  }`}>
                    {stepIndex < step ? '\u2713' : i + 1}
                  </div>
                  <span className={`text-sm ${stepIndex <= step ? 'text-foreground font-semibold' : 'text-foreground-muted'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Valores da Proposta (ou Preview do rascunho) */}
        {(proposta || propostaPreview) && (() => {
          const isPreview = !!propostaPreview
          const diaria = isPreview ? propostaPreview.valorDiaria : proposta?.valor_diaria
          const dias = isPreview ? propostaPreview.dias : proposta?.quantidade_dias
          const frete = isPreview ? propostaPreview.valorFrete : proposta?.valor_frete
          const total = isPreview ? propostaPreview.valorTotal : proposta?.valor_total
          return (
            <div className={`rounded-2xl p-4 space-y-2 border ${isPreview ? 'bg-cta/10 border-cta/20' : 'bg-surface-inset/50 border-border-subtle'}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted font-tech">Valores</p>
                {isPreview && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-cta bg-cta/20 px-2 py-0.5 rounded-full animate-pulse">Rascunho</span>
                )}
              </div>
              {diaria != null && diaria > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Diária</span>
                  <span className="font-bold text-foreground-secondary font-tech">R$ {diaria.toFixed(2)}</span>
                </div>
              )}
              {dias != null && dias > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Dias</span>
                  <span className="font-bold text-foreground-secondary font-tech">{dias}</span>
                </div>
              )}
              {frete != null && frete > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Frete</span>
                  <span className="font-bold text-foreground-secondary font-tech">R$ {frete.toFixed(2)}</span>
                </div>
              )}
              {frete != null && frete === 0 && !isPreview && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Frete</span>
                  <span className="font-bold text-green-400 font-tech">Grátis</span>
                </div>
              )}
              {total != null && total > 0 && (
                <div className="flex justify-between pt-3 border-t border-border-subtle mt-3">
                  <span className="font-black text-foreground">Total</span>
                  <span className={`text-lg font-black font-tech ${isPreview ? 'text-cta animate-pulse' : 'text-green-400'}`}>R$ {total.toFixed(2)}</span>
                </div>
              )}
            </div>
          )
        })()}

        {/* Endereço de Entrega */}
        {chat.endereco_entrega_logradouro && (
          <div className="bg-surface-inset/50 rounded-2xl p-4 space-y-2 border border-border-subtle">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Entrega
            </p>
            <p className="text-sm text-foreground font-medium">{chat.endereco_entrega_logradouro}</p>
            <p className="text-xs text-foreground-muted">
              {chat.endereco_entrega_cidade}/{chat.endereco_entrega_uf} - CEP: {chat.endereco_entrega_cep}
            </p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="p-4 border-t border-border-subtle space-y-2">
        {isReLocacao && isLocador && (
          <div className="bg-glass-hover border border-border-subtle rounded-2xl p-4 text-center">
            <p className="text-foreground-secondary font-bold text-sm">Ciclo Finalizado</p>
            <p className="text-foreground-muted text-xs mt-1">Equipamento disponivel - voce pode gerar uma nova locacao</p>
          </div>
        )}
        {podeGerarProposta && (
          <button
            onClick={onGerarProposta}
            className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
              isReLocacao
                ? 'bg-cta-hover hover:bg-cta-hover text-white shadow-cta/20'
                : proposta?.status === 'pendente'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                  : 'bg-cta hover:bg-cta text-white shadow-cta/20'
            }`}
          >
            {isReLocacao ? (
              <RefreshCw className="w-5 h-5" />
            ) : proposta?.status === 'pendente' ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {isReLocacao ? 'Nova Locação' : proposta?.status === 'pendente' ? 'Editar Proposta' : 'Gerar Proposta'}
          </button>
        )}

        {isLocatario && proposta?.status === 'pendente' && (
          <div className="flex gap-2">
            <button
              onClick={onRecusarProposta}
              disabled={respondendo}
              className="flex-1 py-3.5 bg-glass-hover text-foreground-secondary font-bold rounded-xl hover:bg-glass-hover disabled:opacity-50 transition-colors border border-border-subtle"
            >
              Recusar
            </button>
            <button
              onClick={onAceitarProposta}
              disabled={respondendo}
              className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all"
            >
              {respondendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Aceitar
            </button>
          </div>
        )}

        {/* Botão Gerar Contrato PDF - APENAS LOCADOR */}
        {isLocador && podeGerarContrato && (
          <button
            onClick={onGerarContrato}
            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Download className="w-5 h-5" />
            Baixar Termo de Locação
          </button>
        )}

        {/* LOCADOR: Status e ações em Minha Frota */}
        {isLocador && eqStatus === 'RESERVADO' && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center space-y-2">
            <p className="text-purple-400 font-bold text-sm">Equipamento Reservado</p>
            <p className="text-purple-500/60 text-xs">Gerencie o despacho em Minha Frota</p>
          </div>
        )}

        {isLocador && (eqStatus === 'OCUPADO' || eqStatus === 'EM_TRANSITO') && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
            <p className="text-green-400 font-bold text-sm">Em Uso</p>
            <p className="text-green-500/60 text-xs mt-1">Gerencie a devolução em Minha Frota</p>
          </div>
        )}

        {proposta?.status === 'aceita' && eqStatus === 'RESERVADO' && !isLocador && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
            <p className="text-blue-400 font-bold text-sm">Reservado</p>
            <p className="text-blue-500/60 text-xs mt-1">Aguardando despacho do locador</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ========== MODAL EQUIPAMENTO ==========
function EquipamentoModal({
  isOpen,
  onClose,
  equipamento
}: {
  isOpen: boolean
  onClose: () => void
  equipamento?: Chat['equipamento']
}) {
  if (!isOpen || !equipamento) return null

  const fotoUrl = getImageUrl(equipamento.fotos?.[0])

  return (
    <div className="fixed inset-0 glass-backdrop flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-border">
        <div className="bg-surface-elevated p-5 flex items-center justify-between border-b border-border-subtle">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cta rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-foreground" />
            </div>
            Detalhes do Equipamento
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-glass-hover rounded-xl transition-colors">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-5rem)]">
          {fotoUrl && (
            <div className="w-full h-48 rounded-2xl overflow-hidden bg-surface-inset">
              <img src={fotoUrl} alt={equipamento.nome} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h3 className="text-xl font-black text-foreground">{equipamento.nome}</h3>
            {equipamento.categoria && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mt-1">{equipamento.categoria}</p>
            )}
          </div>

          {equipamento.preco_diaria && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Diaria</p>
              <p className="text-2xl font-black text-green-400 mt-1 font-tech">R$ {equipamento.preco_diaria.toFixed(2)}</p>
            </div>
          )}

          {equipamento.descricao && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-2">Descricao</p>
              <p className="text-sm text-foreground-secondary leading-relaxed">{equipamento.descricao}</p>
            </div>
          )}

          {(equipamento.ano || equipamento.horimetro_atual || equipamento.peso_operacional) && (
            <div className="bg-surface-inset/50 rounded-2xl p-4 space-y-2 border border-border-subtle">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Ficha Tecnica</p>
              {equipamento.ano && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Ano</span>
                  <span className="font-bold text-foreground-secondary">{equipamento.ano}</span>
                </div>
              )}
              {equipamento.horimetro_atual && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Horimetro</span>
                  <span className="font-bold text-foreground-secondary">{equipamento.horimetro_atual.toLocaleString('pt-BR')}h</span>
                </div>
              )}
              {equipamento.peso_operacional && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Peso Operacional</span>
                  <span className="font-bold text-foreground-secondary">{equipamento.peso_operacional}t</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-glass-hover text-foreground-secondary font-bold rounded-xl hover:bg-glass-hover transition-colors border border-border-subtle"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== COMPONENTE PRINCIPAL ==========
export default function ChatSplitPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const {
    fetchMeusChats,
    fetchMensagens,
    enviarMensagem,
    fetchChat,
    enviarProposta,
    responderProposta,
    marcarMensagensComoLidas
  } = useApp()

  const [chats, setChats] = useState<Chat[]>([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [chat, setChat] = useState<Chat | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [modalPropostaOpen, setModalPropostaOpen] = useState(false)
  const [enviandoProposta, setEnviandoProposta] = useState(false)
  const [respondendoProposta, setRespondendoProposta] = useState(false)
  const [modalSucessoOpen, setModalSucessoOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showList, setShowList] = useState(!chatId)
  const [modalEquipamentoOpen, setModalEquipamentoOpen] = useState(false)
  const [modalPropostaRecebidaOpen, setModalPropostaRecebidaOpen] = useState(false)
  const [propostaPreview, setPropostaPreview] = useState<{
    valorDiaria: number; valorFrete: number; valorTotal: number; dias: number
  } | null>(null)
  const [contratoModalOpen, setContratoModalOpen] = useState(false)
  const [locatarioProfile, setLocatarioProfile] = useState<Profile | null>(null)
  const [notificacaoLocadorOpen, setNotificacaoLocadorOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevStatusRef = useRef<string | undefined>(undefined)

  const nomeUsuario = profile?.nome_empresa || profile?.full_name || 'Perfil'
  const isLocador = profile?.tipo_usuario === 'locador'

  const normalizeId = (id: string | undefined | null): string => String(id || '').toLowerCase().trim()
  const userId = normalizeId(user?.id)
  const locadorId = normalizeId(chat?.locador_id)
  const locatarioId = normalizeId(chat?.locatario_id)
  const isUserLocador = userId !== '' && locadorId !== '' && userId === locadorId
  const isUserLocatario = userId !== '' && locatarioId !== '' && userId === locatarioId

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Locatário: abre modal de proposta recebida
  useEffect(() => {
    if (chat && isUserLocatario && chat.proposta?.status === 'pendente') {
      setModalPropostaRecebidaOpen(true)
    }
  }, [chat?.proposta?.status, isUserLocatario])

  // Locador: detecta quando equipamento fica RESERVADO e mostra notificação
  useEffect(() => {
    if (!chat || !isUserLocador) return

    const currentStatus = chat.equipamento?.status?.toUpperCase()
    const previousStatus = prevStatusRef.current

    // Se mudou de outro status para RESERVADO, mostra o modal
    if (previousStatus && previousStatus !== 'RESERVADO' && currentStatus === 'RESERVADO') {
      setNotificacaoLocadorOpen(true)
    }

    prevStatusRef.current = currentStatus
  }, [chat?.equipamento?.status, isUserLocador])

  const carregarChats = async () => {
    if (!user) return
    const data = await fetchMeusChats(user.id)
    if (mountedRef.current) {
      setChats(data)
      setLoadingChats(false)
    }
  }

  const carregarChat = async (id: string) => {
    if (!mountedRef.current) return
    try {
      const chatData = await fetchChat(id)
      if (mountedRef.current) setChat(chatData)
    } catch (err) {
      console.error('[ChatSplitPage] Erro ao carregar chat:', err)
    }
  }

  const carregarMensagens = async (id: string) => {
    if (!mountedRef.current) return
    try {
      const msgs = await fetchMensagens(id)
      if (!mountedRef.current) return
      setMensagens(msgs)
      if (user?.id) marcarMensagensComoLidas(id, user.id)
    } catch (err) {
      console.error('[ChatSplitPage] Erro ao carregar mensagens:', err)
    }
  }

  const handleSelectChat = (id: string) => {
    navigate(`/chats/${id}`)
    setShowList(false)
  }

  useEffect(() => {
    mountedRef.current = true
    carregarChats()
    return () => { mountedRef.current = false }
  }, [user])

  useEffect(() => {
    if (!chatId) {
      setChat(null)
      setMensagens([])
      setShowList(true)
      return
    }

    setLoadingChat(true)
    setChat(null)
    setMensagens([])

    Promise.all([carregarChat(chatId), carregarMensagens(chatId)]).then(() => {
      if (mountedRef.current) setLoadingChat(false)
    })

    const channel: RealtimeChannel = supabase
      .channel(`mensagens-chat-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          if (!mountedRef.current) return
          const novaMsgRealtime = payload.new as Mensagem
          setMensagens(prev => {
            if (prev.some(m => m.id === novaMsgRealtime.id)) return prev
            return [...prev, novaMsgRealtime]
          })
          if (user?.id && novaMsgRealtime.sender_id !== user.id) {
            marcarMensagensComoLidas(chatId, user.id)
            // Recarrega chat para capturar mudanças de status (proposta, equipamento)
            await carregarChat(chatId)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[ChatSplitPage] Mensagens realtime conectado:', chatId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[ChatSplitPage] Erro na subscription de mensagens')
        }
      })

    const propostasChannel: RealtimeChannel = supabase
      .channel(`propostas-chat-${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'propostas' },
        async () => { if (mountedRef.current) await carregarChat(chatId) }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[ChatSplitPage] Erro na subscription de propostas')
        }
      })

    const chatUpdateChannel: RealtimeChannel = supabase
      .channel(`chat-update-${chatId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats', filter: `id=eq.${chatId}` },
        async () => { if (mountedRef.current) await carregarChat(chatId) }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[ChatSplitPage] Erro na subscription de chat updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(propostasChannel)
      supabase.removeChannel(chatUpdateChannel)
    }
  }, [chatId])

  // Recarrega mensagens quando a aba volta a ficar visível (fallback para realtime)
  useEffect(() => {
    if (!chatId) return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        carregarMensagens(chatId)
        carregarChat(chatId)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [chatId])

  useEffect(() => { scrollToBottom() }, [mensagens])

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMensagem.trim() || !chatId || !user) return
    setEnviando(true)
    const result = await enviarMensagem(chatId, user.id, novaMensagem.trim())
    if (result.success) {
      setNovaMensagem('')
      await carregarMensagens(chatId)
      marcarMensagensComoLidas(chatId, user.id)
    }
    setEnviando(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleEnviarProposta = async (dados: {
    valorDiaria: number
    quantidadeDias: number
    valorFrete: number
    valorTotal: number
    desconto?: number
    taxaExtra?: number
    comOperador?: boolean
    valorOperadorDiaria?: number
  }) => {
    if (!chatId || !user || !chat) return
    setEnviandoProposta(true)
    const equipamentoId = chat.equipamento?.id || chat.proposta?.equipamento_id
    if (!equipamentoId) { setEnviandoProposta(false); return }

    // Calcula data_inicio (amanhã) e data_fim baseado em quantidade_dias
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() + 1) // Começa amanhã
    const dataFim = new Date(dataInicio)
    dataFim.setDate(dataFim.getDate() + (dados.quantidadeDias - 1))

    const result = await enviarProposta(chatId, user.id, {
      equipamento_id: equipamentoId,
      valor_diaria: dados.valorDiaria,
      quantidade_dias: dados.quantidadeDias,
      valor_frete: dados.valorFrete,
      valor_total: dados.valorTotal,
      desconto: dados.desconto,
      taxa_extra: dados.taxaExtra,
      com_operador: dados.comOperador,
      valor_operador_diaria: dados.valorOperadorDiaria,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0],
    })

    if (result.success) {
      setModalPropostaOpen(false)
      await carregarMensagens(chatId)
      await carregarChat(chatId)
    }
    setEnviandoProposta(false)
  }

  const handleAceitarProposta = async (endereco?: { logradouro: string; cep: string; cidade: string; uf: string }) => {
    if (!chatId || !user || !chat?.proposta) return
    setRespondendoProposta(true)

    const enderecoFinal = endereco || (chat.endereco_entrega_logradouro ? {
      cep: chat.endereco_entrega_cep || '',
      logradouro: chat.endereco_entrega_logradouro,
      cidade: chat.endereco_entrega_cidade || '',
      uf: chat.endereco_entrega_uf || ''
    } : undefined)

    const result = await responderProposta(chat.proposta.id, chatId, true, user.id, enderecoFinal)
    setRespondendoProposta(false)

    if (result.success) {
      setModalPropostaRecebidaOpen(false)
      setModalSucessoOpen(true)
      await carregarChat(chatId)
    }
  }

  const handleRecusarProposta = async () => {
    if (!chatId || !user || !chat?.proposta) return
    setRespondendoProposta(true)
    const result = await responderProposta(chat.proposta.id, chatId, false, user.id)
    setRespondendoProposta(false)
    if (result.success) {
      setModalPropostaRecebidaOpen(false)
      await carregarChat(chatId)
    }
  }

  const handleGerarContrato = async () => {
    if (!chat || !chat.proposta || !chat.equipamento || !profile) return

    // Fetch locatario profile
    const { data: locatarioPerfil } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', chat.locatario_id)
      .single()

    setLocatarioProfile(locatarioPerfil)
    setContratoModalOpen(true)
  }

  // Condição para mostrar botão de contrato: proposta aceita (reservado ou em uso)
  const podeGerarContrato = chat?.proposta?.status === 'aceita' ||
    chat?.equipamento?.status?.toUpperCase() === 'RESERVADO' ||
    chat?.equipamento?.status?.toUpperCase() === 'OCUPADO' ||
    chat?.equipamento?.status?.toUpperCase() === 'EM_TRANSITO'

  const formatarHora = (dateStr: string) => new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const formatarData = (dateStr: string) => {
    const data = new Date(dateStr)
    const hoje = new Date()
    if (data.toDateString() === hoje.toDateString()) return 'Hoje'
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)
    if (data.toDateString() === ontem.toDateString()) return 'Ontem'
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Filtra mensagens de sistema — status é exibido na ChatStatusBar
  const mensagensFiltradas = mensagens.filter(msg => !isSystemMessage(msg.sender_id, msg.texto))

  const mensagensAgrupadas = mensagensFiltradas.reduce((acc, msg) => {
    const data = formatarData(msg.created_at)
    if (!acc[data]) acc[data] = []
    acc[data].push(msg)
    return acc
  }, {} as Record<string, Mensagem[]>)

  const outraParte = isUserLocador ? chat?.locatario_nome : chat?.locador_nome
  const statusInfo = getChatStatusInfo(chat)

  // Lógica de re-locação: equipamento devolvido = locador pode gerar nova proposta
  const eqDisponivel = chat?.equipamento?.status?.toUpperCase() === 'DISPONIVEL'
  const propostaFinalizada = chat?.proposta?.status === 'finalizada'
  const isReLocacao = propostaFinalizada || (chat?.proposta?.status === 'aceita' && eqDisponivel)
  const podeGerarProposta = isUserLocador && (!chat?.proposta || chat?.proposta?.status !== 'aceita' || eqDisponivel)

  return (
    <div className="h-screen bg-surface flex flex-col">
      {/* ========== SLIM HEADER ========== */}
      <header className="h-14 bg-glass-bg backdrop-blur-md border-b border-border-subtle flex-shrink-0 px-5 flex items-center justify-between">
        <Link to="/">
          <TraktoLogo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-foreground">{nomeUsuario}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">{isLocador ? 'LOCADOR' : 'LOCATÁRIO'}</p>
          </div>
          <div className="w-9 h-9 bg-glass-hover rounded-full flex items-center justify-center border border-border">
            <span className="text-foreground-secondary font-bold text-sm">{nomeUsuario.charAt(0).toUpperCase()}</span>
          </div>
          <button onClick={signOut} className="text-sm text-foreground-muted hover:text-foreground font-medium transition-colors">Sair</button>
        </div>
      </header>

      {/* ========== MAIN - CARD CONTAINER ========== */}
      <div className="flex-1 flex overflow-hidden lg:p-4">
        <div className="flex-1 flex overflow-hidden bg-surface-card lg:rounded-[2rem] lg:shadow-2xl lg:shadow-t-shadow lg:border lg:border-border-subtle">
          {/* Coluna 1: Lista de Conversas */}
          <aside className={`${chatId ? 'hidden lg:block lg:w-80' : 'w-full lg:w-80'} flex-shrink-0 border-r border-border-subtle`}>
            <ChatList
              chats={chats}
              loading={loadingChats}
              selectedChatId={chatId || null}
              onSelectChat={handleSelectChat}
              userId={user?.id}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onBack={() => navigate('/')}
            />
          </aside>

          {/* Coluna 2: Chat */}
          <main className={`${chatId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}>
            {!chatId ? (
              <div className="flex-1 flex items-center justify-center bg-surface/50">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-glass-hover rounded-full flex items-center justify-center mx-auto mb-5 border border-border-subtle">
                    <MessageCircle className="w-10 h-10 text-foreground-muted" />
                  </div>
                  <h3 className="text-lg font-black text-foreground-secondary mb-2">Selecione uma conversa</h3>
                  <p className="text-foreground-muted text-sm">Escolha uma conversa da lista</p>
                </div>
              </div>
            ) : loadingChat ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-foreground-secondary" />
              </div>
            ) : !chat ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-glass-hover rounded-full flex items-center justify-center mb-5 border border-border-subtle">
                  <Package className="w-10 h-10 text-foreground-muted" />
                </div>
                <h2 className="text-lg font-black text-foreground-secondary mb-2">Chat não encontrado</h2>
                <button onClick={() => navigate('/chats')} className="px-5 py-2.5 bg-cta text-white rounded-xl font-bold shadow-lg shadow-cta/20">
                  Voltar
                </button>
              </div>
            ) : (
              <>
                {/* Chat Header - Premium */}
                <div className="h-20 bg-surface-card border-b border-border-subtle px-5 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowList(true)}
                      className="lg:hidden p-2 hover:bg-glass-hover rounded-xl transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
                    </button>
                    {/* Avatar with online dot */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-foreground-secondary font-bold text-lg border border-border">
                        {(outraParte || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-[3px] border-surface-card" />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground text-lg">{outraParte || 'Cliente'}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r font-tech ${statusInfo.gradient}`}>
                          <Clock className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Botão Gerar/Editar Proposta (visível quando sidebar oculta) - APENAS LOCADOR */}
                    {isUserLocador && podeGerarProposta && (
                      <button
                        onClick={() => setModalPropostaOpen(true)}
                        className={`xl:hidden px-3 md:px-4 py-2 md:py-2.5 font-bold rounded-xl text-xs md:text-sm flex items-center gap-1 md:gap-1.5 shadow-lg transition-all ${
                          isReLocacao
                            ? 'bg-cta-hover hover:bg-cta-hover text-white shadow-cta/20'
                            : chat?.proposta?.status === 'pendente'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                              : 'bg-cta hover:bg-cta text-white shadow-cta/20'
                        }`}
                      >
                        {isReLocacao ? (
                          <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        )}
                        {isReLocacao ? 'Nova Locação' : chat?.proposta?.status === 'pendente' ? 'Editar' : 'Proposta'}
                      </button>
                    )}
                    {/* Botões aceitar/recusar para locatário */}
                    {isUserLocatario && chat?.proposta?.status === 'pendente' && (
                      <div className="xl:hidden flex items-center gap-1.5">
                        <button
                          onClick={handleRecusarProposta}
                          disabled={respondendoProposta}
                          className="px-2 md:px-3 py-2 md:py-2.5 bg-glass-hover text-foreground-secondary font-bold rounded-xl hover:bg-glass-hover text-xs md:text-sm disabled:opacity-50 transition-colors border border-border-subtle"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => handleAceitarProposta()}
                          disabled={respondendoProposta}
                          className="px-2 md:px-3 py-2 md:py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 text-xs md:text-sm disabled:opacity-50 flex items-center gap-1 shadow-lg shadow-green-600/20 transition-all"
                        >
                          {respondendoProposta ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                          Aceitar
                        </button>
                      </div>
                    )}
                    {/* Botão Gerar Contrato PDF - APENAS LOCADOR */}
                    {isUserLocador && podeGerarContrato && (
                      <button
                        onClick={handleGerarContrato}
                        className="px-2 md:px-3 py-2 md:py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 text-xs md:text-sm flex items-center gap-1 md:gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
                        title="Baixar Termo de Locação"
                      >
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Contrato</span>
                      </button>
                    )}
                    {/* Botão Minha Frota (Locador) ou Ver Equipamento (Locatário) */}
                    <button
                      onClick={() => isUserLocador ? navigate('/dashboard?tab=fleet') : setModalEquipamentoOpen(true)}
                      className="px-2 md:px-3 py-2 md:py-2.5 border border-border text-foreground-secondary font-medium rounded-xl hover:bg-glass-hover text-xs md:text-sm flex items-center gap-1 md:gap-1.5 transition-colors"
                    >
                      {isUserLocador ? 'Frota' : 'Equipamento'}
                      <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Barra de status do equipamento */}
                <ChatStatusBar
                  propostaStatus={chat?.proposta?.status}
                  equipamentoStatus={chat?.equipamento?.status}
                  hasProposal={!!chat?.proposta}
                  isLocatario={isUserLocatario}
                />

                {/* Resumo do Acordo Compacto - Mobile Only - Proposta Aceita */}
                {chat?.proposta?.status === 'aceita' && (
                  <div className="lg:hidden px-4 pt-3">
                    <div className="bg-indigo-50 dark:bg-surface-elevated rounded-xl p-3 border border-indigo-100 dark:border-border flex justify-between items-center shadow-sm">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 bg-white rounded-lg p-1 flex-shrink-0 border border-gray-100 dark:border-border">
                          <img
                            src={getImageUrl(chat.equipamento?.fotos?.[0]) || 'https://via.placeholder.com/48'}
                            alt={chat.equipamento?.nome}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white text-sm font-medium leading-tight">
                            {chat.equipamento?.nome || 'Equipamento'}
                          </p>
                          <p className="text-indigo-600 dark:text-purple-400 text-xs font-bold">
                            R$ {chat.proposta.valor_diaria?.toFixed(2)}/dia
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-500 dark:text-gray-500 uppercase">Total</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                          R$ {chat.proposta.valor_total?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {/* Timeline Compact */}
                    <div className="flex items-center gap-2 mt-3 px-2">
                      <div className="flex items-center gap-1.5 opacity-50">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-gray-400">Proposta</span>
                      </div>
                      <div className="h-px w-4 bg-gray-300 dark:bg-gray-700"></div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                          2
                        </div>
                        <span className="text-[10px] text-slate-900 dark:text-white font-medium">Reservado</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card de proposta inline para Locatário */}
                {isUserLocatario && chat?.proposta?.status === 'pendente' && (
                  <button
                    onClick={() => setModalPropostaRecebidaOpen(true)}
                    className="mx-5 my-3 bg-cta/10 border border-cta/20 rounded-2xl p-4 w-[calc(100%-2.5rem)] text-left hover:bg-cta/20 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-cta rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground text-sm">
                          Proposta recebida: R$ {chat.proposta.valor_total?.toFixed(2)} por {chat.proposta.quantidade_dias} dias
                          {chat.proposta.valor_frete === 0 && ' + Frete Gratis'}
                        </p>
                        <p className="text-xs text-cta font-bold mt-0.5 group-hover:text-blue-300">Toque para ver detalhes e responder</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto px-5 py-6 bg-surface/50">
                  {mensagensFiltradas.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-sm text-foreground-muted font-medium">Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    Object.entries(mensagensAgrupadas).map(([data, msgs]) => (
                      <div key={data}>
                        <div className="flex items-center justify-center my-6">
                          <span className="px-4 py-1.5 bg-glass-hover text-foreground-muted text-[11px] font-bold uppercase tracking-wider rounded-full border border-border-subtle">{data}</span>
                        </div>
                        {msgs.map((msg) => {
                          const isMe = normalizeId(msg.sender_id) === userId

                          return (
                            <div key={msg.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] px-5 py-3 ${
                                isMe
                                  ? 'bg-bubble-me text-bubble-me-text rounded-2xl rounded-tr-sm shadow-md'
                                  : 'bg-bubble-other text-bubble-other-text rounded-2xl rounded-tl-sm border border-border-subtle shadow-sm'
                              }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                                <p className={`text-[10px] mt-1.5 ${isMe ? 'text-foreground-secondary text-right' : 'text-foreground-muted'}`}>{formatarHora(msg.created_at)}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}
                  {/* ReviewCard - aparece para locatário após finalização */}
                  {isUserLocatario && chat?.proposta?.status === 'finalizada' && chat?.proposta?.id && (
                    <div className="px-5 pb-6">
                      <ReviewCard
                        rentalId={chat.proposta.id}
                        reviewerId={user!.id}
                        targetId={chat.locador_id}
                        locadorNome={chat.locador_nome || 'Locador'}
                      />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Premium */}
                <div className="bg-surface-card border-t border-border-subtle p-3 md:p-4 flex-shrink-0">
                  <form onSubmit={handleEnviar} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-glass-hover border border-border rounded-2xl p-1.5 md:p-2">
                      <input
                        type="file"
                        id="chat-file-upload"
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // TODO: implementar upload de arquivo
                            console.log('Arquivo selecionado:', file.name)
                          }
                        }}
                      />
                      <label
                        htmlFor="chat-file-upload"
                        className="p-1.5 md:p-2 hover:bg-glass-hover rounded-xl text-foreground-muted transition-colors cursor-pointer"
                      >
                        <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                      </label>
                      <div className="w-px h-5 md:h-6 bg-border mx-0.5 md:mx-1" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(e.target.value)}
                        placeholder="Escreva uma mensagem..."
                        className="flex-1 px-2 md:px-3 py-2 bg-transparent border-0 focus:outline-none text-sm text-foreground placeholder:text-foreground-muted"
                        disabled={enviando}
                      />
                      <button
                        type="submit"
                        disabled={enviando || !novaMensagem.trim()}
                        className="p-2 md:p-2.5 bg-cta text-white rounded-xl hover:bg-cta disabled:opacity-30 transition-all"
                      >
                        {enviando ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                      </button>
                    </div>
                  </form>

                  {/* Owner: Gerar Nova Proposta pill */}
                  {podeGerarProposta && (
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={() => setModalPropostaOpen(true)}
                        className="flex items-center gap-2 px-5 py-2 border border-cta/30 bg-cta/10 text-cta rounded-full text-sm font-bold hover:bg-cta/20 transition-colors"
                      >
                        {isReLocacao ? <RefreshCw className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        {isReLocacao ? 'Nova Locação' : chat?.proposta?.status === 'pendente' ? 'Editar Proposta' : 'Gerar Nova Proposta'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          {/* Coluna 3: Sidebar de Negociação (Desktop only) */}
          {chatId && chat && (
            <aside className="w-80 flex-shrink-0 hidden xl:block">
              <NegociacaoSidebar
                chat={chat}
                proposta={chat?.proposta || null}
                isLocador={isUserLocador}
                isLocatario={isUserLocatario}
                podeGerarProposta={podeGerarProposta}
                podeGerarContrato={podeGerarContrato}
                isReLocacao={isReLocacao}
                onGerarProposta={() => setModalPropostaOpen(true)}
                onGerarContrato={handleGerarContrato}
                onAceitarProposta={handleAceitarProposta}
                onRecusarProposta={handleRecusarProposta}
                respondendo={respondendoProposta}
                propostaPreview={propostaPreview}
              />
            </aside>
          )}
        </div>
      </div>

      {/* Modais */}
      <PropostaModal
        isOpen={modalPropostaOpen}
        onClose={() => { setModalPropostaOpen(false); setPropostaPreview(null) }}
        onEnviar={handleEnviarProposta}
        loading={enviandoProposta}
        equipamentoNome={chat?.equipamento?.nome}
        equipamentoPreco={chat?.equipamento?.preco_diaria}
        quantidadeDiasSolicitados={chat?.quantidade_dias}
        enderecoEntrega={{
          logradouro: chat?.endereco_entrega_logradouro,
          cidade: chat?.endereco_entrega_cidade,
          uf: chat?.endereco_entrega_uf,
          cep: chat?.endereco_entrega_cep
        }}
        equipamentoCategoria={chat?.equipamento?.categoria}
        precisaOperador={chat?.precisa_operador}
        onPreviewChange={setPropostaPreview}
      />

      <SucessoModal isOpen={modalSucessoOpen} onClose={() => setModalSucessoOpen(false)} />

      <NotificacaoLocadorModal
        isOpen={notificacaoLocadorOpen}
        onClose={() => setNotificacaoLocadorOpen(false)}
        onIrParaFrota={() => {
          setNotificacaoLocadorOpen(false)
          navigate('/dashboard?tab=fleet')
        }}
      />

      <EquipamentoModal
        isOpen={modalEquipamentoOpen}
        onClose={() => setModalEquipamentoOpen(false)}
        equipamento={chat?.equipamento}
      />

      {/* Modal de Proposta Recebida para Locatário */}
      {modalPropostaRecebidaOpen && chat?.proposta && (
        <div className="fixed inset-0 glass-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-surface-card backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 border border-border">
            <PropostaRecebidaCard
              proposta={chat.proposta}
              onAceitar={(endereco) => handleAceitarProposta(endereco)}
              onRecusar={handleRecusarProposta}
              respondendo={respondendoProposta}
              enderecoExistente={chat.endereco_entrega_logradouro ? {
                logradouro: chat.endereco_entrega_logradouro,
                cep: chat.endereco_entrega_cep || '',
                cidade: chat.endereco_entrega_cidade || '',
                uf: chat.endereco_entrega_uf || ''
              } : undefined}
            />
            <button
              onClick={() => setModalPropostaRecebidaOpen(false)}
              className="w-full py-2.5 text-foreground-muted text-sm font-bold hover:text-foreground mt-2 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Contract Generator Modal */}
      {contratoModalOpen && (
        <ContractGeneratorModal
          isOpen={contratoModalOpen}
          onClose={() => setContratoModalOpen(false)}
          initialData={mapContextToContractData(
            chat,
            chat?.proposta || null,
            chat?.equipamento,
            profile,
            locatarioProfile
          )}
        />
      )}
    </div>
  )
}
