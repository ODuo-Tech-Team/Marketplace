import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Mensagem, type Chat, type Proposta, type EnderecoEntrega, isChatAberto, ESTADOS_BR } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { HardHat, ArrowLeft, Send, Loader2, X, FileText, Check, XCircle, MapPin, Truck, Copy, Package } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ID especial para mensagens do sistema (usado pela RPC)
const SYSTEM_SENDER_ID = '00000000-0000-0000-0000-000000000000'

// Modal para criar proposta (UX 35+)
// ESTRUTURA REAL DO BANCO: propostas só tem equipamento_id, usuario_id, status
// NÃO TEM: valor_diaria, quantidade_dias, valor_frete, valor_total
function PropostaModal({
  isOpen,
  onClose,
  onEnviar,
  loading,
  equipamentoNome,
  equipamentoPreco
}: {
  isOpen: boolean
  onClose: () => void
  onEnviar: () => Promise<void>
  loading: boolean
  equipamentoNome?: string
  equipamentoPreco?: number
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Confirmar Interesse</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Info do equipamento */}
          <div className="bg-orange-50 p-5 rounded-xl border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-7 h-7 text-orange-600" />
              <span className="font-bold text-gray-800 text-lg">{equipamentoNome || 'Equipamento'}</span>
            </div>
            {equipamentoPreco && (
              <p className="text-2xl font-bold text-orange-600">
                R$ {equipamentoPreco.toFixed(2)}/dia
              </p>
            )}
          </div>

          {/* Explicação */}
          <div className="text-base text-gray-600 space-y-2">
            <p>Ao confirmar, o locador receberá seu interesse neste equipamento.</p>
            <p className="font-medium text-gray-800">Você poderá combinar valores e prazos diretamente pelo chat.</p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-200 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-300 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onEnviar}
              disabled={loading}
              className="flex-1 py-4 bg-orange-600 text-white text-lg font-bold rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
              <span>{loading ? 'Enviando...' : 'Confirmar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal para preencher endereço de entrega ao aceitar proposta
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

  // Busca endereço pelo CEP
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
    // Formata CEP: 00000-000
    const cepLimpo = value.replace(/\D/g, '')
    let cepFormatado = cepLimpo
    if (cepLimpo.length > 5) {
      cepFormatado = `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`
    }
    setCep(cepFormatado)

    // Busca automática quando completar 8 dígitos
    if (cepLimpo.length === 8) {
      buscarCep(cepLimpo)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ESTRUTURA REAL DO BANCO: só tem endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
    // Combina rua, número, complemento e bairro em um único campo 'logradouro'
    const logradouroCompleto = `${rua}, ${numero}${complemento ? ` - ${complemento}` : ''}${bairro ? ` - ${bairro}` : ''}`
    await onConfirmar({
      cep,
      logradouro: logradouroCompleto,
      cidade,
      uf
    })
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
            Informe o endereço para entrega do equipamento. O locador precisará desta informação para realizar o despacho.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP *
            </label>
            <div className="relative">
              <input
                type="text"
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="00000-000"
                maxLength={9}
                required
              />
              {buscandoCep && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-orange-500" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rua/Logradouro *
            </label>
            <input
              type="text"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="Rua, Avenida, etc."
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="123"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="Apto, Bloco, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bairro *
            </label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="Bairro"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="Cidade"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UF *
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
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
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirmar Endereço e Aceitar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// Component reserved for future use
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

  // Função para copiar endereço
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
          {/* Botão Copiar Endereço */}
          <button
            onClick={copiarEndereco}
            className={`mt-4 w-full py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all ${
              copiado
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
            }`}
          >
            {copiado ? (
              <>
                <Check className="w-5 h-5" />
                <span>Endereço Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copiar Endereço</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirmação para locatário que o endereço foi enviado */}
      {proposta.status === 'aceita' && temEndereco && isLocatario && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span className="text-base text-blue-800 font-medium">
              Endereço de entrega enviado ao locador
            </span>
          </div>
        </div>
      )}

      {isLocatario && proposta.status === 'pendente' && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={onRecusar}
            disabled={respondendo}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-base font-bold"
          >
            <XCircle className="w-5 h-5" />
            <span>Recusar</span>
          </button>
          <button
            onClick={onAceitar}
            disabled={respondendo}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-base font-bold"
          >
            {respondendo ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            <span>Aceitar</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const { user } = useAuth()
  const { fetchMensagens, enviarMensagem, fetchChat, enviarProposta, fetchProposta, responderProposta, marcarMensagensComoLidas, marcarComoEntregue } = useApp()

  const [chat, setChat] = useState<Chat | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [modalPropostaOpen, setModalPropostaOpen] = useState(false)
  const [enviandoProposta, setEnviandoProposta] = useState(false)
  const [respondendoProposta, setRespondendoProposta] = useState(false)
  const [marcandoEntregue, setMarcandoEntregue] = useState(false)
  const [erro, setErro] = useState<string | null>(null) // Estado de erro visual
  const [sucesso, setSucesso] = useState<string | null>(null) // Estado de sucesso visual
  // Estados para modal de endereço
  const [modalEnderecoOpen, setModalEnderecoOpen] = useState(false)
  const [propostaParaAceitar, setPropostaParaAceitar] = useState<string | null>(null)

  // Ref para o input de mensagem
  const inputMensagemRef = useRef<HTMLInputElement>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true) // Track se o componente está montado
  const erroTimeoutRef = useRef<number | null>(null) // Timer para limpar erro
  const sucessoTimeoutRef = useRef<number | null>(null) // Timer para limpar sucesso

  // Função para mostrar erro temporário (5 segundos)
  const mostrarErro = (mensagem: string) => {
    // Limpa timeout anterior se existir
    if (erroTimeoutRef.current) {
      clearTimeout(erroTimeoutRef.current)
    }
    setErro(mensagem)
    // Auto-limpa após 5 segundos
    erroTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setErro(null)
      }
    }, 5000)
  }

  // Função para mostrar sucesso temporário (4 segundos)
  const mostrarSucesso = (mensagem: string) => {
    if (sucessoTimeoutRef.current) {
      clearTimeout(sucessoTimeoutRef.current)
    }
    setSucesso(mensagem)
    sucessoTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setSucesso(null)
      }
    }, 4000)
  }

  // Comparação robusta de IDs - converte para string e lowercase
  const normalizeId = (id: string | undefined | null): string => {
    return String(id || '').toLowerCase().trim()
  }

  const userId = normalizeId(user?.id)
  const locadorId = normalizeId(chat?.locador_id)
  const locatarioId = normalizeId(chat?.locatario_id)

  const isLocador = userId !== '' && locadorId !== '' && userId === locadorId

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const carregarChat = async () => {
    if (!chatId || !mountedRef.current) return
    try {
      const chatData = await fetchChat(chatId)
      if (mountedRef.current) {
        setChat(chatData)
      }
    } catch (err) {
      console.error('[ChatPage] Erro ao carregar chat:', err)
    }
  }

  const carregarMensagens = async () => {
    if (!chatId || !mountedRef.current) return
    try {
      const msgs = await fetchMensagens(chatId)
      if (!mountedRef.current) return

      setMensagens(msgs)

      // Marca mensagens como lidas ao carregar o chat
      if (user?.id) {
        marcarMensagensComoLidas(chatId, user.id)
      }

      if (mountedRef.current) {
        setLoading(false)
      }
    } catch (err) {
      console.error('[ChatPage] Erro ao carregar mensagens:', err)
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // Marca como montado
    mountedRef.current = true

    // Reset states quando chatId muda (troca de conta/chat)
    setChat(null)
    setMensagens([])
    setLoading(true)

    if (!chatId) return

    carregarChat()
    carregarMensagens()

    // Configura Realtime para mensagens instantâneas
    const channel: RealtimeChannel = supabase
      .channel(`mensagens-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          console.log('[ChatPage Realtime] Nova mensagem recebida:', payload)
          if (!mountedRef.current) return

          const novaMsgRealtime = payload.new as Mensagem

          // Adiciona a nova mensagem ao estado se não existir
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
      .subscribe((status) => {
        console.log('[ChatPage Realtime] Status da subscription:', status)
      })

    // Configura Realtime para propostas (INSERT e UPDATE)
    const propostasChannel: RealtimeChannel = supabase
      .channel(`propostas-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'propostas'
        },
        async (payload) => {
          console.log('[ChatPage Realtime] Nova proposta criada:', payload)
          if (!mountedRef.current) return

          const novaProposta = payload.new as Proposta

          // Verifica se a proposta pertence ao equipamento deste chat
          if (chat?.equipamento?.id === novaProposta.equipamento_id) {
            console.log('[ChatPage Realtime] Recarregando chat por nova proposta')
            await carregarChat()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'propostas'
        },
        async (payload) => {
          console.log('[ChatPage Realtime] Proposta atualizada:', payload)
          if (!mountedRef.current) return

          const propostaAtualizada = payload.new as Proposta

          // Verifica se a proposta pertence ao equipamento deste chat
          if (chat?.equipamento?.id === propostaAtualizada.equipamento_id) {
            console.log('[ChatPage Realtime] Recarregando chat por atualização de proposta')
            await carregarChat()
          }
        }
      )
      .subscribe((status) => {
        console.log('[ChatPage Realtime Propostas] Status:', status)
      })

    // Polling como fallback (intervalo maior já que temos Realtime)
    const interval = setInterval(() => {
      if (chatId && mountedRef.current) {
        carregarChat() // Só atualiza o chat status
      }
    }, 5000)

    // Cleanup: marca como desmontado antes de limpar
    return () => {
      mountedRef.current = false
      clearInterval(interval)
      // Remove subscriptions do Realtime
      supabase.removeChannel(channel)
      supabase.removeChannel(propostasChannel)
      // Limpa timeouts se existirem
      if (erroTimeoutRef.current) {
        clearTimeout(erroTimeoutRef.current)
      }
      if (sucessoTimeoutRef.current) {
        clearTimeout(sucessoTimeoutRef.current)
      }
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMensagem.trim() || !chatId || !user) return

    setEnviando(true)
    const result = await enviarMensagem(chatId, user.id, novaMensagem.trim())

    if (result.success) {
      setNovaMensagem('')
      await carregarMensagens()
    }

    setEnviando(false)

    // Mantém o foco no input após enviar (usando setTimeout para garantir que o React terminou de renderizar)
    setTimeout(() => {
      if (inputMensagemRef.current) {
        inputMensagemRef.current.focus()
      }
    }, 0)
  }

  // ESTRUTURA REAL DO BANCO: propostas só tem equipamento_id
  // O equipamento_id vem do chat atual (chat.proposta.equipamento_id ou chat.equipamento?.id)
  const handleEnviarProposta = async () => {
    if (!chatId || !user || !chat) return
    setEnviandoProposta(true)

    // Pega o equipamento_id do chat atual
    const equipamentoId = chat.equipamento?.id || chat.proposta?.equipamento_id
    if (!equipamentoId) {
      setErro('Erro: equipamento não encontrado')
      setEnviandoProposta(false)
      return
    }

    const result = await enviarProposta(chatId, user.id, { equipamento_id: equipamentoId })

    if (result.success) {
      // Delay para permitir que o React processe a remoção do loader
      await new Promise(resolve => setTimeout(resolve, 100))
      setEnviandoProposta(false)
      setModalPropostaOpen(false)
      await carregarMensagens()
      await carregarChat()
      mostrarSucesso('✅ Proposta enviada com sucesso! Aguarde a resposta do cliente.')
    } else {
      setEnviandoProposta(false)
    }
  }

  // Quando clica em aceitar, abre modal de endereço
  // Function reserved for future use
  const handleAceitarProposta = (propostaId: string) => {
    setPropostaParaAceitar(propostaId)
    setModalEnderecoOpen(true)
  }

  // Quando confirma o endereço e aceita a proposta
  const handleConfirmarEnderecoEAceitar = async (endereco: EnderecoEntrega) => {
    if (!chatId || !user || !mountedRef.current || !propostaParaAceitar) return

    setRespondendoProposta(true)

    try {
      // Chama responderProposta com o endereço
      const result = await responderProposta(propostaParaAceitar, chatId, true, user.id, endereco)

      if (!mountedRef.current) return

      setRespondendoProposta(false)

      if (result.success) {
        // Fecha modal e limpa estado
        setModalEnderecoOpen(false)
        setPropostaParaAceitar(null)

        // Mostra feedback de sucesso - UX 35+
        mostrarSucesso('✅ Endereço enviado com sucesso! Aguarde a confirmação de entrega do locador.')

        // Atualiza a proposta localmente
        // ESTRUTURA REAL: só tem endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
        // setPropostas(prev => ({
        //   ...prev,
        //   [propostaParaAceitar]: {
        //     ...prev[propostaParaAceitar],
        //     status: 'aceita' as const,
        //     endereco_cep: endereco.cep,
        //     endereco_logradouro: endereco.logradouro,
        //     endereco_cidade: endereco.cidade,
        //     endereco_uf: endereco.uf
        //   }
        // }))

        // Recarrega dados do servidor
        await carregarChat()
        await fetchProposta(propostaParaAceitar)
        // if (propostaAtualizada && mountedRef.current) {
        //   setPropostas(prev => ({
        //     ...prev,
        //     [propostaParaAceitar]: propostaAtualizada
        //   }))
        // }
      } else {
        mostrarErro(`Erro ao aceitar proposta: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (err) {
      console.error('[handleConfirmarEnderecoEAceitar] Erro:', err)
      if (mountedRef.current) {
        setRespondendoProposta(false)
        mostrarErro('Erro inesperado ao processar proposta. Tente novamente.')
      }
    }
  }

  // Para recusar proposta (sem endereço)
  // Function reserved for future use
  const handleRecusarProposta = async (propostaId: string) => {
    if (!chatId || !user || !mountedRef.current) return

    setErro(null)
    setRespondendoProposta(true)

    try {
      const result = await responderProposta(propostaId, chatId, false, user.id)

      if (!mountedRef.current) return

      setRespondendoProposta(false)

      if (result.success) {
        // setPropostas(prev => ({
        //   ...prev,
        //   [propostaId]: { ...prev[propostaId], status: 'recusada' as const }
        // }))

        if (mountedRef.current) {
          await carregarChat()
          await fetchProposta(propostaId)
          // if (propostaAtualizada && mountedRef.current) {
          //   setPropostas(prev => ({
          //     ...prev,
          //     [propostaId]: propostaAtualizada
          //   }))
          // }
        }
      } else {
        mostrarErro(`Erro ao recusar proposta: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (err) {
      console.error('[handleRecusarProposta] Erro:', err)
      if (mountedRef.current) {
        setRespondendoProposta(false)
        mostrarErro('Erro inesperado ao processar proposta. Tente novamente.')
      }
    }
  }

  // Handler para locador marcar como entregue
  const handleMarcarComoEntregue = async () => {
    if (!chat?.proposta?.id || !chat?.equipamento?.id || !user) return

    setMarcandoEntregue(true)

    try {
      const result = await marcarComoEntregue(chat.proposta.id, chat.equipamento.id)

      if (result.success) {
        mostrarSucesso('✅ Entrega confirmada com sucesso! O equipamento está agora em uso pelo cliente.')
        await carregarChat()
        await carregarMensagens()
      } else {
        mostrarErro(`Erro ao confirmar entrega: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (err) {
      console.error('[handleMarcarComoEntregue] Erro:', err)
      mostrarErro('Erro inesperado ao confirmar entrega. Tente novamente.')
    } finally {
      setMarcandoEntregue(false)
    }
  }

  // Handler para locatário aceitar proposta (abre modal de endereço)
  const handleAceitarPropostaHeader = () => {
    if (!chat?.proposta?.id) return
    setPropostaParaAceitar(chat.proposta.id)
    setModalEnderecoOpen(true)
  }

  const formatarHora = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatarData = (dateStr: string) => {
    const data = new Date(dateStr)
    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)

    if (data.toDateString() === hoje.toDateString()) {
      return 'Hoje'
    } else if (data.toDateString() === ontem.toDateString()) {
      return 'Ontem'
    } else {
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }

  // Agrupa mensagens por data
  const mensagensAgrupadas = mensagens.reduce((acc, msg) => {
    const data = formatarData(msg.created_at)
    if (!acc[data]) {
      acc[data] = []
    }
    acc[data].push(msg)
    return acc
  }, {} as Record<string, Mensagem[]>)

  // ============================================
  // LÓGICA DE BOTÕES - CORRIGIDA PELO SENIOR
  // ============================================

  // Define quem é quem
  const isLocatario = !isLocador

  // Status da proposta (pode ser undefined se não existe proposta ainda)
  const statusProposta = chat?.proposta?.status
  const temEndereco = !!chat?.proposta?.endereco_logradouro

  console.log('🔍 DEBUG CHAT STATE:', {
    userId,
    locadorId,
    locatarioId,
    isLocador,
    isLocatario,
    statusProposta,
    temEndereco,
    proposta: chat?.proposta
  })

  // BOTÃO 1: Gerar Proposta (LOCADOR)
  // Aparece quando: é locador E (não tem proposta OU proposta não está aceita)
  const podeGerarProposta = isLocador && (!statusProposta || statusProposta !== 'aceita')

  // BOTÃO 2: Enviar Endereço (LOCATÁRIO) - CORREÇÃO CRÍTICA
  // Aparece quando: é locatário E proposta está pendente
  // IMPORTANTE: Mesmo que statusProposta seja undefined, se existir chat.proposta, considera como pendente
  const podeEnviarEndereco = isLocatario && (statusProposta === 'pendente' || (chat?.proposta && !statusProposta))

  // BOTÃO 3: Confirmar Entrega (LOCADOR)
  // Aparece quando: é locador E proposta aceita E tem endereço
  const podeConfirmarEntrega = isLocador && statusProposta === 'aceita' && temEndereco

  console.log('✅ BOTÕES DISPONÍVEIS:', {
    podeGerarProposta,
    podeEnviarEndereco,
    podeConfirmarEntrega
  })

  // Tratamento de loading - wrapper com altura mínima para estabilidade do DOM
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center justify-center min-h-[100px]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </div>
    )
  }

  // Tratamento de chat não encontrado
  if (!chat) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <HardHat className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Chat não encontrado</h2>
        <p className="text-gray-400 mb-4">Este chat pode ter sido removido ou você não tem acesso.</p>
        <Link
          to="/chats"
          className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          Voltar para Conversas
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/chats"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {chat.equipamento?.nome || 'Conversa'}
              </h1>
            </div>
          </div>

          {/* ============================================ */}
          {/* BOTÕES DE AÇÃO - UX 35+ OLX STYLE */}
          {/* ============================================ */}

          {/* BOTÃO 1: Gerar Proposta (LOCADOR) */}
          {podeGerarProposta && (
            <button
              onClick={() => setModalPropostaOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white text-lg font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
            >
              <FileText className="w-6 h-6" />
              Gerar Proposta
            </button>
          )}

          {/* BOTÃO 2: Enviar Endereço (LOCATÁRIO) - DESTAQUE LARANJA OLX */}
          {podeEnviarEndereco && (
            <button
              onClick={handleAceitarPropostaHeader}
              disabled={respondendoProposta}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-lg font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {respondendoProposta ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <MapPin className="w-6 h-6" />
              )}
              {respondendoProposta ? 'Enviando...' : 'Enviar Endereço para Entrega'}
            </button>
          )}

          {/* BOTÃO 3: Confirmar Entrega (LOCADOR) */}
          {podeConfirmarEntrega && (
            <button
              onClick={handleMarcarComoEntregue}
              disabled={marcandoEntregue}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {marcandoEntregue ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Truck className="w-6 h-6" />
              )}
              {marcandoEntregue ? 'Confirmando...' : 'Confirmar Entrega Realizada'}
            </button>
          )}
        </div>
      </header>

      {/* UX 35+: Toast verde de sucesso - grande e visível */}
      {sucesso && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-start gap-3 animate-pulse">
            <Check className="w-7 h-7 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-lg font-bold">Sucesso!</p>
              <p className="text-base mt-1">{sucesso}</p>
            </div>
            <button
              onClick={() => setSucesso(null)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Toast de erro */}
      {erro && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Erro</p>
              <p className="text-sm mt-1">{erro}</p>
            </div>
            <button
              onClick={() => setErro(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {mensagens.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              Nenhuma mensagem ainda. Inicie a conversa!
            </div>
          ) : (
            Object.entries(mensagensAgrupadas).map(([data, msgs]) => (
              <div key={data}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                    {data}
                  </span>
                </div>

                {/* Messages for this date */}
                {msgs.map((msg) => {
                  // RAIO-X: mensagens usa sender_id (não remetente_id) e texto (não conteudo)
                  const isMe = normalizeId(msg.sender_id) === userId
                  // Identifica mensagem de sistema por ID OU por conteúdo
                  const isSystemById = normalizeId(msg.sender_id) === normalizeId(SYSTEM_SENDER_ID)
                  const isSystemByContent = msg.texto.startsWith('✅') ||
                                           msg.texto.includes('Locação confirmada') ||
                                           msg.texto.startsWith('❌') ||
                                           msg.texto.includes('Proposta recusada')
                  const isSystemMessage = isSystemById || isSystemByContent

                  // Key estável baseada no ID da mensagem
                  const msgKey = `msg-${msg.id}`

                  // Se for mensagem do tipo proposta, renderiza o card

                  // Mensagem do sistema - estilo profissional de aviso centralizado
                  if (isSystemMessage) {
                    return (
                      <div key={msgKey} className="flex justify-center my-4">
                        <p className="text-xs text-gray-500 italic text-center max-w-[90%]">
                          {msg.texto}
                        </p>
                      </div>
                    )
                  }

                  // Mensagem normal (usuário)
                  return (
                    <div
                      key={msgKey}
                      className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-orange-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.texto}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? 'text-orange-200' : 'text-gray-400'
                          }`}
                        >
                          {formatarHora(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="bg-white border-t sticky bottom-0">
        <form
          onSubmit={handleEnviar}
          className="max-w-3xl mx-auto px-4 py-3 flex gap-2"
        >
          <input
            ref={inputMensagemRef}
            type="text"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={enviando || !novaMensagem.trim()}
            className="p-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Loader2
                className={`w-5 h-5 animate-spin transition-opacity duration-150 ${enviando ? 'opacity-100' : 'opacity-0'}`}
                style={{ position: enviando ? 'relative' : 'absolute' }}
              />
              <Send
                className={`w-5 h-5 transition-opacity duration-150 ${enviando ? 'opacity-0 absolute' : 'opacity-100'}`}
              />
            </div>
          </button>
        </form>
      </div>

      <PropostaModal
        isOpen={modalPropostaOpen}
        onClose={() => setModalPropostaOpen(false)}
        onEnviar={handleEnviarProposta}
        loading={enviandoProposta}
        equipamentoNome={chat?.equipamento?.nome}
        equipamentoPreco={chat?.equipamento?.preco_diaria}
      />

      <EnderecoModal
        isOpen={modalEnderecoOpen}
        onClose={() => {
          setModalEnderecoOpen(false)
          setPropostaParaAceitar(null)
        }}
        onConfirmar={handleConfirmarEnderecoEAceitar}
        loading={respondendoProposta}
      />
    </div>
  )
}
