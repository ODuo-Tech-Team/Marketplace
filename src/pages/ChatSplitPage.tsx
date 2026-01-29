import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Mensagem, type Chat, type Proposta, type EnderecoEntrega, ESTADOS_BR } from '../contexts/AppContext'
import { PropostaRecebidaCard } from '../components/chat/PropostaRecebidaCard'
import { supabase } from '../lib/supabase'
import {
  Send, Loader2, X, FileText, Check, XCircle, Truck, MessageCircle, Package,
  ChevronLeft, PartyPopper, ArrowLeft, Search, ExternalLink, Plus, MapPin, DollarSign,
  RefreshCw, RotateCcw
} from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { ChatStatusBar } from '../components/chat/ChatStatusBar'

const SYSTEM_SENDER_ID = '00000000-0000-0000-0000-000000000000'

function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
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
  enderecoEntrega
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
  }) => Promise<void>
  loading: boolean
  equipamentoNome?: string
  equipamentoPreco?: number
  quantidadeDiasSolicitados?: number
  enderecoEntrega?: { logradouro?: string; cidade?: string; uf?: string; cep?: string }
}) {
  const [valorDiaria, setValorDiaria] = useState(equipamentoPreco?.toString() || '')
  const [valorFrete, setValorFrete] = useState('')
  const [desconto, setDesconto] = useState('')
  const [taxaExtra, setTaxaExtra] = useState('')
  useEffect(() => {
    if (equipamentoPreco) setValorDiaria(equipamentoPreco.toString())
  }, [equipamentoPreco])

  const valorDiariaNum = parseFloat(valorDiaria) || 0
  const valorFreteNum = parseFloat(valorFrete) || 0
  const descontoNum = parseFloat(desconto) || 0
  const taxaExtraNum = parseFloat(taxaExtra) || 0
  const quantidadeDiasNum = quantidadeDiasSolicitados || 0

  const subtotalLocacao = valorDiariaNum * quantidadeDiasNum
  const valorTotal = subtotalLocacao + valorFreteNum - descontoNum + taxaExtraNum

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
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Gerar Proposta
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm text-slate-600">Equipamento:</p>
            <p className="font-semibold text-slate-900">{equipamentoNome || 'Equipamento'}</p>
          </div>

          {(quantidadeDiasSolicitados || enderecoEntrega?.logradouro) && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm">
              <p className="font-semibold text-blue-800 mb-1">Solicitacao do Cliente:</p>
              {quantidadeDiasSolicitados && <p className="text-blue-700">{quantidadeDiasSolicitados} dias solicitados</p>}
              {enderecoEntrega?.logradouro && (
                <p className="text-blue-700">{enderecoEntrega.logradouro}, {enderecoEntrega.cidade}/{enderecoEntrega.uf}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Diaria (R$) *</label>
            <input
              type="number"
              step="0.01"
              value={valorDiaria}
              onChange={(e) => setValorDiaria(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Frete (R$)</label>
            <input
              type="number"
              step="0.01"
              value={valorFrete}
              onChange={(e) => setValorFrete(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="0.00 = Frete Gratis"
            />
          </div>

          {/* Desconto e Taxa Extra */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Desconto (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Taxa Extra (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxaExtra}
                onChange={(e) => setTaxaExtra(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Locacao ({quantidadeDiasNum}d x R$ {valorDiariaNum.toFixed(2)})</span>
              <span className="font-medium">R$ {subtotalLocacao.toFixed(2)}</span>
            </div>
            {valorFreteNum > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Frete</span>
                <span className="font-medium">R$ {valorFreteNum.toFixed(2)}</span>
              </div>
            )}
            {descontoNum > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Desconto</span>
                <span className="font-medium">- R$ {descontoNum.toFixed(2)}</span>
              </div>
            )}
            {taxaExtraNum > 0 && (
              <div className="flex justify-between text-sm text-orange-700">
                <span>Taxa Extra</span>
                <span className="font-medium">+ R$ {taxaExtraNum.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-green-300 mt-2">
              <span className="font-bold text-slate-900">TOTAL</span>
              <span className="text-xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || valorTotal <= 0}
              className="flex-1 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
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

// ========== MODAL DE SUCESSO ==========
function SucessoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PartyPopper className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Proposta Aceita!</h2>
        <p className="text-slate-600 mb-4">O locador irá preparar a entrega do equipamento.</p>
        <button onClick={onClose} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
          Entendido
        </button>
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Conversas</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Nenhuma conversa</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredChats.map((chat) => {
              const isSelected = chat.id === selectedChatId
              const isLocador = chat.locador_id === userId
              const outraParte = isLocador ? chat.locatario_nome : chat.locador_nome
              const temNaoLida = chat.ultima_mensagem && !chat.ultima_mensagem_lida && chat.ultima_mensagem_sender_id !== userId

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-slate-50 text-left transition-colors ${
                    isSelected ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                  } ${temNaoLida && !isSelected ? 'bg-amber-50/50' : ''}`}
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 font-semibold">
                    {(outraParte || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm truncate ${temNaoLida ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {outraParte || 'Cliente'}
                      </h3>
                      {chat.ultima_mensagem_data && (
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {new Date(chat.ultima_mensagem_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-600 truncate">{chat.equipamento?.nome}</p>
                    {chat.ultima_mensagem && (
                      <p className={`text-xs truncate mt-0.5 ${temNaoLida ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                        {chat.ultima_mensagem}
                      </p>
                    )}
                  </div>
                  {temNaoLida && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full flex-shrink-0" />}
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
  onGerarProposta,
  onAceitarProposta,
  onRecusarProposta,
  onDespachar,
  onConfirmarDevolucao,
  respondendo,
  despachando,
  confirmandoDevolucao
}: {
  chat: Chat | null
  proposta: Proposta | null
  isLocador: boolean
  isLocatario: boolean
  onGerarProposta: () => void
  onAceitarProposta: () => void
  onRecusarProposta: () => void
  onDespachar?: () => void
  onConfirmarDevolucao?: () => void
  respondendo: boolean
  despachando?: boolean
  confirmandoDevolucao?: boolean
}) {
  if (!chat) return null

  const equipamento = chat.equipamento
  const fotoUrl = getImageUrl(equipamento?.fotos?.[0])
  const eqStatus = equipamento?.status?.toUpperCase()

  const getStatusStep = () => {
    // Devolvido (proposta finalizada)
    if (proposta?.status === 'finalizada') return 4
    // Em uso (OCUPADO ou EM_TRANSITO legado)
    if (eqStatus === 'OCUPADO' || eqStatus === 'EM_TRANSITO') return 3
    // Reservado (proposta aceita)
    if (eqStatus === 'RESERVADO' || proposta?.status === 'aceita') return 2
    // Proposta pendente
    if (proposta?.status === 'pendente') return 1
    return 0
  }
  const step = getStatusStep()

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">Detalhes da Locação</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Equipamento */}
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
              {fotoUrl ? (
                <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{equipamento?.nome}</p>
              <p className="text-xs text-slate-500">{equipamento?.categoria}</p>
              {equipamento?.preco_diaria && (
                <p className="text-amber-600 font-bold mt-1">R$ {equipamento.preco_diaria.toFixed(2)}/dia</p>
              )}
            </div>
          </div>
        </div>

        {/* Stepper de Status */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
          <div className="space-y-1">
            {(isLocador ? ['Proposta Enviada', 'Reservado', 'Em Uso', 'Devolvido'] : ['Proposta Enviada', 'Reservado']).map((label, i) => {
              const stepIndex = i + 1 // step 0 = negociacao (sem proposta)
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    stepIndex < step ? 'bg-green-500 text-white' : stepIndex === step ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {stepIndex < step ? '\u2713' : i + 1}
                  </div>
                  <span className={`text-sm ${stepIndex <= step ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Valores da Proposta */}
        {proposta && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Valores</p>
            {proposta.valor_diaria && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Diária</span>
                <span className="font-medium">R$ {proposta.valor_diaria.toFixed(2)}</span>
              </div>
            )}
            {proposta.quantidade_dias && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Dias</span>
                <span className="font-medium">{proposta.quantidade_dias}</span>
              </div>
            )}
            {proposta.valor_frete != null && proposta.valor_frete > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Frete</span>
                <span className="font-medium">R$ {proposta.valor_frete.toFixed(2)}</span>
              </div>
            )}
            {proposta.valor_frete != null && proposta.valor_frete === 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Frete</span>
                <span className="font-medium text-green-600">Grátis</span>
              </div>
            )}
            {proposta.valor_total && (
              <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-lg font-bold text-green-600">R$ {proposta.valor_total.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Endereço de Entrega */}
        {chat.endereco_entrega_logradouro && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Entrega
            </p>
            <p className="text-sm text-slate-900">{chat.endereco_entrega_logradouro}</p>
            <p className="text-xs text-slate-500">
              {chat.endereco_entrega_cidade}/{chat.endereco_entrega_uf} - CEP: {chat.endereco_entrega_cep}
            </p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {/* Locador pode gerar proposta (nova ou re-locação após finalizada) */}
        {isLocador && (!proposta || proposta.status === 'recusada' || proposta.status === 'finalizada') && (
          <button
            onClick={onGerarProposta}
            className={`w-full py-3 text-white font-semibold rounded-lg flex items-center justify-center gap-2 ${
              proposta?.status === 'finalizada'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {proposta?.status === 'finalizada' ? (
              <RefreshCw className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {proposta?.status === 'finalizada' ? 'Nova Locação' : 'Gerar Proposta'}
          </button>
        )}

        {/* Locatário pode aceitar/recusar */}
        {isLocatario && proposta?.status === 'pendente' && (
          <div className="flex gap-2">
            <button
              onClick={onRecusarProposta}
              disabled={respondendo}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 disabled:opacity-50"
            >
              Recusar
            </button>
            <button
              onClick={onAceitarProposta}
              disabled={respondendo}
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {respondendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Aceitar
            </button>
          </div>
        )}

        {/* Locador pode despachar quando RESERVADO */}
        {isLocador && eqStatus === 'RESERVADO' && (
          <button
            onClick={onDespachar}
            disabled={despachando}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {despachando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {despachando ? 'Despachando...' : 'Despachar / Enviar'}
          </button>
        )}

        {/* Status: Em Uso + Botão Confirmar Devolução (apenas locador) */}
        {isLocador && (eqStatus === 'OCUPADO' || eqStatus === 'EM_TRANSITO') && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-green-700 font-semibold text-sm">Em Uso</p>
              <p className="text-green-600 text-xs mt-1">Equipamento com o cliente</p>
            </div>
            <button
              onClick={onConfirmarDevolucao}
              disabled={confirmandoDevolucao}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {confirmandoDevolucao ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
              {confirmandoDevolucao ? 'Confirmando...' : 'Confirmar Devolução'}
            </button>
          </>
        )}

        {/* Status quando aceita e aguardando despacho */}
        {proposta?.status === 'aceita' && eqStatus === 'RESERVADO' && !isLocador && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-blue-700 font-semibold text-sm">Reservado</p>
            <p className="text-blue-600 text-xs mt-1">Aguardando despacho do locador</p>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Detalhes do Equipamento
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {fotoUrl && (
            <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-100">
              <img src={fotoUrl} alt={equipamento.nome} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-slate-900">{equipamento.nome}</h3>
            {equipamento.categoria && (
              <p className="text-sm text-amber-600 font-medium mt-1">{equipamento.categoria}</p>
            )}
          </div>

          {equipamento.preco_diaria && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-slate-600">Diaria</p>
              <p className="text-2xl font-bold text-green-600">R$ {equipamento.preco_diaria.toFixed(2)}</p>
            </div>
          )}

          {equipamento.descricao && (
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Descricao</p>
              <p className="text-sm text-slate-700">{equipamento.descricao}</p>
            </div>
          )}

          {(equipamento.ano || equipamento.horimetro_atual || equipamento.peso_operacional) && (
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Ficha Tecnica</p>
              {equipamento.ano && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Ano</span>
                  <span className="font-medium">{equipamento.ano}</span>
                </div>
              )}
              {equipamento.horimetro_atual && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Horimetro</span>
                  <span className="font-medium">{equipamento.horimetro_atual.toLocaleString('pt-BR')}h</span>
                </div>
              )}
              {equipamento.peso_operacional && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Peso Operacional</span>
                  <span className="font-medium">{equipamento.peso_operacional}t</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
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
    marcarMensagensComoLidas,
    despacharEquipamento,
    confirmarRetorno
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
  const [despachando, setDespachando] = useState(false)
  const [confirmandoDevolucao, setConfirmandoDevolucao] = useState(false)
  const [modalEquipamentoOpen, setModalEquipamentoOpen] = useState(false)
  const [modalPropostaRecebidaOpen, setModalPropostaRecebidaOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const nomeUsuario = profile?.nome_empresa || profile?.full_name || 'Perfil'
  const isLocador = profile?.tipo_usuario === 'locador'

  const normalizeId = (id: string | undefined | null): string => String(id || '').toLowerCase().trim()
  const userId = normalizeId(user?.id)
  const locadorId = normalizeId(chat?.locador_id)
  const locatarioId = normalizeId(chat?.locatario_id)
  const isUserLocador = userId !== '' && locadorId !== '' && userId === locadorId
  const isUserLocatario = userId !== '' && locatarioId !== '' && userId === locatarioId

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Auto-abrir modal de proposta recebida para locatário quando carregar chat com proposta pendente
  useEffect(() => {
    if (chat && isUserLocatario && chat.proposta?.status === 'pendente') {
      setModalPropostaRecebidaOpen(true)
    }
  }, [chat?.proposta?.status, isUserLocatario])

  // Carregar chats
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
          }
        }
      )
      .subscribe()

    const propostasChannel: RealtimeChannel = supabase
      .channel(`propostas-chat-${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'propostas' },
        async () => { if (mountedRef.current) await carregarChat(chatId) }
      )
      .subscribe()

    const chatUpdateChannel: RealtimeChannel = supabase
      .channel(`chat-update-${chatId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats', filter: `id=eq.${chatId}` },
        async () => { if (mountedRef.current) await carregarChat(chatId) }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(propostasChannel)
      supabase.removeChannel(chatUpdateChannel)
    }
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
      // Marca como lidas ao enviar (usuario claramente leu tudo se esta respondendo)
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
  }) => {
    if (!chatId || !user || !chat) return
    setEnviandoProposta(true)
    const equipamentoId = chat.equipamento?.id || chat.proposta?.equipamento_id
    if (!equipamentoId) { setEnviandoProposta(false); return }

    const result = await enviarProposta(chatId, user.id, {
      equipamento_id: equipamentoId,
      valor_diaria: dados.valorDiaria,
      quantidade_dias: dados.quantidadeDias,
      valor_frete: dados.valorFrete,
      valor_total: dados.valorTotal,
      desconto: dados.desconto,
      taxa_extra: dados.taxaExtra,
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

  const handleDespachar = async () => {
    if (!chatId || !chat?.proposta?.id || !chat?.equipamento?.id) return
    setDespachando(true)
    try {
      const result = await despacharEquipamento(chat.proposta.id, chat.equipamento.id)
      if (result.success) {
        await carregarMensagens(chatId)
        await carregarChat(chatId)
      }
    } catch (err) {
      console.error('[ChatSplitPage] Erro ao despachar:', err)
    } finally {
      setDespachando(false)
    }
  }

  const handleConfirmarDevolucao = async () => {
    if (!chatId || !chat?.proposta?.id || !chat?.equipamento?.id) return

    const confirmar = window.confirm('Confirma que o equipamento foi devolvido?')
    if (!confirmar) return

    setConfirmandoDevolucao(true)
    try {
      const result = await confirmarRetorno(chat.proposta.id, chat.equipamento.id)
      if (result.success) {
        await carregarMensagens(chatId)
        await carregarChat(chatId)
        await carregarChats()
      }
    } catch (err) {
      console.error('[ChatSplitPage] Erro ao confirmar devolução:', err)
    } finally {
      setConfirmandoDevolucao(false)
    }
  }

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

  const mensagensAgrupadas = mensagens.reduce((acc, msg) => {
    const data = formatarData(msg.created_at)
    if (!acc[data]) acc[data] = []
    acc[data].push(msg)
    return acc
  }, {} as Record<string, Mensagem[]>)

  const outraParte = isUserLocador ? chat?.locatario_nome : chat?.locador_nome

  return (
    <div className="h-screen bg-slate-100 flex flex-col">
      {/* ========== HEADER ========== */}
      <header className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900 hidden sm:inline">Loca<span className="text-amber-500">Obra</span></span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{nomeUsuario}</p>
                <p className="text-xs text-amber-600 font-medium">{isLocador ? 'LOCADOR' : 'LOCATÁRIO'}</p>
              </div>
              <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-slate-600 font-semibold text-sm">{nomeUsuario.charAt(0).toUpperCase()}</span>
              </div>
              <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700">Sair</button>
            </div>
          </div>
        </div>
      </header>

      {/* ========== MAIN - 3 COLUNAS ========== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Coluna 1: Lista de Conversas */}
        <aside className={`w-80 flex-shrink-0 border-r border-slate-200 ${showList || !chatId ? 'block' : 'hidden lg:block'}`}>
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
        <main className={`flex-1 flex flex-col bg-slate-50 ${!showList || chatId ? 'flex' : 'hidden lg:flex'}`}>
          {!chatId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Selecione uma conversa</h3>
                <p className="text-slate-400 text-sm">Escolha uma conversa da lista</p>
              </div>
            </div>
          ) : loadingChat ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : !chat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <Package className="w-16 h-16 text-slate-300 mb-4" />
              <h2 className="text-lg font-semibold text-slate-600 mb-2">Chat não encontrado</h2>
              <button onClick={() => navigate('/chats')} className="px-4 py-2 bg-amber-500 text-white rounded-lg">
                Voltar
              </button>
            </div>
          ) : (
            <>
              {/* Header do Chat */}
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowList(true)}
                    className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
                    {(outraParte || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{outraParte || 'Cliente'}</h2>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Online agora
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botão Gerar Proposta (visível quando sidebar está oculta, ou seja, telas < xl) */}
                  {isUserLocador && (!chat?.proposta || chat?.proposta?.status === 'recusada' || chat?.proposta?.status === 'finalizada') && (
                    <button
                      onClick={() => setModalPropostaOpen(true)}
                      className={`xl:hidden px-4 py-2 text-white font-semibold rounded-lg text-sm flex items-center gap-1.5 ${
                        chat?.proposta?.status === 'finalizada'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      {chat?.proposta?.status === 'finalizada' ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {chat?.proposta?.status === 'finalizada' ? 'Nova Locação' : 'Gerar Proposta'}
                    </button>
                  )}
                  {/* Botões aceitar/recusar para locatário (visível quando sidebar oculta) */}
                  {isUserLocatario && chat?.proposta?.status === 'pendente' && (
                    <div className="xl:hidden flex items-center gap-1.5">
                      <button
                        onClick={handleRecusarProposta}
                        disabled={respondendoProposta}
                        className="px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 text-sm disabled:opacity-50"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={handleAceitarProposta}
                        disabled={respondendoProposta}
                        className="px-3 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 flex items-center gap-1"
                      >
                        {respondendoProposta ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Aceitar
                      </button>
                    </div>
                  )}
                  {/* Botão despachar para locador (visível quando sidebar oculta) */}
                  {isUserLocador && chat?.equipamento?.status?.toUpperCase() === 'RESERVADO' && (
                    <button
                      onClick={handleDespachar}
                      disabled={despachando}
                      className="xl:hidden px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {despachando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {despachando ? 'Despachando...' : 'Despachar'}
                    </button>
                  )}
                  {/* Botão confirmar devolução para locador quando OCUPADO (visível quando sidebar oculta) */}
                  {isUserLocador && (chat?.equipamento?.status?.toUpperCase() === 'OCUPADO' || chat?.equipamento?.status?.toUpperCase() === 'EM_TRANSITO') && (
                    <button
                      onClick={handleConfirmarDevolucao}
                      disabled={confirmandoDevolucao}
                      className="xl:hidden px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {confirmandoDevolucao ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      {confirmandoDevolucao ? 'Confirmando...' : 'Confirmar Devolução'}
                    </button>
                  )}
                  <button
                    onClick={() => isUserLocador ? navigate('/') : setModalEquipamentoOpen(true)}
                    className="px-4 py-2 border border-amber-500 text-amber-600 font-medium rounded-lg hover:bg-amber-50 text-sm flex items-center gap-1"
                  >
                    {isUserLocador ? 'Minha Frota' : 'Ver Equipamento'}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Barra de Status */}
              <ChatStatusBar
                propostaStatus={chat?.proposta?.status}
                equipamentoStatus={chat?.equipamento?.status}
                hasProposal={!!chat?.proposta}
                isLocatario={isUserLocatario}
              />

              {/* Card de proposta inline para Locatário */}
              {isUserLocatario && chat?.proposta?.status === 'pendente' && (
                <button
                  onClick={() => setModalPropostaRecebidaOpen(true)}
                  className="mx-4 my-3 bg-amber-50 border border-amber-200 rounded-xl p-4 w-[calc(100%-2rem)] text-left hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        Proposta recebida: R$ {chat.proposta.valor_total?.toFixed(2)} por {chat.proposta.quantidade_dias} dias
                        {chat.proposta.valor_frete === 0 && ' + Frete Gratis'}
                      </p>
                      <p className="text-sm text-amber-600 font-medium">Toque para ver detalhes e responder</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {mensagens.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">Nenhuma mensagem ainda</div>
                ) : (
                  Object.entries(mensagensAgrupadas).map(([data, msgs]) => (
                    <div key={data}>
                      <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded-full">{data}</span>
                      </div>
                      {msgs.map((msg) => {
                        const isMe = normalizeId(msg.sender_id) === userId
                        const isSystem = normalizeId(msg.sender_id) === normalizeId(SYSTEM_SENDER_ID) ||
                          msg.texto.startsWith('✅') || msg.texto.startsWith('❌')

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="flex justify-center my-3">
                              <p className="text-xs text-slate-500 italic bg-slate-100 px-3 py-1 rounded-full">{msg.texto}</p>
                            </div>
                          )
                        }

                        return (
                          <div key={msg.id} className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              isMe ? 'bg-amber-500 text-white rounded-br-md' : 'bg-white text-slate-900 rounded-bl-md shadow-sm'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-amber-200' : 'text-slate-400'}`}>{formatarHora(msg.created_at)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-slate-200 p-3 flex-shrink-0">
                <form onSubmit={handleEnviar} className="flex items-center gap-2">
                  <button type="button" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <Plus className="w-5 h-5" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-2 bg-slate-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={enviando}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !novaMensagem.trim()}
                    className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50"
                  >
                    {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
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
              onGerarProposta={() => setModalPropostaOpen(true)}
              onAceitarProposta={handleAceitarProposta}
              onRecusarProposta={handleRecusarProposta}
              onDespachar={handleDespachar}
              onConfirmarDevolucao={handleConfirmarDevolucao}
              respondendo={respondendoProposta}
              despachando={despachando}
              confirmandoDevolucao={confirmandoDevolucao}
            />
          </aside>
        )}
      </div>

      {/* Modais */}
      <PropostaModal
        isOpen={modalPropostaOpen}
        onClose={() => setModalPropostaOpen(false)}
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
      />

      <SucessoModal isOpen={modalSucessoOpen} onClose={() => setModalSucessoOpen(false)} />

      <EquipamentoModal
        isOpen={modalEquipamentoOpen}
        onClose={() => setModalEquipamentoOpen(false)}
        equipamento={chat?.equipamento}
      />

      {/* Modal de Proposta Recebida para Locatário */}
      {modalPropostaRecebidaOpen && chat?.proposta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4">
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
              className="w-full py-2 text-slate-500 text-sm font-medium hover:text-slate-700 mt-2"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
