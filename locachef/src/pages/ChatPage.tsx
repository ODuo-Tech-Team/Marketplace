import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { HardHat, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { useChat, useToast } from '../hooks'
import { normalizeId } from '../utils/chat'
import {
  ChatHeader,
  ChatMessages,
  ChatInput,
  PropostaModal,
  SolicitacaoCard,
  PropostaEnviadaCard,
  PropostaRecebidaCard,
  Toast
} from '../components/chat'

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { enviarMensagem, enviarProposta, fetchProposta, responderProposta, marcarComoEntregue } = useApp()

  const { chat, mensagens, loading, carregarChat, carregarMensagens } = useChat(chatId)
  const { erro, sucesso, mostrarErro, mostrarSucesso, limparErro, limparSucesso } = useToast()

  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [modalPropostaOpen, setModalPropostaOpen] = useState(false)
  const [enviandoProposta, setEnviandoProposta] = useState(false)
  const [respondendoProposta, setRespondendoProposta] = useState(false)
  const [marcandoEntregue, setMarcandoEntregue] = useState(false)
  const [apagandoProposta, setApagandoProposta] = useState(false)

  const inputMensagemRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userId = normalizeId(user?.id)
  const locadorId = normalizeId(chat?.locador_id)
  const isLocador = userId !== '' && locadorId !== '' && userId === locadorId
  const isLocatario = !isLocador

  const statusProposta = chat?.proposta?.status
  const temEndereco = !!chat?.proposta?.endereco_logradouro

  const podeGerarProposta = isLocador && (!statusProposta || statusProposta !== 'aceita')
  const podeResponderProposta = isLocatario && statusProposta === 'pendente'
  const podeConfirmarEntrega = isLocador && statusProposta === 'aceita' && temEndereco

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    setTimeout(() => inputMensagemRef.current?.focus(), 0)
  }

  const handleEnviarProposta = async (dados: { valorDiaria: number; valorFrete: number }) => {
    if (!chatId || !user || !chat) return
    setEnviandoProposta(true)

    const equipamentoId = chat.equipamento?.id || chat.proposta?.equipamento_id
    if (!equipamentoId) {
      mostrarErro('Erro: equipamento não encontrado')
      setEnviandoProposta(false)
      return
    }

    const quantidadeDias = chat.quantidade_dias || 0
    const valorTotal = dados.valorDiaria * quantidadeDias + dados.valorFrete

    const result = await enviarProposta(chatId, user.id, {
      equipamento_id: equipamentoId,
      valor_diaria: dados.valorDiaria,
      quantidade_dias: quantidadeDias,
      valor_frete: dados.valorFrete,
      valor_total: valorTotal
    })

    if (result.success) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      setEnviandoProposta(false)
      setModalPropostaOpen(false)
      await carregarMensagens()
      await carregarChat()
      mostrarSucesso('Proposta enviada com sucesso! Aguarde a resposta do cliente.')
    } else {
      setEnviandoProposta(false)
    }
  }

  const handleAceitarProposta = async (propostaId: string) => {
    if (!chatId || !user) return
    setRespondendoProposta(true)

    try {
      const enderecoExistente = chat?.endereco_entrega_logradouro
        ? {
            cep: chat.endereco_entrega_cep || '',
            logradouro: chat.endereco_entrega_logradouro,
            cidade: chat.endereco_entrega_cidade || '',
            uf: chat.endereco_entrega_uf || ''
          }
        : undefined

      const result = await responderProposta(propostaId, chatId, true, user.id, enderecoExistente)
      setRespondendoProposta(false)

      if (result.success) {
        mostrarSucesso('Proposta aceita com sucesso! O locador irá preparar a entrega.')
        await carregarChat()
      } else {
        mostrarErro(result.error || 'Erro ao aceitar proposta')
      }
    } catch {
      setRespondendoProposta(false)
      mostrarErro('Erro inesperado ao processar proposta.')
    }
  }

  const handleRecusarProposta = async (propostaId: string) => {
    if (!chatId || !user) return
    setRespondendoProposta(true)

    try {
      const result = await responderProposta(propostaId, chatId, false, user.id)
      setRespondendoProposta(false)

      if (result.success) {
        await carregarChat()
        await fetchProposta(propostaId)
      } else {
        mostrarErro(`Erro ao recusar proposta: ${result.error || 'Erro desconhecido'}`)
      }
    } catch {
      setRespondendoProposta(false)
      mostrarErro('Erro inesperado ao processar proposta. Tente novamente.')
    }
  }

  const handleApagarProposta = async (propostaId: string) => {
    if (!chatId || !user) return

    const confirmar = window.confirm(
      'Tem certeza que deseja cancelar esta proposta? Você poderá criar uma nova proposta depois.'
    )
    if (!confirmar) return

    setApagandoProposta(true)

    try {
      const { error } = await supabase.from('propostas').delete().eq('id', propostaId)

      setApagandoProposta(false)

      if (error) {
        mostrarErro(`Erro ao cancelar proposta: ${error.message}`)
        return
      }

      await supabase.from('chats').update({ proposta_id: null }).eq('id', chatId)

      await carregarChat()
      await carregarMensagens()
      mostrarSucesso('Proposta cancelada! Você pode criar uma nova proposta.')
    } catch {
      setApagandoProposta(false)
      mostrarErro('Erro inesperado ao cancelar proposta. Tente novamente.')
    }
  }

  const handleMarcarComoEntregue = async () => {
    if (!chat?.proposta?.id || !chat?.equipamento?.id || !user) return

    setMarcandoEntregue(true)

    try {
      const result = await marcarComoEntregue(chat.proposta.id, chat.equipamento.id)

      if (result.success) {
        mostrarSucesso('Entrega confirmada com sucesso! O equipamento está agora em uso pelo cliente.')
        await carregarChat()
        await carregarMensagens()
      } else {
        mostrarErro(`Erro ao confirmar entrega: ${result.error || 'Erro desconhecido'}`)
      }
    } catch {
      mostrarErro('Erro inesperado ao confirmar entrega. Tente novamente.')
    } finally {
      setMarcandoEntregue(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <HardHat className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Chat não encontrado</h2>
        <p className="text-gray-400 mb-4">
          Este chat pode ter sido removido ou você não tem acesso.
        </p>
        <Link
          to="/chats"
          className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          Voltar para Conversas
        </Link>
      </div>
    )
  }

  const showPropostaEnviadaCard =
    isLocador && chat.proposta && chat.proposta.status === 'pendente' && chat.proposta.valor_total

  const showPropostaRecebidaCard =
    !isLocador && chat.proposta && chat.proposta.status === 'pendente' && chat.proposta.valor_total

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ChatHeader
        equipamentoNome={chat.equipamento?.nome}
        onVoltar={() => navigate(-1)}
        podeGerarProposta={podeGerarProposta}
        podeResponderProposta={podeResponderProposta}
        podeConfirmarEntrega={podeConfirmarEntrega}
        onGerarProposta={() => setModalPropostaOpen(true)}
        onAceitarProposta={() => chat.proposta?.id && handleAceitarProposta(chat.proposta.id)}
        onRecusarProposta={() => chat.proposta?.id && handleRecusarProposta(chat.proposta.id)}
        onConfirmarEntrega={handleMarcarComoEntregue}
        respondendoProposta={respondendoProposta}
        marcandoEntregue={marcandoEntregue}
      />

      <Toast message={sucesso} type="success" onClose={limparSucesso} />
      <Toast message={erro} type="error" onClose={limparErro} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <SolicitacaoCard chat={chat} isLocador={isLocador} />

          {showPropostaEnviadaCard && (
            <PropostaEnviadaCard
              proposta={chat.proposta!}
              onApagar={() => handleApagarProposta(chat.proposta!.id)}
              apagando={apagandoProposta}
            />
          )}

          {showPropostaRecebidaCard && (
            <PropostaRecebidaCard
              proposta={chat.proposta!}
              onAceitar={() => handleAceitarProposta(chat.proposta!.id)}
              onRecusar={() => handleRecusarProposta(chat.proposta!.id)}
              respondendo={respondendoProposta}
            />
          )}

          <ChatMessages mensagens={mensagens} userId={userId} ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput
        ref={inputMensagemRef}
        value={novaMensagem}
        onChange={setNovaMensagem}
        onSubmit={handleEnviar}
        enviando={enviando}
      />

      <PropostaModal
        isOpen={modalPropostaOpen}
        onClose={() => setModalPropostaOpen(false)}
        onEnviar={handleEnviarProposta}
        loading={enviandoProposta}
        equipamentoNome={chat.equipamento?.nome}
        equipamentoPreco={chat.equipamento?.preco_diaria}
        quantidadeDias={chat.quantidade_dias}
      />
    </div>
  )
}
