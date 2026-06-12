import { createContext, useContext, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { SYSTEM_SENDER_ID } from '../utils/chat'
import { EquipamentoProvider, useEquipamento } from './EquipamentoContext'
import { NotificacaoProvider, useNotificacoes } from './NotificacaoContext'

// Re-export all types for backwards compatibility
// Consumers can still do: import { Equipamento } from './contexts/AppContext'
export type {
  Equipamento,
  NovoEquipamento,
  EquipmentStatus,
  InspectionPhotoPosition,
  InspectionPhoto,
  InspectionData,
  Chat,
  Mensagem,
  ArquivoChat,
  Proposta,
  NovaProposta,
  Review,
  EnderecoEntrega,
  Consumivel,
  PropostaConsumivel,
  EntregaPendente,
} from '../types'

export {
  EQUIPMENT_STATUS,
  INSPECTION_PHOTO_POSITIONS,
  TIPOS_ARQUIVO_PERMITIDOS,
  TAMANHO_MAX_ARQUIVO,
} from '../types'

// Re-export helpers that were in AppContext
import type { Equipamento } from '../types'
export { isEquipamentoDisponivel, getLocadorDisplayName, getEquipamentoImageUrl } from './appHelpers'

// Re-export constants
export { CATEGORIAS, CATEGORIAS_LINHA_AMARELA, isLinhaAmarela, CATEGORIA_CORES, TIPOS_VEICULO_TRANSPORTE, VOLTAGENS, STATUS_CHAT_ABERTO, isChatAberto, ESTADOS_BR } from './appConstants'

// Import types used in this file
import type {
  Chat,
  Mensagem,
  Proposta,
  NovaProposta,
  EnderecoEntrega,
  ArquivoChat,
  InspectionPhoto,
  InspectionPhotoPosition,
  InspectionData,
  NovoEquipamento,
  Consumivel,
  PropostaConsumivel,
  EntregaPendente,
} from '../types'
import type { VerticalKey } from '../config/verticals'

// ===== AppContext type: aggregates all sub-contexts =====

interface AppContextType {
  // From EquipamentoContext
  equipamentos: Equipamento[]
  loadingEquipamentos: boolean
  refetchEquipamentos: () => Promise<void>
  activeVertical: VerticalKey | 'todos'
  setActiveVertical: (v: VerticalKey | 'todos') => void
  addEquipamento: (dados: NovoEquipamento, locadorId: string) => Promise<{ success: boolean; error?: string }>
  fetchMeusEquipamentos: (locadorId: string) => Promise<Equipamento[]>
  uploadImagens: (files: File[], locadorId: string) => Promise<{ urls: string[]; error?: string }>
  deletarEquipamento: (equipamentoId: string, locadorId: string) => Promise<{ success: boolean; error?: string }>
  atualizarEquipamento: (equipamentoId: string, dados: NovoEquipamento, locadorId: string) => Promise<{ success: boolean; error?: string }>
  toggleDestaque: (equipamentoId: string, destaque: boolean) => Promise<{ success: boolean; error?: string }>
  fetchEquipamentoById: (id: string) => Promise<Equipamento | null>
  fetchConsumiveis: (equipamentoId: string) => Promise<Consumivel[]>
  addConsumivel: (equipamentoId: string, nome: string, preco: number) => Promise<{ success: boolean; error?: string }>
  removeConsumivel: (consumivelId: string) => Promise<{ success: boolean; error?: string }>
  salvarConsumiveisProposta: (propostaId: string, items: { consumivel_id: string; quantidade: number; preco_unitario: number }[]) => Promise<{ success: boolean; error?: string }>
  fetchConsumiveisProposta: (propostaId: string) => Promise<PropostaConsumivel[]>
  uploadInspectionPhotos: (files: Map<InspectionPhotoPosition, File>, locadorId: string, propostaId: string) => Promise<{ photos: InspectionPhoto[]; error?: string }>
  saveInspectionAndDispatch: (propostaId: string, equipamentoId: string, chatId: string, inspection: InspectionData) => Promise<{ success: boolean; error?: string }>
  uploadArquivoChat: (file: File, chatId: string, senderId: string) => Promise<{ arquivo: ArquivoChat | null; error?: string }>
  // From NotificacaoContext
  mensagensNaoLidas: number
  fetchMensagensNaoLidas: (userId: string) => Promise<number>
  marcarMensagensComoLidas: (chatId: string, userId: string) => Promise<void>
  setupMensagensRealtime: (userId: string) => void
  // Chat & Proposal functions (kept in AppContext - cross-context dependencies)
  iniciarChat: (equipamentoId: string, locadorId: string, locatarioId: string, mensagemInicial: string, dadosSolicitacao?: { quantidadeDias: number; endereco: { logradouro: string; cep: string; cidade: string; uf: string }; precisaOperador?: boolean }) => Promise<{ success: boolean; chatId?: string; error?: string }>
  enviarMensagem: (chatId: string, senderId: string, texto: string) => Promise<{ success: boolean; error?: string }>
  fetchMensagens: (chatId: string) => Promise<Mensagem[]>
  fetchMeusChats: (userId: string) => Promise<Chat[]>
  fetchChatExistente: (equipamentoId: string, locatarioId: string) => Promise<string | null>
  fetchChat: (chatId: string) => Promise<Chat | null>
  enviarProposta: (chatId: string, locadorId: string, dados: NovaProposta) => Promise<{ success: boolean; error?: string }>
  fetchProposta: (propostaId: string) => Promise<Proposta | null>
  responderProposta: (propostaId: string, chatId: string, aceitar: boolean, userId: string, endereco?: EnderecoEntrega) => Promise<{ success: boolean; error?: string }>
  atualizarEnderecoNaProposta: (propostaId: string, endereco: EnderecoEntrega) => Promise<{ success: boolean; error?: string }>
  fetchEntregasPendentes: (locadorId: string) => Promise<EntregaPendente[]>
  marcarComoEntregue: (propostaId: string, equipamentoId: string) => Promise<{ success: boolean; error?: string }>
  despacharEquipamento: (propostaId: string, equipamentoId: string) => Promise<{ success: boolean; error?: string }>
  confirmarRetorno: (propostaId: string, equipamentoId: string, horimetroDados?: { horimetro_chegada?: number; horimetro_chegada_foto?: string }) => Promise<{ success: boolean; error?: string }>
  editarProposta: (propostaId: string, dados: Partial<NovaProposta>) => Promise<{ success: boolean; error?: string }>
  enviarMensagemComArquivo: (chatId: string, senderId: string, arquivo: ArquivoChat, texto?: string) => Promise<{ success: boolean; error?: string }>
  // Reviews
  submitReview: (rentalId: string, reviewerId: string, targetId: string, rating: number, comment: string) => Promise<{ success: boolean; error?: string }>
  fetchLocadorReviews: (locadorId: string) => Promise<import('../types').Review[]>
  checkReviewExists: (rentalId: string) => Promise<boolean>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// ===== Inner provider: chat, proposal, review, delivery logic =====

function AppInnerProvider({ children }: { children: ReactNode }) {
  const equipamentoCtx = useEquipamento()
  const notificacaoCtx = useNotificacoes()

  // ===== CHAT FUNCTIONS =====

  const garantirPerfilExiste = async (userId: string): Promise<boolean> => {
    try {
      const { data: profile, error: checkError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', userId)
        .single()

      if (profile) {
        if (!profile.full_name) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.user_metadata?.full_name) {
            await supabase.from('profiles').update({ full_name: user.user_metadata.full_name }).eq('id', userId)
          }
        }
        return true
      }

      if (checkError?.code === 'PGRST116') {
        const { data: { user } } = await supabase.auth.getUser()
        const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || null

        const { error: insertError } = await supabase.from('profiles').insert({
          id: userId, email: user?.email || '', full_name: fullName,
          tipo_usuario: user?.user_metadata?.tipo_usuario || 'locatario', role: 'customer'
        })

        if (insertError) {
          return insertError.code === '23505'
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const fetchChatExistente = async (equipamentoId: string, locatarioId: string): Promise<string | null> => {
    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('id, proposta_id')
        .eq('equipamento_id', equipamentoId)
        .eq('locatario_id', locatarioId)
        .order('created_at', { ascending: false })

      if (error || !chats || chats.length === 0) return null

      for (const chat of chats) {
        if (!chat.proposta_id) return chat.id
        const { data: proposta } = await supabase.from('propostas').select('status').eq('id', chat.proposta_id).single()
        if (proposta && proposta.status !== 'FINALIZADA') return chat.id
      }
      return null
    } catch {
      return null
    }
  }

  const enviarMensagem = async (chatId: string, senderId: string, texto: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('mensagens').insert({ chat_id: chatId, sender_id: senderId, texto })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao enviar mensagem' }
    }
  }

  const iniciarChat = async (
    equipamentoId: string, locadorId: string, locatarioId: string, mensagemInicial: string,
    dadosSolicitacao?: { quantidadeDias: number; endereco: { logradouro: string; cep: string; cidade: string; uf: string }; precisaOperador?: boolean }
  ): Promise<{ success: boolean; chatId?: string; error?: string }> => {
    try {
      const chatExistente = await fetchChatExistente(equipamentoId, locatarioId)
      if (chatExistente) {
        await enviarMensagem(chatExistente, locatarioId, mensagemInicial)
        return { success: true, chatId: chatExistente }
      }

      const perfilOk = await garantirPerfilExiste(locatarioId)
      if (!perfilOk) return { success: false, error: 'Erro ao verificar seu perfil. Tente fazer logout e login novamente.' }

      const chatInsert: Record<string, unknown> = {
        equipamento_id: equipamentoId, locador_id: locadorId, locatario_id: locatarioId
      }

      if (dadosSolicitacao) {
        chatInsert.quantidade_dias = dadosSolicitacao.quantidadeDias
        chatInsert.endereco_entrega_logradouro = dadosSolicitacao.endereco.logradouro
        chatInsert.endereco_entrega_cep = dadosSolicitacao.endereco.cep
        chatInsert.endereco_entrega_cidade = dadosSolicitacao.endereco.cidade
        chatInsert.endereco_entrega_uf = dadosSolicitacao.endereco.uf
        if (dadosSolicitacao.precisaOperador) chatInsert.precisa_operador = true
      }

      const { data: chatData, error: chatError } = await supabase
        .from('chats').insert(chatInsert).select('id').single()

      if (chatError || !chatData) return { success: false, error: chatError?.message || 'Erro ao criar chat' }

      await supabase.from('mensagens').insert({ chat_id: chatData.id, sender_id: locatarioId, texto: mensagemInicial })

      const MAX_VERIFICACOES = 5
      for (let tentativa = 1; tentativa <= MAX_VERIFICACOES; tentativa++) {
        const { data: verificacao, error: verifError } = await supabase.from('chats').select('id').eq('id', chatData.id).single()
        if (verificacao && !verifError) return { success: true, chatId: chatData.id }
        await new Promise((resolve) => setTimeout(resolve, 400))
      }
      return { success: true, chatId: chatData.id }
    } catch {
      return { success: false, error: 'Erro inesperado ao iniciar chat' }
    }
  }

  const fetchMensagens = async (chatId: string): Promise<Mensagem[]> => {
    try {
      const { data, error } = await supabase.from('mensagens').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
      if (error) return []
      return data || []
    } catch {
      return []
    }
  }

  const fetchChat = async (chatId: string): Promise<Chat | null> => {
    try {
      const { data, error } = await supabase.from('chats').select('*, equipamento:equipamentos(*)').eq('id', chatId).single()

      if (error) {
        const { data: chatData, error: chatError } = await supabase.from('chats').select('*').eq('id', chatId).single()
        if (chatError || !chatData) return null

        let eqData = null
        if (chatData.equipamento_id) {
          const { data: eq } = await supabase.from('equipamentos').select('*').eq('id', chatData.equipamento_id).single()
          eqData = eq
        }

        let propostaData = null
        if (chatData.proposta_id) {
          const { data: prop } = await supabase.from('propostas').select('*').eq('id', chatData.proposta_id).single()
          propostaData = prop
        } else if (chatData.equipamento_id) {
          const { data: prop } = await supabase.from('propostas').select('*').eq('equipamento_id', chatData.equipamento_id).eq('usuario_id', chatData.locatario_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
          propostaData = prop
        }

        const userIds = [chatData.locador_id, chatData.locatario_id].filter(Boolean)
        let locadorNome: string | undefined
        let locatarioNome: string | undefined

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase.from('profiles').select('id, full_name, nome_empresa, email').in('id', userIds)
          if (profilesData) {
            for (const p of profilesData) {
              const nome = p.nome_empresa || p.full_name || p.email || 'Usuario'
              if (p.id === chatData.locador_id) locadorNome = nome
              if (p.id === chatData.locatario_id) locatarioNome = nome
            }
          }
        }

        return { ...chatData, equipamento: eqData, proposta: propostaData || undefined, locador_nome: locadorNome, locatario_nome: locatarioNome } as Chat
      }

      if (!data) return null

      let propostaData = null
      if (data.proposta_id) {
        const { data: prop } = await supabase.from('propostas').select('*').eq('id', data.proposta_id).single()
        propostaData = prop
      } else if (data.equipamento_id) {
        const { data: prop } = await supabase.from('propostas').select('*').eq('equipamento_id', data.equipamento_id).eq('usuario_id', data.locatario_id).in('status', ['pendente', 'aceita', 'finalizada']).order('created_at', { ascending: false }).limit(1).maybeSingle()
        propostaData = prop
      }

      const userIds = [data.locador_id, data.locatario_id].filter(Boolean)
      let locadorNome: string | undefined
      let locatarioNome: string | undefined

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name, nome_empresa, email').in('id', userIds)
        if (profilesData) {
          for (const p of profilesData) {
            const nome = p.nome_empresa || p.full_name || p.email || 'Usuario'
            if (p.id === data.locador_id) locadorNome = nome
            if (p.id === data.locatario_id) locatarioNome = nome
          }
        }
      }

      return { ...data, proposta: propostaData || undefined, locador_nome: locadorNome, locatario_nome: locatarioNome } as Chat
    } catch {
      return null
    }
  }

  const fetchMeusChats = async (userId: string): Promise<Chat[]> => {
    try {
      const { data, error } = await supabase.from('chats').select('*, equipamento:equipamentos(*)').or(`locador_id.eq.${userId},locatario_id.eq.${userId}`).order('created_at', { ascending: false })

      let chatsData: Chat[] = []

      if (error) {
        const { data: chatsRaw, error: chatsError } = await supabase.from('chats').select('*').or(`locador_id.eq.${userId},locatario_id.eq.${userId}`).order('created_at', { ascending: false })
        if (chatsError || !chatsRaw) return []

        const equipamentoIds = [...new Set(chatsRaw.map(c => c.equipamento_id).filter(Boolean))]
        if (equipamentoIds.length > 0) {
          const { data: eqsData } = await supabase.from('equipamentos').select('*').in('id', equipamentoIds)
          const eqsMap = new Map((eqsData || []).map(eq => [eq.id, eq]))
          chatsData = chatsRaw.map(chat => ({ ...chat, equipamento: eqsMap.get(chat.equipamento_id) || null })) as Chat[]
        } else {
          chatsData = chatsRaw as Chat[]
        }
      } else {
        chatsData = data || []
      }

      if (chatsData.length > 0) {
        const chatIds = chatsData.map(c => c.id)
        const userIds = [...new Set([...chatsData.map(c => c.locador_id), ...chatsData.map(c => c.locatario_id)].filter(Boolean))]

        const { data: profilesData } = await supabase.from('profiles').select('id, full_name, nome_empresa, email').in('id', userIds)
        const nomesMap = new Map<string, string>()
        if (profilesData) {
          for (const p of profilesData) {
            nomesMap.set(p.id, p.nome_empresa || p.full_name || p.email || 'Usuario')
          }
        }

        const { data: mensagensData } = await supabase.from('mensagens').select('chat_id, texto, created_at, lida, sender_id').in('chat_id', chatIds).order('created_at', { ascending: false })
        const ultimasMensagens = new Map<string, { texto: string; created_at: string; lida: boolean; sender_id: string }>()
        if (mensagensData && mensagensData.length > 0) {
          for (const msg of mensagensData) {
            if (!ultimasMensagens.has(msg.chat_id)) {
              ultimasMensagens.set(msg.chat_id, { texto: msg.texto, created_at: msg.created_at, lida: msg.lida ?? true, sender_id: msg.sender_id })
            }
          }
        }

        chatsData = chatsData.map(chat => ({
          ...chat,
          ultima_mensagem: ultimasMensagens.get(chat.id)?.texto,
          ultima_mensagem_data: ultimasMensagens.get(chat.id)?.created_at,
          ultima_mensagem_lida: ultimasMensagens.get(chat.id)?.lida,
          ultima_mensagem_sender_id: ultimasMensagens.get(chat.id)?.sender_id,
          locador_nome: nomesMap.get(chat.locador_id),
          locatario_nome: nomesMap.get(chat.locatario_id)
        }))
      }

      return chatsData
    } catch {
      return []
    }
  }

  // ===== PROPOSAL FUNCTIONS =====

  const enviarProposta = async (chatId: string, locadorId: string, dados: NovaProposta): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: chatData, error: chatFetchError } = await supabase.from('chats').select('locatario_id').eq('id', chatId).single()
      if (chatFetchError || !chatData?.locatario_id) return { success: false, error: 'Chat nao encontrado' }

      const propostaInsert: Record<string, unknown> = {
        equipamento_id: dados.equipamento_id, usuario_id: chatData.locatario_id, status: 'pendente'
      }

      if (dados.valor_diaria !== undefined) propostaInsert.valor_diaria = dados.valor_diaria
      if (dados.quantidade_dias !== undefined) propostaInsert.quantidade_dias = dados.quantidade_dias
      if (dados.valor_frete !== undefined) propostaInsert.valor_frete = dados.valor_frete
      if (dados.valor_total !== undefined) propostaInsert.valor_total = dados.valor_total
      if (dados.desconto !== undefined) propostaInsert.desconto = dados.desconto
      if (dados.taxa_extra !== undefined) propostaInsert.taxa_extra = dados.taxa_extra
      if (dados.data_inicio) propostaInsert.data_inicio = dados.data_inicio
      if (dados.data_fim) propostaInsert.data_fim = dados.data_fim
      if (dados.horimetro_saida !== undefined) propostaInsert.horimetro_saida = dados.horimetro_saida
      if (dados.horimetro_saida_foto) propostaInsert.horimetro_saida_foto = dados.horimetro_saida_foto
      if (dados.com_operador !== undefined) propostaInsert.com_operador = dados.com_operador
      if (dados.valor_operador_diaria !== undefined) propostaInsert.valor_operador_diaria = dados.valor_operador_diaria
      if (dados.tipo_veiculo_transporte) propostaInsert.tipo_veiculo_transporte = dados.tipo_veiculo_transporte

      const { data: propostaData, error: propostaError } = await supabase.from('propostas').insert(propostaInsert).select('id').single()
      if (propostaError) return { success: false, error: propostaError.message }
      if (!propostaData) return { success: false, error: 'Erro ao criar proposta: dados nao retornados' }

      await supabase.from('chats').update({ proposta_id: propostaData.id }).eq('id', chatId)
      await supabase.from('mensagens').insert({ chat_id: chatId, sender_id: SYSTEM_SENDER_ID, texto: '📋 Proposta de locacao enviada!', lida: false })

      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao enviar proposta' }
    }
  }

  const fetchProposta = async (propostaId: string): Promise<Proposta | null> => {
    try {
      const { data, error } = await supabase.from('propostas').select('*').eq('id', propostaId).single()
      if (error || !data) return null
      return data as Proposta
    } catch {
      return null
    }
  }

  const atualizarEnderecoNaProposta = async (propostaId: string, endereco: EnderecoEntrega): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('propostas').update({
        endereco_cep: endereco.cep, endereco_logradouro: endereco.logradouro, endereco_cidade: endereco.cidade, endereco_uf: endereco.uf
      }).eq('id', propostaId)
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro ao salvar endereco' }
    }
  }

  interface RPCResponse { success: boolean; error?: string; message?: string }

  const responderProposta = async (
    propostaId: string, chatId: string, aceitar: boolean, userId: string, endereco?: EnderecoEntrega
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: chatData, error: chatError } = await supabase.from('chats').select('equipamento_id').eq('id', chatId).single()
      if (chatError || !chatData?.equipamento_id) return { success: false, error: 'Chat nao encontrado' }

      if (!propostaId || !chatData.equipamento_id || !chatId || !userId) return { success: false, error: 'Parametros invalidos para a RPC' }

      const { data, error } = await supabase.rpc('executar_aceite_proposta', {
        p_proposta_id: propostaId, p_equipamento_id: chatData.equipamento_id,
        p_chat_id: chatId, p_sender_id: userId, p_aceitar: aceitar
      })

      if (error) return { success: false, error: error.message || 'Erro ao processar proposta' }

      const response = data as RPCResponse | null
      if (response?.success === false) return { success: false, error: response.error || 'Erro ao processar proposta' }

      if (aceitar && endereco) await atualizarEnderecoNaProposta(propostaId, endereco)

      if (aceitar && chatData?.equipamento_id) {
        const { data: profileData } = await supabase.from('profiles').select('full_name, nome_empresa, email').eq('id', userId).single()
        const nomeCliente = profileData?.nome_empresa || profileData?.full_name || profileData?.email || 'Cliente'

        await supabase.from('equipamentos').update({ status: 'RESERVADO', locado_para: nomeCliente, locado_para_id: userId }).eq('id', chatData.equipamento_id)
        await equipamentoCtx.refetchEquipamentos()
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro inesperado ao processar proposta' }
    }
  }

  const editarProposta = async (propostaId: string, dados: Partial<NovaProposta>): Promise<{ success: boolean; error?: string }> => {
    try {
      const updateFields: Record<string, unknown> = {}
      if (dados.valor_diaria !== undefined) updateFields.valor_diaria = dados.valor_diaria
      if (dados.valor_frete !== undefined) updateFields.valor_frete = dados.valor_frete
      if (dados.valor_total !== undefined) updateFields.valor_total = dados.valor_total
      if (dados.quantidade_dias !== undefined) updateFields.quantidade_dias = dados.quantidade_dias
      if (dados.desconto !== undefined) updateFields.desconto = dados.desconto
      if (dados.taxa_extra !== undefined) updateFields.taxa_extra = dados.taxa_extra
      if (dados.data_inicio) updateFields.data_inicio = dados.data_inicio
      if (dados.data_fim) updateFields.data_fim = dados.data_fim

      const { error } = await supabase.from('propostas').update(updateFields).eq('id', propostaId).eq('status', 'pendente')
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao editar proposta' }
    }
  }

  // ===== DELIVERY FUNCTIONS =====

  const fetchEntregasPendentes = async (locadorId: string): Promise<EntregaPendente[]> => {
    try {
      const { data: chats, error: chatsError } = await supabase.from('chats').select('id, proposta_id, locatario_id').eq('locador_id', locadorId)
      if (chatsError || !chats || chats.length === 0) return []

      const propostaIds = chats.map(c => c.proposta_id).filter(Boolean)
      if (propostaIds.length === 0) return []

      const { data: propostas, error: propostasError } = await supabase.from('propostas')
        .select('id, equipamento_id, usuario_id, status, status_entrega, endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf, created_at')
        .in('id', propostaIds).eq('status', 'aceita')
      if (propostasError || !propostas || propostas.length === 0) return []

      const propostasPendentes = propostas.filter(p => {
        const statusEntrega = (p as { status_entrega?: string }).status_entrega
        return !statusEntrega || statusEntrega !== 'ENTREGUE'
      })
      if (propostasPendentes.length === 0) return []

      const equipamentoIds = [...new Set(propostasPendentes.map(p => p.equipamento_id).filter(Boolean))]
      const { data: equipamentos } = await supabase.from('equipamentos').select('id, nome').in('id', equipamentoIds)
      const equipamentosMap = new Map((equipamentos || []).map(e => [e.id, e.nome]))

      const clienteIds = [...new Set(propostasPendentes.map(p => p.usuario_id).filter(Boolean))]
      const { data: clientes } = await supabase.from('profiles').select('id, full_name, nome_empresa, email').in('id', clienteIds)
      const clientesMap = new Map((clientes || []).map(c => [c.id, c.nome_empresa || c.full_name || c.email || 'Cliente']))

      return propostasPendentes.map(proposta => ({
        proposta_id: proposta.id, equipamento_id: proposta.equipamento_id,
        equipamento_nome: equipamentosMap.get(proposta.equipamento_id) || 'Equipamento',
        cliente_nome: clientesMap.get(proposta.usuario_id) || 'Cliente',
        cliente_id: proposta.usuario_id,
        endereco_cep: proposta.endereco_cep, endereco_logradouro: proposta.endereco_logradouro,
        endereco_cidade: proposta.endereco_cidade, endereco_uf: proposta.endereco_uf,
        data_aceite: proposta.created_at
      }))
    } catch {
      return []
    }
  }

  const marcarComoEntregue = async (propostaId: string, equipamentoId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('marcar_como_entregue', { p_equipamento_id: equipamentoId, p_proposta_id: propostaId })

      if (error) {
        await supabase.from('propostas').update({ status_entrega: 'ENTREGUE' }).eq('id', propostaId)
        const { error: eqError } = await supabase.from('equipamentos').update({ status: 'OCUPADO' }).eq('id', equipamentoId)
        if (eqError) return { success: false, error: eqError.message }
        return { success: true }
      }

      const response = data as { success: boolean; error?: string } | null
      if (response?.success === false) return { success: false, error: response.error || 'Erro ao marcar entrega' }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro inesperado' }
    }
  }

  const despacharEquipamento = async (propostaId: string, equipamentoId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: eqError } = await supabase.from('equipamentos').update({ status: 'OCUPADO' }).eq('id', equipamentoId)
      if (eqError) return { success: false, error: eqError.message }

      await supabase.from('propostas').update({ status_entrega: 'ENTREGUE' }).eq('id', propostaId)

      const { data: chatData } = await supabase.from('chats').select('id, locador_id').eq('proposta_id', propostaId).single()
      if (chatData?.id) {
        await supabase.from('mensagens').insert({ chat_id: chatData.id, sender_id: SYSTEM_SENDER_ID, texto: '🚛 Equipamento despachado!', lida: false })
      }

      await equipamentoCtx.refetchEquipamentos()
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao despachar equipamento' }
    }
  }

  const confirmarRetorno = async (
    propostaId: string, equipamentoId: string,
    horimetroDados?: { horimetro_chegada?: number; horimetro_chegada_foto?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (horimetroDados && (horimetroDados.horimetro_chegada !== undefined || horimetroDados.horimetro_chegada_foto)) {
        const updateData: Record<string, unknown> = {}
        if (horimetroDados.horimetro_chegada !== undefined) updateData.horimetro_chegada = horimetroDados.horimetro_chegada
        if (horimetroDados.horimetro_chegada_foto) updateData.horimetro_chegada_foto = horimetroDados.horimetro_chegada_foto
        await supabase.from('propostas').update(updateData).eq('id', propostaId)
      }

      const { data, error } = await supabase.rpc('confirmar_retorno', { p_equipamento_id: equipamentoId, p_proposta_id: propostaId })

      if (error) {
        const { data: chatData } = await supabase.from('chats').select('id, locador_id').eq('proposta_id', propostaId).single()

        const { error: finError } = await supabase.from('propostas').update({ status: 'finalizada' }).eq('id', propostaId)
        if (finError) return { success: false, error: 'Erro ao finalizar proposta: ' + finError.message }

        const { error: eqError } = await supabase.from('equipamentos').update({ status: 'DISPONIVEL', locado_para: null, locado_para_id: null }).eq('id', equipamentoId)
        if (eqError) return { success: false, error: eqError.message }

        if (chatData?.id) {
          const { error: archiveError } = await supabase.from('chats').update({ archived: true }).eq('id', chatData.id)
          if (archiveError && import.meta.env.DEV) console.error('Erro ao arquivar chat:', archiveError)
        }

        await equipamentoCtx.refetchEquipamentos()
        return { success: true }
      }

      const response = data as { success: boolean; error?: string } | null
      if (response?.success === false) return { success: false, error: response.error || 'Erro ao confirmar retorno' }

      const { data: chatDataRpc } = await supabase.from('chats').select('id').eq('proposta_id', propostaId).single()
      if (chatDataRpc?.id) {
        const { error: archiveError } = await supabase.from('chats').update({ archived: true }).eq('id', chatDataRpc.id)
        if (archiveError && import.meta.env.DEV) console.error('Erro ao arquivar chat:', archiveError)
      }

      await equipamentoCtx.refetchEquipamentos()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro inesperado' }
    }
  }

  const enviarMensagemComArquivo = async (
    chatId: string, senderId: string, arquivo: ArquivoChat, texto?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const mensagemTexto = texto || `Arquivo enviado: ${arquivo.nome}`
      const { error } = await supabase.from('mensagens').insert({
        chat_id: chatId, sender_id: senderId, texto: mensagemTexto,
        arquivo_url: arquivo.url, arquivo_nome: arquivo.nome, arquivo_tipo: arquivo.tipo, arquivo_tamanho: arquivo.tamanho
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao enviar mensagem' }
    }
  }

  // ===== REVIEW FUNCTIONS =====

  const submitReview = async (
    rentalId: string, reviewerId: string, targetId: string, rating: number, comment: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('submeter_avaliacao', {
        p_rental_id: rentalId, p_reviewer_id: reviewerId, p_target_id: targetId, p_rating: rating, p_comment: comment || null
      })

      if (error) {
        if (error.code === 'PGRST202') {
          const { error: insertError } = await supabase.from('reviews').insert({
            rental_id: rentalId, reviewer_id: reviewerId, target_id: targetId, rating, comment: comment || null
          })
          if (insertError) return { success: false, error: insertError.message }

          const { data: stats } = await supabase.from('reviews').select('rating').eq('target_id', targetId)
          if (stats && stats.length > 0) {
            const avg = stats.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / stats.length
            await supabase.from('profiles').update({ rating_average: Math.round(avg * 100) / 100, reviews_count: stats.length }).eq('id', targetId)
          }
          return { success: true }
        }
        return { success: false, error: error.message }
      }

      const response = data as { success: boolean; error?: string }
      return response
    } catch {
      return { success: false, error: 'Erro inesperado ao enviar avaliacao' }
    }
  }

  const fetchLocadorReviews = async (locadorId: string): Promise<import('../types').Review[]> => {
    try {
      const { data, error } = await supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, nome_empresa)')
        .eq('target_id', locadorId).order('created_at', { ascending: false }).limit(20)
      if (error) return []

      return (data || []).map((r: Record<string, unknown>) => {
        const reviewer = r.reviewer as { full_name?: string; nome_empresa?: string } | null
        return {
          id: r.id as string, rental_id: r.rental_id as string, reviewer_id: r.reviewer_id as string,
          target_id: r.target_id as string, rating: r.rating as number, comment: r.comment as string | null,
          created_at: r.created_at as string, reviewer_name: reviewer?.nome_empresa || reviewer?.full_name || 'Usuario'
        }
      })
    } catch {
      return []
    }
  }

  const checkReviewExists = async (rentalId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('reviews').select('id').eq('rental_id', rentalId).maybeSingle()
      if (error) return false
      return !!data
    } catch {
      return false
    }
  }

  // ===== Aggregate all contexts =====

  const value: AppContextType = {
    // EquipamentoContext
    ...equipamentoCtx,
    // NotificacaoContext
    ...notificacaoCtx,
    // Chat functions
    iniciarChat, enviarMensagem, fetchMensagens, fetchMeusChats, fetchChatExistente, fetchChat,
    // Proposal functions
    enviarProposta, fetchProposta, responderProposta, atualizarEnderecoNaProposta, editarProposta,
    // Delivery functions
    fetchEntregasPendentes, marcarComoEntregue, despacharEquipamento, confirmarRetorno,
    // File message
    enviarMensagemComArquivo,
    // Reviews
    submitReview, fetchLocadorReviews, checkReviewExists,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// ===== Public provider: wraps all sub-providers =====

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <EquipamentoProvider>
      <NotificacaoProvider>
        <AppInnerProvider>
          {children}
        </AppInnerProvider>
      </NotificacaoProvider>
    </EquipamentoProvider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
