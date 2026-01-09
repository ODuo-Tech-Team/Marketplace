import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Mensagem, type Chat, type Proposta, type EnderecoEntrega, isChatAberto, ESTADOS_BR } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { HardHat, Send, Loader2, X, FileText, Check, XCircle, MapPin, Truck, Copy, MessageCircle, Package, ChevronLeft, PartyPopper } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ID especial para mensagens do sistema
const SYSTEM_SENDER_ID = '00000000-0000-0000-0000-000000000000'

// Helper para obter URL pública de uma imagem do storage
function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  // Se já é uma URL completa, retorna como está
  if (path.startsWith('http')) return path
  // Caso contrário, gera URL pública do storage
  const { data } = supabase.storage.from('equipamentos').getPublicUrl(path)
  return data?.publicUrl || null
}

// Modal profissional para LOCADOR criar proposta com valores
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
  onEnviar: (dados: { valorDiaria: number; quantidadeDias: number; valorFrete: number; valorTotal: number }) => Promise<void>
  loading: boolean
  equipamentoNome?: string
  equipamentoPreco?: number
  quantidadeDiasSolicitados?: number
  enderecoEntrega?: { logradouro?: string; cidade?: string; uf?: string; cep?: string }
}) {
  const [valorDiaria, setValorDiaria] = useState(equipamentoPreco?.toString() || '')
  const [quantidadeDias, setQuantidadeDias] = useState(quantidadeDiasSolicitados?.toString() || '')
  const [valorFrete, setValorFrete] = useState('')

  // Atualiza valores quando props mudam
  useEffect(() => {
    if (equipamentoPreco) setValorDiaria(equipamentoPreco.toString())
    if (quantidadeDiasSolicitados) setQuantidadeDias(quantidadeDiasSolicitados.toString())
  }, [equipamentoPreco, quantidadeDiasSolicitados])

  // Calcula valor total automaticamente
  const valorDiariaNum = parseFloat(valorDiaria) || 0
  const quantidadeDiasNum = parseInt(quantidadeDias) || 0
  const valorFreteNum = parseFloat(valorFrete) || 0
  const subtotalLocacao = valorDiariaNum * quantidadeDiasNum
  const valorTotal = subtotalLocacao + valorFreteNum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (valorDiariaNum <= 0 || quantidadeDiasNum <= 0) {
      alert('Preencha o valor da diária e quantidade de dias!')
      return
    }
    await onEnviar({
      valorDiaria: valorDiariaNum,
      quantidadeDias: quantidadeDiasNum,
      valorFrete: valorFreteNum,
      valorTotal
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600" />
            Gerar Proposta
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Info do equipamento */}
          <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-orange-600" />
              <span className="font-bold text-gray-800">{equipamentoNome || 'Equipamento'}</span>
            </div>
          </div>

          {/* Dados da solicitação do cliente */}
          {(quantidadeDiasSolicitados || enderecoEntrega?.logradouro) && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-sm font-semibold text-blue-800 mb-2">Solicitação do Cliente:</p>
              {quantidadeDiasSolicitados && (
                <p className="text-sm text-blue-700">📅 Período: <span className="font-bold">{quantidadeDiasSolicitados} dias</span></p>
              )}
              {enderecoEntrega?.logradouro && (
                <p className="text-sm text-blue-700 mt-1">
                  📍 Entrega: {enderecoEntrega.logradouro}, {enderecoEntrega.cidade}/{enderecoEntrega.uf}
                </p>
              )}
            </div>
          )}

          {/* Campo: Valor da Diária */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Valor da Diária (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorDiaria}
              onChange={(e) => setValorDiaria(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="Ex: 150.00"
              required
            />
          </div>

          {/* Campo: Quantidade de Dias */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Quantidade de Dias *
            </label>
            <input
              type="number"
              min="1"
              value={quantidadeDias}
              onChange={(e) => setQuantidadeDias(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="Ex: 3"
              required
            />
          </div>

          {/* Campo: Valor do Frete */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Valor do Frete (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorFrete}
              onChange={(e) => setValorFrete(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="Ex: 50.00 (opcional)"
            />
          </div>

          {/* Resumo do Valor */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-300">
            <h3 className="text-sm font-bold text-gray-600 mb-3">RESUMO DA PROPOSTA</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Locação ({quantidadeDiasNum} dias x R$ {valorDiariaNum.toFixed(2)})</span>
                <span className="font-semibold">R$ {subtotalLocacao.toFixed(2)}</span>
              </div>
              {valorFreteNum > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span className="font-semibold">R$ {valorFreteNum.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-green-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-800">TOTAL</span>
                  <span className="text-2xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-200 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-300 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || valorTotal <= 0}
              className="flex-1 py-4 bg-orange-600 text-white text-lg font-bold rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              <span>{loading ? 'Enviando...' : 'Enviar Proposta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de sucesso para locatário após aceitar proposta - UX 35+
function SucessoAceiteModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md text-center p-8">
        {/* Ícone de sucesso */}
        <div className="flex justify-center mb-6">
          <div className="p-5 bg-green-100 rounded-full">
            <PartyPopper className="w-16 h-16 text-green-600" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Proposta Aceita!
        </h2>

        {/* Mensagem */}
        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
          Sua locação foi confirmada! O locador irá preparar a entrega do equipamento.
        </p>

        {/* Info adicional */}
        <div className="bg-green-50 rounded-xl p-4 mb-6 border-2 border-green-200">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <Truck className="w-6 h-6" />
            <span className="text-lg font-medium">Aguarde o contato do locador</span>
          </div>
        </div>

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-green-600 text-white text-xl font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-3"
        >
          <Check className="w-6 h-6" />
          <span>Entendido</span>
        </button>
      </div>
    </div>
  )
}

// Modal de endereço
function EnderecoModal({
  isOpen,
  onClose,
  onConfirmar,
  loading
}: {
  isOpen: boolean
  onClose: () => void
  onConfirmar: (endereco: EnderecoEntrega) => Promise<void>
  loading: boolean
}) {
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)

  const buscarCep = async (cepValue: string) => {
    const cepLimpo = cepValue.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    setBuscandoCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setRua(data.logradouro || '')
        setBairro(data.bairro || '')
        setCidade(data.localidade || '')
        setUf(data.uf || '')
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
    }
    setBuscandoCep(false)
  }

  const handleCepChange = (value: string) => {
    const cepLimpo = value.replace(/\D/g, '')
    let cepFormatado = cepLimpo
    if (cepLimpo.length > 5) {
      cepFormatado = `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`
    }
    setCep(cepFormatado)
    if (cepLimpo.length === 8) buscarCep(cepLimpo)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ESTRUTURA REAL DO BANCO: só tem endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
    // Combina rua, número, complemento e bairro em um único campo 'logradouro'
    const logradouroCompleto = `${rua}, ${numero}${complemento ? ` - ${complemento}` : ''}${bairro ? ` - ${bairro}` : ''}`
    await onConfirmar({ cep, logradouro: logradouroCompleto, cidade, uf })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-800">Endereço de Entrega</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
            Informe o endereço para entrega do equipamento.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
            <div className="relative">
              <input
                type="text"
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="00000-000"
                maxLength={9}
                required
              />
              {buscandoCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-orange-500" />}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua/Logradouro *</label>
            <input
              type="text"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                required
              >
                <option value="">UF</option>
                {ESTADOS_BR.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            <span>{loading ? 'Confirmando...' : 'Confirmar Endereço e Aceitar'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

// Card de proposta
function PropostaCard({
  proposta,
  isLocatario,
  isLocador,
  onAceitar,
  onRecusar,
  respondendo
}: {
  proposta: Proposta
  isLocatario: boolean
  isLocador: boolean
  onAceitar: () => void
  onRecusar: () => void
  respondendo: boolean
}) {
  const [copiado, setCopiado] = useState(false)

  // ESTRUTURA REAL DO BANCO - propostas só tem:
  // id, equipamento_id, usuario_id, status, created_at
  // endereco_logradouro (completo), endereco_cep, endereco_cidade, endereco_uf
  // NÃO TEM: valor_diaria, quantidade_dias, valor_frete, valor_total, endereco_numero, endereco_bairro, endereco_complemento

  const statusColors: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    aceita: 'bg-green-100 text-green-800 border-green-300',
    recusada: 'bg-red-100 text-red-800 border-red-300'
  }

  const statusLabels: Record<string, string> = {
    pendente: 'Aguardando resposta',
    aceita: 'Proposta aceita',
    recusada: 'Proposta recusada'
  }

  // Verifica se tem endereço de entrega (só endereco_logradouro existe)
  const temEndereco = proposta.endereco_logradouro

  const copiarEndereco = async () => {
    const endereco = `${proposta.endereco_logradouro || ''}
${proposta.endereco_cidade || ''} - ${proposta.endereco_uf || ''}
CEP: ${proposta.endereco_cep || ''}`

    try {
      await navigator.clipboard.writeText(endereco)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-orange-200 p-5 my-3 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-6 h-6 text-orange-600" />
        <span className="font-bold text-gray-800 text-lg">Proposta de Locação</span>
      </div>

      {/* Status da proposta */}
      <div className={`px-4 py-3 rounded-lg text-center text-base font-bold border-2 ${statusColors[proposta.status] || statusColors.pendente}`}>
        {statusLabels[proposta.status] || 'Status desconhecido'}
      </div>

      {/* Endereço de entrega - visível para o locador quando proposta aceita */}
      {proposta.status === 'aceita' && temEndereco && isLocador && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-green-300">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-6 h-6 text-green-600" />
            <span className="font-bold text-green-800 text-lg">Endereço de Entrega</span>
          </div>
          <div className="text-base text-gray-800 space-y-2">
            <p className="font-semibold text-lg">{proposta.endereco_logradouro}</p>
            <p className="font-medium">{proposta.endereco_cidade} - {proposta.endereco_uf}</p>
            {proposta.endereco_cep && (
              <p className="text-gray-600 text-base">CEP: {proposta.endereco_cep}</p>
            )}
          </div>
          <button
            onClick={copiarEndereco}
            className={`mt-4 w-full py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all ${
              copiado
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
            }`}
          >
            {copiado ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span>{copiado ? 'Endereço Copiado!' : 'Copiar Endereço'}</span>
          </button>
        </div>
      )}

      {/* Confirmação para locatário que o endereço foi enviado */}
      {proposta.status === 'aceita' && temEndereco && isLocatario && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span className="text-base text-blue-800 font-medium">Endereço de entrega enviado ao locador</span>
          </div>
        </div>
      )}

      {isLocatario && proposta.status === 'pendente' && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={onRecusar}
            disabled={respondendo}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 text-base font-bold"
          >
            <XCircle className="w-5 h-5" />
            <span>Recusar</span>
          </button>
          <button
            onClick={onAceitar}
            disabled={respondendo}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 text-base font-bold"
          >
            {respondendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            <span>Aceitar</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Lista lateral de conversas
function ChatList({
  chats,
  loading,
  selectedChatId,
  onSelectChat,
  userId
}: {
  chats: Chat[]
  loading: boolean
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  userId: string | undefined
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="p-6 text-center">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-base">Nenhuma conversa ainda</p>
        <Link to="/" className="text-amber-600 hover:underline text-base font-medium mt-2 inline-block">
          Ver Equipamentos
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {chats.map((chat) => {
        const isSelected = chat.id === selectedChatId
        const isLocador = chat.locador_id === userId

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
              isSelected ? 'bg-amber-50 border-l-4 border-amber-600' : ''
            }`}
          >
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex-shrink-0 flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate text-base">
                {chat.equipamento?.nome || 'Equipamento'}
              </h3>
              <p className="text-sm text-gray-500">
                {isLocador ? 'Você é o locador' : 'Você é o locatário'}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Componente principal de Chat com split-view
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
    fetchProposta,
    responderProposta,
    marcarMensagensComoLidas
  } = useApp()

  // Estados da lista de chats
  const [chats, setChats] = useState<Chat[]>([])
  const [loadingChats, setLoadingChats] = useState(true)

  // Estados do chat selecionado
  const [chat, setChat] = useState<Chat | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [propostas, setPropostas] = useState<Record<string, Proposta>>({})
  const [novaMensagem, setNovaMensagem] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [modalPropostaOpen, setModalPropostaOpen] = useState(false)
  const [enviandoProposta, setEnviandoProposta] = useState(false)
  const [respondendoProposta, setRespondendoProposta] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [modalEnderecoOpen, setModalEnderecoOpen] = useState(false)
  const [modalSucessoEnderecoOpen, setModalSucessoEnderecoOpen] = useState(false)
  const [propostaParaAceitar, setPropostaParaAceitar] = useState<string | null>(null)

  // Mobile: estado para mostrar/esconder lista
  const [showList, setShowList] = useState(!chatId)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const erroTimeoutRef = useRef<number | null>(null)
  const sucessoTimeoutRef = useRef<number | null>(null)

  const nomeUsuario = profile?.nome_empresa || profile?.full_name || user?.email || 'Perfil'

  // Helpers
  const normalizeId = (id: string | undefined | null): string => String(id || '').toLowerCase().trim()
  const userId = normalizeId(user?.id)
  const locadorId = normalizeId(chat?.locador_id)
  const locatarioId = normalizeId(chat?.locatario_id)
  const statusDoChat = ''.trim()
  const isLocador = userId !== '' && locadorId !== '' && userId === locadorId
  const isLocatario = userId !== '' && locatarioId !== '' && userId === locatarioId

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  const mostrarErro = (mensagem: string) => {
    if (erroTimeoutRef.current) clearTimeout(erroTimeoutRef.current)
    setErro(mensagem)
    erroTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) setErro(null)
    }, 5000)
  }

  const mostrarSucesso = (mensagem: string) => {
    if (sucessoTimeoutRef.current) clearTimeout(sucessoTimeoutRef.current)
    setSucesso(mensagem)
    sucessoTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) setSucesso(null)
    }, 4000)
  }

  // Carrega lista de chats
  const carregarChats = async () => {
    if (!user) return
    const data = await fetchMeusChats(user.id)
    if (mountedRef.current) {
      setChats(data)
      setLoadingChats(false)
    }
  }

  // Carrega chat específico
  const carregarChat = async (id: string) => {
    if (!mountedRef.current) return
    try {
      const chatData = await fetchChat(id)
      if (mountedRef.current) setChat(chatData)
    } catch (err) {
      console.error('[ChatSplitPage] Erro ao carregar chat:', err)
    }
  }

  // Carrega mensagens
  const carregarMensagens = async (id: string) => {
    if (!mountedRef.current) return
    try {
      const msgs = await fetchMensagens(id)
      if (!mountedRef.current) return
      setMensagens(msgs)

      // Marca como lidas
      if (user?.id) marcarMensagensComoLidas(id, user.id)

      // Carrega propostas
      for (const msg of msgs) {
        if (!mountedRef.current) break
      }
    } catch (err) {
      console.error('[ChatSplitPage] Erro ao carregar mensagens:', err)
    }
  }

  // Seleciona um chat
  const handleSelectChat = (id: string) => {
    navigate(`/chats/${id}`)
    setShowList(false)
  }

  // Carrega lista inicial
  useEffect(() => {
    mountedRef.current = true
    carregarChats()
    return () => { mountedRef.current = false }
  }, [user])

  // Carrega chat quando chatId muda
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
    setPropostas({})

    Promise.all([carregarChat(chatId), carregarMensagens(chatId)]).then(() => {
      if (mountedRef.current) setLoadingChat(false)
    })

    // Configura Realtime
    const channel: RealtimeChannel = supabase
      .channel(`mensagens-chat-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          if (!mountedRef.current) return
          const novaMsgRealtime = payload.new as Mensagem
          setMensagens(prev => {
            const jaExiste = prev.some(m => m.id === novaMsgRealtime.id)
            if (jaExiste) return prev
            return [...prev, novaMsgRealtime]
          })
          // RAIO-X: mensagens usa sender_id (não remetente_id)
          if (user?.id && novaMsgRealtime.sender_id !== user.id) {
            marcarMensagensComoLidas(chatId, user.id)
          }
        }
      )
      .subscribe()

    const propostasChannel: RealtimeChannel = supabase
      .channel(`propostas-chat-${chatId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'propostas' },
        async (payload) => {
          if (!mountedRef.current) return
          const propostaAtualizada = payload.new as Proposta
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(propostasChannel)
    }
  }, [chatId])

  useEffect(() => { scrollToBottom() }, [mensagens])

  // Handlers
  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMensagem.trim() || !chatId || !user) return
    setEnviando(true)
    const result = await enviarMensagem(chatId, user.id, novaMensagem.trim())
    if (result.success) {
      setNovaMensagem('')
      await carregarMensagens(chatId)
    }
    setEnviando(false)
  }

  // Envia proposta com valores do modal
  const handleEnviarProposta = async (dados: { valorDiaria: number; quantidadeDias: number; valorFrete: number; valorTotal: number }) => {
    if (!chatId || !user || !chat) return
    setEnviandoProposta(true)

    // Pega o equipamento_id do chat atual
    const equipamentoId = chat.equipamento?.id || chat.proposta?.equipamento_id
    if (!equipamentoId) {
      mostrarErro('Erro: equipamento não encontrado')
      setEnviandoProposta(false)
      return
    }

    const result = await enviarProposta(chatId, user.id, {
      equipamento_id: equipamentoId,
      valor_diaria: dados.valorDiaria,
      quantidade_dias: dados.quantidadeDias,
      valor_frete: dados.valorFrete,
      valor_total: dados.valorTotal
    })

    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setEnviandoProposta(false)
      setModalPropostaOpen(false)
      await carregarMensagens(chatId)
      await carregarChat(chatId)
      mostrarSucesso(`Proposta de R$ ${dados.valorTotal.toFixed(2)} enviada! Aguarde a resposta do cliente.`)
    } else {
      mostrarErro(result.error || 'Erro ao enviar proposta')
      setEnviandoProposta(false)
    }
  }

  // Aceita proposta diretamente (endereço já foi informado na solicitação)
  const handleAceitarProposta = async (propostaId: string) => {
    if (!chatId || !user || !mountedRef.current) return
    setRespondendoProposta(true)

    try {
      // Usa o endereço que já foi informado na solicitação (salvo no chat)
      const enderecoExistente = chat?.endereco_entrega_logradouro ? {
        cep: chat.endereco_entrega_cep || '',
        logradouro: chat.endereco_entrega_logradouro,
        cidade: chat.endereco_entrega_cidade || '',
        uf: chat.endereco_entrega_uf || ''
      } : undefined

      const result = await responderProposta(propostaId, chatId, true, user.id, enderecoExistente)
      if (!mountedRef.current) return
      setRespondendoProposta(false)

      if (result.success) {
        // Abre modal de sucesso
        setModalSucessoEnderecoOpen(true)

        // Atualiza a proposta localmente
        setPropostas(prev => ({
          ...prev,
          [propostaId]: {
            ...prev[propostaId],
            status: 'aceita' as const,
            endereco_cep: enderecoExistente?.cep,
            endereco_logradouro: enderecoExistente?.logradouro,
            endereco_cidade: enderecoExistente?.cidade,
            endereco_uf: enderecoExistente?.uf
          }
        }))

        await carregarChat(chatId)
        mostrarSucesso('Proposta aceita com sucesso!')
      } else {
        mostrarErro(`Erro ao aceitar proposta: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (err) {
      console.error('[handleAceitarProposta] Erro:', err)
      if (mountedRef.current) {
        setRespondendoProposta(false)
        mostrarErro('Erro inesperado ao processar proposta.')
      }
    }
  }

  const handleConfirmarEnderecoEAceitar = async (endereco: EnderecoEntrega) => {
    if (!chatId || !user || !mountedRef.current || !propostaParaAceitar) return
    setRespondendoProposta(true)

    try {
      const result = await responderProposta(propostaParaAceitar, chatId, true, user.id, endereco)
      if (!mountedRef.current) return
      setRespondendoProposta(false)

      if (result.success) {
        setModalEnderecoOpen(false)
        setPropostaParaAceitar(null)
        // Abre modal de sucesso para locatário (UX 35+)
        setModalSucessoEnderecoOpen(true)

        // Atualiza a proposta localmente
        // ESTRUTURA REAL: só tem endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
        setPropostas(prev => ({
          ...prev,
          [propostaParaAceitar]: {
            ...prev[propostaParaAceitar],
            status: 'aceita' as const,
            endereco_cep: endereco.cep,
            endereco_logradouro: endereco.logradouro,
            endereco_cidade: endereco.cidade,
            endereco_uf: endereco.uf
          }
        }))

        await carregarChat(chatId)
        const propostaAtualizada = await fetchProposta(propostaParaAceitar)
        if (propostaAtualizada && mountedRef.current) {
          setPropostas(prev => ({ ...prev, [propostaParaAceitar]: propostaAtualizada }))
        }
      } else {
        mostrarErro(`Erro ao aceitar proposta: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (err) {
      console.error('[handleConfirmarEnderecoEAceitar] Erro:', err)
      if (mountedRef.current) {
        setRespondendoProposta(false)
        mostrarErro('Erro inesperado ao processar proposta.')
      }
    }
  }

  const handleRecusarProposta = async (propostaId: string) => {
    if (!chatId || !user || !mountedRef.current) return
    setErro(null)
    setRespondendoProposta(true)

    try {
      const result = await responderProposta(propostaId, chatId, false, user.id)
      if (!mountedRef.current) return
      setRespondendoProposta(false)

      if (result.success) {
        setPropostas(prev => ({ ...prev, [propostaId]: { ...prev[propostaId], status: 'recusada' as const } }))
        await carregarChat(chatId)
      } else {
        mostrarErro(`Erro ao recusar proposta: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (err) {
      console.error('[handleRecusarProposta] Erro:', err)
      if (mountedRef.current) {
        setRespondendoProposta(false)
        mostrarErro('Erro inesperado ao processar proposta.')
      }
    }
  }

  const formatarHora = (dateStr: string) => new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const formatarData = (dateStr: string) => {
    const data = new Date(dateStr)
    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)
    if (data.toDateString() === hoje.toDateString()) return 'Hoje'
    if (data.toDateString() === ontem.toDateString()) return 'Ontem'
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const mensagensAgrupadas = mensagens.reduce((acc, msg) => {
    const data = formatarData(msg.created_at)
    if (!acc[data]) acc[data] = []
    acc[data].push(msg)
    return acc
  }, {} as Record<string, Mensagem[]>)

  // Locador pode gerar proposta se: não tem proposta OU proposta não está aceita
  const statusProposta = chat?.proposta?.status
  const podeGerarProposta = isLocador && (!statusProposta || statusProposta !== 'aceita')

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile: Voltar para lista */}
            {chatId && (
              <button
                onClick={() => { setShowList(true); navigate('/chats') }}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <HardHat className="w-8 h-8 text-amber-600" />
              <h1 className="text-xl font-bold text-amber-600">LocaObra</h1>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 hidden sm:block text-base font-medium">{nomeUsuario}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main content - Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de chats (lateral esquerda no desktop, tela cheia no mobile) */}
        <aside className={`
          w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex-shrink-0
          ${showList || !chatId ? 'block' : 'hidden lg:block'}
        `}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Conversas</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-140px)]">
            <ChatList
              chats={chats}
              loading={loadingChats}
              selectedChatId={chatId || null}
              onSelectChat={handleSelectChat}
              userId={user?.id}
            />
          </div>
        </aside>

        {/* Área do chat (direita no desktop, tela cheia no mobile) */}
        <main className={`
          flex-1 flex flex-col
          ${!showList || chatId ? 'flex' : 'hidden lg:flex'}
        `}>
          {!chatId ? (
            // Nenhum chat selecionado
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-8">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Selecione uma conversa</h3>
                <p className="text-gray-400">Escolha uma conversa da lista para começar</p>
              </div>
            </div>
          ) : loadingChat ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : !chat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <HardHat className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Chat não encontrado</h2>
              <button onClick={() => navigate('/chats')} className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg">
                Voltar para Conversas
              </button>
            </div>
          ) : (
            <>
              {/* Header do chat */}
              <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">{chat.equipamento?.nome || 'Conversa'}</h2>
                    {statusDoChat && (
                      <p className="text-xs text-gray-500">
                        {statusDoChat.toLowerCase() === 'proposta_aceita' && '✅ Proposta aceita'}
                        {statusDoChat.toLowerCase() === 'proposta_enviada' && '📋 Proposta pendente'}
                        {statusDoChat.toLowerCase() === 'proposta_recusada' && '❌ Proposta recusada'}
                      </p>
                    )}
                  </div>
                </div>
                {podeGerarProposta && (
                  <button
                    onClick={() => setModalPropostaOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar Proposta
                  </button>
                )}
              </div>

              {/* UX 35+: Toast verde de sucesso - grande e visível */}
              {sucesso && (
                <div className="mx-4 mt-2 bg-green-600 text-white px-5 py-4 rounded-xl flex items-center gap-3 shadow-lg animate-pulse">
                  <Check className="w-6 h-6" />
                  <span className="text-lg font-bold">{sucesso}</span>
                  <button onClick={() => setSucesso(null)} className="ml-auto text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              )}

              {/* Toast de erro */}
              {erro && (
                <div className="mx-4 mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm">{erro}</span>
                  <button onClick={() => setErro(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
              )}

              {/* Card com dados da solicitação - visível para LOCADOR e LOCATÁRIO */}
              {chat.quantidade_dias && (
                <div className={`mx-4 mt-4 bg-gradient-to-br ${isLocador ? 'from-amber-50 to-orange-50 border-amber-300' : 'from-blue-50 to-indigo-50 border-blue-300'} border-2 rounded-xl p-4 shadow-md`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <FileText className={`w-5 h-5 ${isLocador ? 'text-amber-600' : 'text-blue-600'}`} />
                      {isLocador ? 'Dados da Solicitação do Cliente' : 'Sua Solicitação'}
                    </h3>
                    {/* Botão Gerar Proposta - só para locador */}
                    {isLocador && podeGerarProposta && (
                      <button
                        onClick={() => setModalPropostaOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-all shadow-md"
                      >
                        <FileText className="w-4 h-4" />
                        Gerar Proposta
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <div>
                        <span className="text-sm text-gray-600">Período: </span>
                        <span className="font-bold text-gray-800">{chat.quantidade_dias} dias</span>
                      </div>
                    </div>

                    {chat.endereco_entrega_logradouro && (
                      <div className="flex items-start gap-2">
                        <MapPin className={`w-4 h-4 mt-0.5 ${isLocador ? 'text-amber-600' : 'text-blue-600'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{chat.endereco_entrega_logradouro}</p>
                          <p className="text-xs text-gray-600">
                            CEP: {chat.endereco_entrega_cep} - {chat.endereco_entrega_cidade}/{chat.endereco_entrega_uf}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Info adicional para locatário */}
                    {!isLocador && !chat.proposta && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          ⏳ Aguardando o locador enviar uma proposta com valores...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CARD DE PROPOSTA PARA CLIENTE - Aparece quando locador enviou proposta */}
              {isLocatario && chat?.proposta && (
                <div className="mx-4 mt-4">
                  <div className={`bg-white rounded-xl shadow-lg border-2 ${
                    chat.proposta.status === 'pendente' ? 'border-orange-300' :
                    chat.proposta.status === 'aceita' ? 'border-green-300' : 'border-red-300'
                  } p-5`}>
                    {/* Header do card */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-full ${
                        chat.proposta.status === 'pendente' ? 'bg-orange-100' :
                        chat.proposta.status === 'aceita' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <FileText className={`w-6 h-6 ${
                          chat.proposta.status === 'pendente' ? 'text-orange-600' :
                          chat.proposta.status === 'aceita' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">Proposta de Locação</h3>
                        <p className={`text-sm font-medium ${
                          chat.proposta.status === 'pendente' ? 'text-orange-600' :
                          chat.proposta.status === 'aceita' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {chat.proposta.status === 'pendente' && '⏳ Aguardando sua resposta'}
                          {chat.proposta.status === 'aceita' && '✅ Proposta aceita'}
                          {chat.proposta.status === 'recusada' && '❌ Proposta recusada'}
                        </p>
                      </div>
                    </div>

                    {/* Detalhes da proposta */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-gray-800">{chat.equipamento?.nome || 'Equipamento'}</span>
                      </div>

                      {chat.proposta.valor_diaria && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Valor da diária:</span>
                          <span className="font-semibold">R$ {chat.proposta.valor_diaria.toFixed(2)}</span>
                        </div>
                      )}

                      {chat.proposta.quantidade_dias && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantidade de dias:</span>
                          <span className="font-semibold">{chat.proposta.quantidade_dias} dias</span>
                        </div>
                      )}

                      {chat.proposta.valor_frete && chat.proposta.valor_frete > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Frete:</span>
                          <span className="font-semibold">R$ {chat.proposta.valor_frete.toFixed(2)}</span>
                        </div>
                      )}

                      {chat.proposta.valor_total && (
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-bold text-gray-800">TOTAL:</span>
                          <span className="font-bold text-xl text-green-600">R$ {chat.proposta.valor_total.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Botões de aceitar/recusar - só aparecem se pendente */}
                    {chat.proposta.status === 'pendente' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRecusarProposta(chat.proposta!.id)}
                          disabled={respondendoProposta}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 text-base font-bold transition-all"
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Recusar</span>
                        </button>
                        <button
                          onClick={() => handleAceitarProposta(chat.proposta!.id)}
                          disabled={respondendoProposta}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 text-base font-bold transition-all"
                        >
                          {respondendoProposta ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                          <span>Aceitar</span>
                        </button>
                      </div>
                    )}

                    {/* Mensagem de sucesso quando aceita */}
                    {chat.proposta.status === 'aceita' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <PartyPopper className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800">Proposta aceita com sucesso!</p>
                          <p className="text-sm text-green-700">O locador irá preparar a entrega do equipamento.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {mensagens.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">Nenhuma mensagem ainda. Inicie a conversa!</div>
                ) : (
                  Object.entries(mensagensAgrupadas).map(([data, msgs]) => (
                    <div key={data}>
                      <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">{data}</span>
                      </div>
                      {msgs.map((msg) => {
                        // RAIO-X: mensagens usa sender_id (não remetente_id) e texto (não conteudo)
                        const isMe = normalizeId(msg.sender_id) === userId
                        const isSystemById = normalizeId(msg.sender_id) === normalizeId(SYSTEM_SENDER_ID)
                        const isSystemByContent = msg.texto.startsWith('✅') || msg.texto.includes('Locação confirmada') || msg.texto.startsWith('❌') || msg.texto.includes('Proposta recusada')
                        const isSystemMessage = isSystemById || isSystemByContent
                        const msgKey = `msg-${msg.id}`


                        if (isSystemMessage) {
                          return (
                            <div key={msgKey} className="flex justify-center my-4">
                              <p className="text-xs text-gray-500 italic text-center max-w-[90%]">{msg.texto}</p>
                            </div>
                          )
                        }

                        return (
                          <div key={msgKey} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-orange-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm'}`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.texto}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>{formatarHora(msg.created_at)}</p>
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
              <div className="bg-white border-t p-3">
                <form onSubmit={handleEnviar} className="flex gap-2">
                  <input
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 outline-none"
                    disabled={enviando}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !novaMensagem.trim()}
                    className="p-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>

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

      <EnderecoModal
        isOpen={modalEnderecoOpen}
        onClose={() => { setModalEnderecoOpen(false); setPropostaParaAceitar(null) }}
        onConfirmar={handleConfirmarEnderecoEAceitar}
        loading={respondendoProposta}
      />

      <SucessoAceiteModal
        isOpen={modalSucessoEnderecoOpen}
        onClose={() => setModalSucessoEnderecoOpen(false)}
      />
    </div>
  )
}
