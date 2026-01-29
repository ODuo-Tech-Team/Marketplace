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
import { ChatStatusBar } from '../components/chat/ChatStatusBar'

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { enviarMensagem, enviarProposta, fetchProposta, responderProposta, marcarComoEntregue, despacharEquipamento, confirmarRetorno } = useApp()

  const { chat, mensagens, loading, carregarChat, carregarMensagens } = useChat(chatId)
  const { erro, sucesso, mostrarErro, mostrarSucesso, limparErro, limparSucesso } = useToast()

  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [modalPropostaOpen, setModalPropostaOpen] = useState(false)
  const [enviandoProposta, setEnviandoProposta] = useState(false)
  const [respondendoProposta, setRespondendoProposta] = useState(false)
  const [marcandoEntregue, setMarcandoEntregue] = useState(false)
  const [apagandoProposta, setApagandoProposta] = useState(false)
  const [despachando, setDespachando] = useState(false)
  const [confirmandoDevolucao, setConfirmandoDevolucao] = useState(false)

  const inputMensagemRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userId = normalizeId(user?.id)
  const locadorId = normalizeId(chat?.locador_id)
  const isLocador = userId !== '' && locadorId !== '' && userId === locadorId
  const isLocatario = !isLocador

  const statusProposta = chat?.proposta?.status
  const temEndereco = !!chat?.proposta?.endereco_logradouro
  const statusEquipamento = chat?.equipamento?.status?.toUpperCase()
  const equipamentoDisponivel = !statusEquipamento || statusEquipamento === 'DISPONIVEL'

  // Locador pode gerar proposta SEMPRE se:
  // 1. É locador
  // 2. Equipamento está disponível
  // 3. NÃO tem proposta pendente ou aceita ativa
  const propostaAtiva = statusProposta === 'pendente' || statusProposta === 'aceita'
  const podeGerarProposta = isLocador && equipamentoDisponivel && !propostaAtiva
  const isReLocacao = podeGerarProposta && statusProposta === 'finalizada'
  const podeResponderProposta = isLocatario && statusProposta === 'pendente'
  // Despachar: locador pode enviar quando RESERVADO (proposta aceita, aguardando envio)
  const podeDespachar = isLocador && statusEquipamento === 'RESERVADO'
  // Confirmar entrega: locador pode confirmar quando EM_TRANSITO (legado)
  const podeConfirmarEntrega = isLocador && statusEquipamento === 'EM_TRANSITO'
  // Confirmar devolução: locador pode confirmar quando OCUPADO ou EM_TRANSITO
  const podeConfirmarDevolucao = isLocador && (statusEquipamento === 'OCUPADO' || statusEquipamento === 'EM_TRANSITO')

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

  const handleEnviarProposta = async (dados: {
    valorDiaria: number
    valorFrete: number
    desconto?: number
    taxaExtra?: number
    dataInicio?: string
    dataFim?: string
  }) => {
    if (!chatId || !user || !chat) return
    setEnviandoProposta(true)

    const equipamentoId = chat.equipamento?.id || chat.proposta?.equipamento_id
    if (!equipamentoId) {
      mostrarErro('Erro: equipamento não encontrado')
      setEnviandoProposta(false)
      return
    }

    // Calcular dias a partir das datas se disponivel
    let diasCalc = chat.quantidade_dias || 0
    if (dados.dataInicio && dados.dataFim) {
      const d1 = new Date(dados.dataInicio)
      const d2 = new Date(dados.dataFim)
      diasCalc = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)))
    }

    const subtotal = dados.valorDiaria * diasCalc
    const valorTotal = subtotal + dados.valorFrete - (dados.desconto || 0) + (dados.taxaExtra || 0)

    const result = await enviarProposta(chatId, user.id, {
      equipamento_id: equipamentoId,
      valor_diaria: dados.valorDiaria,
      quantidade_dias: diasCalc,
      valor_frete: dados.valorFrete,
      valor_total: valorTotal,
      desconto: dados.desconto,
      taxa_extra: dados.taxaExtra,
      data_inicio: dados.dataInicio,
      data_fim: dados.dataFim,
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

  const handleAceitarProposta = async (propostaId: string, endereco?: { logradouro: string; cep: string; cidade: string; uf: string }) => {
    if (!chatId || !user) return
    setRespondendoProposta(true)

    try {
      const result = await responderProposta(propostaId, chatId, true, user.id, endereco)
      setRespondendoProposta(false)

      if (result.success) {
        mostrarSucesso('Proposta aceita! Endereco cadastrado com sucesso. Aguarde a entrega.')
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

  const handleDespachar = async () => {
    if (!chat?.proposta?.id || !chat?.equipamento?.id) return

    setDespachando(true)
    try {
      const result = await despacharEquipamento(chat.proposta.id, chat.equipamento.id)

      if (result.success) {
        mostrarSucesso('Equipamento despachado! O cliente sera notificado.')
        await carregarChat()
        await carregarMensagens()
      } else {
        mostrarErro(`Erro ao despachar: ${result.error || 'Erro desconhecido'}`)
      }
    } catch {
      mostrarErro('Erro inesperado ao despachar equipamento.')
    } finally {
      setDespachando(false)
    }
  }

  const handleConfirmarDevolucao = async () => {
    if (!chat?.proposta?.id || !chat?.equipamento?.id) return

    const confirmar = window.confirm('Confirma que o equipamento foi devolvido?')
    if (!confirmar) return

    setConfirmandoDevolucao(true)
    try {
      const result = await confirmarRetorno(chat.proposta.id, chat.equipamento.id)

      if (result.success) {
        mostrarSucesso('Devolução confirmada! Equipamento disponível novamente.')
        await carregarChat()
        await carregarMensagens()
      } else {
        mostrarErro(`Erro ao confirmar devolução: ${result.error || 'Erro desconhecido'}`)
      }
    } catch {
      mostrarErro('Erro inesperado ao confirmar devolução.')
    } finally {
      setConfirmandoDevolucao(false)
    }
  }

  // Estado de carregamento: confia no retry interno do useChat (8 tentativas)
  // Não precisa de retry adicional aqui para evitar loop infinito
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className="text-gray-600 font-medium">Carregando conversa...</p>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <HardHat className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Chat não encontrado</h2>
        <p className="text-gray-400 mb-4 text-center">
          Este chat pode ter sido removido ou você não tem acesso.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => carregarChat()}
            className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            Tentar Novamente
          </button>
          <Link
            to="/chats"
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Voltar para Conversas
          </Link>
        </div>
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
        equipamentoCategoria={chat.equipamento?.categoria ?? undefined}
        equipamentoAno={chat.equipamento?.ano}
        equipamentoHorimetro={chat.equipamento?.horimetro_atual}
        equipamentoPeso={chat.equipamento?.peso_operacional}
        nomeContraparte={isLocador ? chat.locatario_nome : chat.locador_nome}
        isLocador={isLocador}
        onVoltar={() => navigate(-1)}
        podeGerarProposta={podeGerarProposta}
        podeResponderProposta={podeResponderProposta}
        podeConfirmarEntrega={podeConfirmarEntrega}
        podeDespachar={podeDespachar}
        podeConfirmarDevolucao={podeConfirmarDevolucao}
        isReLocacao={isReLocacao}
        onGerarProposta={() => setModalPropostaOpen(true)}
        onAceitarProposta={() => chat.proposta?.id && handleAceitarProposta(chat.proposta.id)}
        onRecusarProposta={() => chat.proposta?.id && handleRecusarProposta(chat.proposta.id)}
        onConfirmarEntrega={handleMarcarComoEntregue}
        onDespachar={handleDespachar}
        onConfirmarDevolucao={handleConfirmarDevolucao}
        respondendoProposta={respondendoProposta}
        marcandoEntregue={marcandoEntregue}
        despachando={despachando}
        confirmandoDevolucao={confirmandoDevolucao}
      />

      <ChatStatusBar
        propostaStatus={chat.proposta?.status}
        equipamentoStatus={chat.equipamento?.status}
        hasProposal={!!chat.proposta}
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
              onAceitar={(endereco) => handleAceitarProposta(chat.proposta!.id, endereco)}
              onRecusar={() => handleRecusarProposta(chat.proposta!.id)}
              respondendo={respondendoProposta}
              enderecoExistente={chat.endereco_entrega_logradouro ? {
                logradouro: chat.endereco_entrega_logradouro,
                cep: chat.endereco_entrega_cep || '',
                cidade: chat.endereco_entrega_cidade || '',
                uf: chat.endereco_entrega_uf || ''
              } : undefined}
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
