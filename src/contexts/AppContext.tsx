import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ESTRUTURA REAL DO BANCO - equipamentos
export interface Equipamento {
  id: string
  nome: string
  descricao: string | null
  preco_diaria: number
  fotos: string[] | null  // ARRAY no banco - única forma de imagem
  status: string | null   // Campo real no banco - 'DISPONIVEL', 'RESERVADO', 'EM_TRANSITO', 'OCUPADO'
  categoria: string | null
  cidade: string | null
  uf: string | null
  locador_id: string
  created_at: string
  // Campos de locação (preenchidos quando equipamento está locado)
  locado_para?: string | null       // Nome do cliente que alugou
  locado_para_id?: string | null    // ID do cliente que alugou
  // Dados do locador (carregados via join)
  locador_nome_empresa?: string | null
  locador_?: string | null
  locador_full_name?: string | null
  locador_verificado?: boolean | null    // Locador verificado pelo admin (selo dourado)
  // Novos campos para Linha Amarela
  ano?: number | null                    // Ano de fabricação
  horimetro_atual?: number | null        // Horímetro em horas
  peso_operacional?: number | null       // Peso em toneladas
  selo_verificado?: boolean | null       // Badge de verificação (legado)
  // Campos Light Equipment
  voltagem?: string | null               // '110v' | '220v' | 'Bivolt' | 'Bateria'
  // Destaque (admin)
  destaque?: boolean | null              // Equipamento promovido pelo admin
}

// Status do equipamento no ciclo de vida
export const EQUIPMENT_STATUS = {
  DISPONIVEL: 'DISPONIVEL',
  RESERVADO: 'RESERVADO',      // Proposta aceita, aguardando despacho
  EM_TRANSITO: 'EM_TRANSITO',  // Locador despachou, a caminho do cliente
  OCUPADO: 'OCUPADO',          // Cliente confirmou recebimento, em uso
} as const

export type EquipmentStatus = typeof EQUIPMENT_STATUS[keyof typeof EQUIPMENT_STATUS]

// Helper para verificar se equipamento está disponível
export const isEquipamentoDisponivel = (eq: Equipamento): boolean => {
  if (!eq.status) return true
  return eq.status === 'DISPONIVEL' || eq.status === 'disponivel'
}

// Helper para obter o nome de exibição do locador (prioriza nome_empresa >  > full_name)
export const getLocadorDisplayName = (eq: Equipamento): string | null => {
  return eq.locador_nome_empresa || eq.locador_ || eq.locador_full_name || null
}

// Helper para obter URL da imagem do equipamento
// ESTRUTURA REAL: só tem 'fotos' (ARRAY) - não tem imagem_url
// Converte paths relativos para URLs públicas do Storage
export const getEquipamentoImageUrl = (eq: Equipamento): string | null => {
  // Usa apenas o array fotos (único campo de imagem no banco)
  if (!eq.fotos || !Array.isArray(eq.fotos) || eq.fotos.length === 0 || !eq.fotos[0]) {
    return null
  }

  const path = eq.fotos[0]

  // Se já é URL completa, retorna direto
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Converte path relativo para URL pública do Storage
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
}

// ESTRUTURA REAL DO BANCO - campos para inserir equipamento
export interface NovoEquipamento {
  nome: string
  descricao?: string
  preco_diaria: number
  categoria: string
  cidade: string
  uf: string
  fotos?: string[]  // Array de URLs das fotos (multi-upload)
  // Campos técnicos opcionais para Linha Amarela
  ano?: number
  horimetro_atual?: number
  peso_operacional?: number
  selo_verificado?: boolean  // Admin pode marcar como verificado
  // Campos Light Equipment
  voltagem?: string           // '110v' | '220v' | 'Bivolt' | 'Bateria'
}

// Lista de estados brasileiros
export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const

// ESTRUTURA REAL DO BANCO - chats
export interface Chat {
  id: string
  equipamento_id: string  // FK para equipamentos
  proposta_id?: string | null  // FK para propostas (opcional, criado depois)
  locador_id: string
  locatario_id: string
  created_at: string
  // Dados da solicitação (salvos quando cliente solicita)
  quantidade_dias?: number
  endereco_entrega_logradouro?: string
  endereco_entrega_cep?: string
  endereco_entrega_cidade?: string
  endereco_entrega_uf?: string
  // Dados carregados via join
  proposta?: Proposta
  equipamento?: Equipamento
  // Última mensagem (para exibição na lista)
  ultima_mensagem?: string
  ultima_mensagem_data?: string
  ultima_mensagem_lida?: boolean
  ultima_mensagem_sender_id?: string
  // Nomes das partes (para exibição na lista)
  locador_nome?: string
  locatario_nome?: string
}

// RAIO-X: mensagens tem sender_id (não remetente_id), texto (não conteudo)
export interface Mensagem {
  id: string
  chat_id: string
  sender_id: string  // Nome correto no banco
  texto: string      // Nome correto no banco
  lida?: boolean
  created_at: string
}

// RAIO-X: propostas tem equipamento_id, usuario_id, status, endereco_*
// NÃO tem: chat_id, valor_diaria, quantidade_dias, valor_frete, valor_total
export interface Proposta {
  id: string
  equipamento_id: string
  usuario_id: string  // ID do locatário que fez a proposta
  status: string      // 'pendente' | 'aceita' | 'recusada' | 'finalizada'
  created_at: string
  // Dados da proposta (valor e frete)
  valor_diaria?: number | null
  quantidade_dias?: number | null
  valor_frete?: number | null
  valor_total?: number | null
  desconto?: number | null
  taxa_extra?: number | null
  // Datas de locação
  data_inicio?: string | null
  data_fim?: string | null
  // Status de entrega
  status_entrega?: string | null  // 'ENTREGUE' ou null
  // Endereço de entrega
  endereco_cep?: string | null
  endereco_logradouro?: string | null
  endereco_cidade?: string | null
  endereco_uf?: string | null
  // Campos Linha Amarela (Heavy Equipment)
  horimetro_saida?: number | null
  horimetro_saida_foto?: string | null
  horimetro_chegada?: number | null
  horimetro_chegada_foto?: string | null
  com_operador?: boolean | null
  valor_operador_diaria?: number | null
  tipo_veiculo_transporte?: string | null
}

// Endereço de entrega - RAIO-X mostra apenas: endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
export interface EnderecoEntrega {
  cep: string
  logradouro: string  // Alinhado com banco
  cidade: string
  uf: string
}

// Nova proposta - dados enviados pelo locador
export interface NovaProposta {
  equipamento_id: string
  valor_diaria?: number
  quantidade_dias?: number
  valor_frete?: number
  valor_total?: number
  desconto?: number
  taxa_extra?: number
  data_inicio?: string
  data_fim?: string
  // Campos Linha Amarela (Heavy Equipment)
  horimetro_saida?: number
  horimetro_saida_foto?: string
  com_operador?: boolean
  valor_operador_diaria?: number
  tipo_veiculo_transporte?: string
}

// Consumível (item vendável com equipamento leve)
export interface Consumivel {
  id: string
  equipamento_id: string
  nome: string
  preco: number
  ativo: boolean
  created_at: string
}

// Consumível selecionado em uma proposta
export interface PropostaConsumivel {
  id: string
  proposta_id: string
  consumivel_id: string
  quantidade: number
  preco_unitario: number
  nome?: string // joined from consumiveis
}

// Interface para entregas pendentes (propostas aceitas)
// ESTRUTURA REAL: propostas só tem endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
// NÃO tem: endereco_numero, endereco_bairro, endereco_complemento, valor_total, quantidade_dias
export interface EntregaPendente {
  proposta_id: string
  equipamento_id: string
  equipamento_nome: string
  cliente_nome: string
  cliente_id: string
  // Endereço de entrega - APENAS campos que existem no banco
  endereco_cep: string | null
  endereco_logradouro: string | null  // Contém endereço completo (rua, número, bairro)
  endereco_cidade: string | null
  endereco_uf: string | null
  data_aceite: string
}

export const CATEGORIAS = [
  // Linha Amarela (Máquinas Pesadas)
  'Escavadeira Hidráulica',
  'Retroescavadeira',
  'Pá Carregadeira',
  'Motoniveladora',
  'Rolo Compactador',
  'Trator de Esteira',
  'Mini Escavadeira',
  // Equipamentos de Construção
  'Betoneiras',
  'Andaimes',
  'Ferramentas Elétricas',
  'Geradores',
  'Equipamentos de Proteção',
  'Compactadores',
  'Outros'
] as const

// Categorias que são de Linha Amarela (requerem dados técnicos)
export const CATEGORIAS_LINHA_AMARELA = [
  'Escavadeira Hidráulica',
  'Retroescavadeira',
  'Pá Carregadeira',
  'Motoniveladora',
  'Rolo Compactador',
  'Trator de Esteira',
  'Mini Escavadeira'
] as const

// Helper para verificar se uma categoria é Linha Amarela
export const isLinhaAmarela = (categoria: string): boolean => {
  return CATEGORIAS_LINHA_AMARELA.includes(categoria as any)
}

// Mapa de cores industriais por categoria
export const CATEGORIA_CORES: Record<string, string> = {
  // Linha Amarela (Máquinas Pesadas) - Tons de Amarelo/Laranja
  'Escavadeira Hidráulica': 'bg-yellow-600',
  'Retroescavadeira': 'bg-amber-700',
  'Pá Carregadeira': 'bg-yellow-500',
  'Motoniveladora': 'bg-orange-600',
  'Rolo Compactador': 'bg-zinc-700',
  'Trator de Esteira': 'bg-slate-600',
  'Mini Escavadeira': 'bg-yellow-700',
  // Equipamentos de Construção - Cores Variadas
  'Betoneiras': 'bg-amber-700',
  'Andaimes': 'bg-slate-600',
  'Ferramentas Elétricas': 'bg-yellow-600',
  'Geradores': 'bg-zinc-700',
  'Equipamentos de Proteção': 'bg-orange-700',
  'Compactadores': 'bg-stone-600',
  'Outros': 'bg-gray-600'
}

// Tipos de veículo para transporte de Linha Amarela
export const TIPOS_VEICULO_TRANSPORTE = ['Caminhão Prancha', 'Caminhão Munck', 'Reboque'] as const

// Voltagens para equipamentos leves
export const VOLTAGENS = ['110v', '220v', 'Bivolt', 'Bateria'] as const

// Status válidos para chat aberto (case-insensitive)
export const STATUS_CHAT_ABERTO = ['aberto', 'ativo'] as const

// Helper para verificar se o chat está aberto (aceita 'aberto' ou 'Ativo')
export const isChatAberto = (status: string | undefined | null): boolean => {
  if (!status) return false
  const statusNormalizado = status.toLowerCase().trim()
  return STATUS_CHAT_ABERTO.includes(statusNormalizado as typeof STATUS_CHAT_ABERTO[number])
}

interface AppContextType {
  equipamentos: Equipamento[]
  loadingEquipamentos: boolean
  refetchEquipamentos: () => Promise<void>
  addEquipamento: (dados: NovoEquipamento, locadorId: string) => Promise<{ success: boolean; error?: string }>
  fetchMeusEquipamentos: (locadorId: string) => Promise<Equipamento[]>
  iniciarChat: (
    equipamentoId: string,
    locadorId: string,
    locatarioId: string,
    mensagemInicial: string,
    dadosSolicitacao?: {
      quantidadeDias: number
      endereco: {
        logradouro: string
        cep: string
        cidade: string
        uf: string
      }
    }
  ) => Promise<{ success: boolean; chatId?: string; error?: string }>
  enviarMensagem: (chatId: string, senderId: string, texto: string) => Promise<{ success: boolean; error?: string }>
  fetchMensagens: (chatId: string) => Promise<Mensagem[]>
  fetchMeusChats: (userId: string) => Promise<Chat[]>
  fetchChatExistente: (equipamentoId: string, locatarioId: string) => Promise<string | null>
  fetchChat: (chatId: string) => Promise<Chat | null>
  enviarProposta: (chatId: string, locadorId: string, dados: NovaProposta) => Promise<{ success: boolean; error?: string }>
  fetchProposta: (propostaId: string) => Promise<Proposta | null>
  responderProposta: (propostaId: string, chatId: string, aceitar: boolean, userId: string, endereco?: EnderecoEntrega) => Promise<{ success: boolean; error?: string }>
  atualizarEnderecoNaProposta: (propostaId: string, endereco: EnderecoEntrega) => Promise<{ success: boolean; error?: string }>
  // Funções para notificação de mensagens não lidas
  mensagensNaoLidas: number
  fetchMensagensNaoLidas: (userId: string) => Promise<number>
  marcarMensagensComoLidas: (chatId: string, userId: string) => Promise<void>
  setupMensagensRealtime: (userId: string) => void
  // Funções para painel de entregas
  fetchEntregasPendentes: (locadorId: string) => Promise<EntregaPendente[]>
  marcarComoEntregue: (propostaId: string, equipamentoId: string) => Promise<{ success: boolean; error?: string }>
  // Função para despachar equipamento (RESERVADO → EM_TRANSITO)
  despacharEquipamento: (propostaId: string, equipamentoId: string) => Promise<{ success: boolean; error?: string }>
  // Função para confirmar devolução/retorno de equipamento
  confirmarRetorno: (propostaId: string, equipamentoId: string, horimetroDados?: { horimetro_chegada?: number; horimetro_chegada_foto?: string }) => Promise<{ success: boolean; error?: string }>
  // Função para editar proposta pendente
  editarProposta: (propostaId: string, dados: Partial<NovaProposta>) => Promise<{ success: boolean; error?: string }>
  // Função para upload de imagens
  uploadImagens: (files: File[], locadorId: string) => Promise<{ urls: string[]; error?: string }>
  // Função para deletar equipamento
  deletarEquipamento: (equipamentoId: string, locadorId: string) => Promise<{ success: boolean; error?: string }>
  // Função para atualizar equipamento
  atualizarEquipamento: (equipamentoId: string, dados: NovoEquipamento, locadorId: string) => Promise<{ success: boolean; error?: string }>
  // Funções de consumíveis
  fetchConsumiveis: (equipamentoId: string) => Promise<Consumivel[]>
  addConsumivel: (equipamentoId: string, nome: string, preco: number) => Promise<{ success: boolean; error?: string }>
  removeConsumivel: (consumivelId: string) => Promise<{ success: boolean; error?: string }>
  salvarConsumiveisProposta: (propostaId: string, items: { consumivel_id: string; quantidade: number; preco_unitario: number }[]) => Promise<{ success: boolean; error?: string }>
  fetchConsumiveisProposta: (propostaId: string) => Promise<PropostaConsumivel[]>
  // Admin: toggle destaque
  toggleDestaque: (equipamentoId: string, destaque: boolean) => Promise<{ success: boolean; error?: string }>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(true)
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const mensagensChannelRef = useRef<RealtimeChannel | null>(null)

  const fetchEquipamentos = useCallback(async () => {
    setLoadingEquipamentos(true)

    try {
      // Busca equipamentos com join no perfil do locador
      // ESTRUTURA REAL: equipamentos tem 'status' (não 'disponivel')
      // Ordena por created_at primeiro - a ordenação por verificado é feita no frontend
      // pois o Supabase não suporta order em campos de join
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          locador:profiles!locador_id(
            full_name,
            nome_empresa,
            verificado
          )
        `)
        .in('status', ['DISPONIVEL', 'disponivel'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar equipamentos:', error)
        // Fallback: busca sem join se a relação falhar
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('equipamentos')
          .select('*')
          .eq('disponivel', true)
          .order('created_at', { ascending: false })

        if (fallbackError) {
          setEquipamentos([])
        } else {
          setEquipamentos(fallbackData || [])
        }
      } else {
        // Mapeia os dados para incluir campos do locador no formato esperado
        const equipamentosComLocador = (data || []).map(eq => {
          const locador = eq.locador as { full_name?: string; nome_empresa?: string; verificado?: boolean } | null
          return {
            ...eq,
            locador_nome_empresa: locador?.nome_empresa || null,
            locador_full_name: locador?.full_name || null,
            locador_verificado: locador?.verificado || false, // Selo dourado do locador
            locador: undefined // Remove o objeto aninhado
          }
        })
        setEquipamentos(equipamentosComLocador)
      }
    } catch {
      setEquipamentos([])
    }

    setLoadingEquipamentos(false)
  }, [])

  // Handler para eventos de Realtime
  // ESTRUTURA REAL: usa campo 'status' (não 'disponivel')
  const handleRealtimeEvent = useCallback((payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: Equipamento | null
    old: { id: string } | null
  }) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    if (eventType === 'INSERT' && newRecord) {
      // Novo equipamento - adiciona à lista se disponível
      if (isEquipamentoDisponivel(newRecord)) {
        setEquipamentos(prev => [newRecord, ...prev])
      }
    } else if (eventType === 'UPDATE' && newRecord) {
      if (isEquipamentoDisponivel(newRecord)) {
        // Equipamento atualizado e disponível - atualiza ou adiciona
        setEquipamentos(prev => {
          const exists = prev.some(eq => eq.id === newRecord.id)
          if (exists) {
            return prev.map(eq => eq.id === newRecord.id ? newRecord : eq)
          } else {
            return [newRecord, ...prev]
          }
        })
      } else {
        // Equipamento ficou indisponível - remove da lista
        setEquipamentos(prev => prev.filter(eq => eq.id !== newRecord.id))
      }
    } else if (eventType === 'DELETE' && oldRecord) {
      // Equipamento deletado - remove da lista
      setEquipamentos(prev => prev.filter(eq => eq.id !== oldRecord.id))
    }
  }, [])

  const fetchMeusEquipamentos = async (locadorId: string): Promise<Equipamento[]> => {
    try {
      // Busca com join no perfil do locador
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          locador:profiles!locador_id(
            full_name,
            nome_empresa,
            verificado
          )
        `)
        .eq('locador_id', locadorId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar meus equipamentos:', error)
        // Fallback sem join
        const { data: fallbackData } = await supabase
          .from('equipamentos')
          .select('*')
          .eq('locador_id', locadorId)
          .order('created_at', { ascending: false })
        return fallbackData || []
      }

      // Mapeia para incluir campos do locador
      return (data || []).map(eq => {
        const locador = eq.locador as { full_name?: string; nome_empresa?: string; verificado?: boolean } | null
        return {
          ...eq,
          locador_nome_empresa: locador?.nome_empresa || null,
          locador_full_name: locador?.full_name || null,
          locador_verificado: locador?.verificado || false,
          locador: undefined
        }
      })
    } catch {
      return []
    }
  }

  // ESTRUTURA REAL DO BANCO - equipamentos:
  // id, nome, descricao, preco_diaria, fotos (ARRAY), status, categoria, cidade, uf, locador_id, created_at
  // NÃO TEM: disponivel, imagem_url, especificacoes
  const addEquipamento = async (
    dados: NovoEquipamento,
    locadorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('equipamentos').insert({
        nome: dados.nome,
        descricao: dados.descricao || null,
        preco_diaria: dados.preco_diaria,
        categoria: dados.categoria,
        cidade: dados.cidade,
        uf: dados.uf,
        locador_id: locadorId,
        fotos: dados.fotos || null,
        status: 'DISPONIVEL',  // Campo real no banco
        // Novos campos técnicos para Linha Amarela
        ano: dados.ano || null,
        horimetro_atual: dados.horimetro_atual || null,
        peso_operacional: dados.peso_operacional || null,
        selo_verificado: false,  // Apenas admin pode marcar como true
        // Campos Light Equipment
        voltagem: dados.voltagem || null
      })

      if (error) {
        console.error('Erro ao adicionar equipamento:', error)
        return { success: false, error: error.message }
      }

      await fetchEquipamentos()
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao cadastrar equipamento' }
    }
  }

  const fetchChatExistente = async (equipamentoId: string, locatarioId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('id')
        .eq('equipamento_id', equipamentoId)
        .eq('locatario_id', locatarioId)
        .single()

      if (error || !data) {
        return null
      }

      return data.id
    } catch {
      return null
    }
  }

  const fetchChat = async (chatId: string): Promise<Chat | null> => {
    try {
      // Busca o chat com equipamento
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          equipamento:equipamentos(*)
        `)
        .eq('id', chatId)
        .single()

      if (error) {
        console.warn('[fetchChat] Erro com relação, tentando fallback:', error.message)

        // Fallback: busca chat e equipamento separadamente
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .single()

        if (chatError || !chatData) {
          console.error('[fetchChat] Falha no fallback:', chatError?.message)
          return null
        }

        // Busca o equipamento separadamente
        let eqData = null
        if (chatData.equipamento_id) {
          const { data: eq } = await supabase
            .from('equipamentos')
            .select('*')
            .eq('id', chatData.equipamento_id)
            .single()
          eqData = eq
        }

        // Busca a proposta - prioriza proposta_id se existir
        let propostaData = null
        if (chatData.proposta_id) {
          const { data: prop } = await supabase
            .from('propostas')
            .select('*')
            .eq('id', chatData.proposta_id)
            .single()
          propostaData = prop
        } else if (chatData.equipamento_id) {
          // Fallback: busca por equipamento_id e locatario_id
          const { data: prop } = await supabase
            .from('propostas')
            .select('*')
            .eq('equipamento_id', chatData.equipamento_id)
            .eq('usuario_id', chatData.locatario_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          propostaData = prop
        }

        // Busca nomes no fallback também
        const userIdsFallback = [chatData.locador_id, chatData.locatario_id].filter(Boolean)
        let locadorNomeFallback: string | undefined
        let locatarioNomeFallback: string | undefined

        if (userIdsFallback.length > 0) {
          const { data: profilesDataFb } = await supabase
            .from('profiles')
            .select('id, full_name, nome_empresa, email')
            .in('id', userIdsFallback)

          if (profilesDataFb) {
            for (const p of profilesDataFb) {
              const nome = p.nome_empresa || p.full_name || p.email || 'Usuário'
              if (p.id === chatData.locador_id) locadorNomeFallback = nome
              if (p.id === chatData.locatario_id) locatarioNomeFallback = nome
            }
          }
        }

        return {
          ...chatData,
          equipamento: eqData,
          proposta: propostaData || undefined,
          locador_nome: locadorNomeFallback,
          locatario_nome: locatarioNomeFallback
        } as Chat
      }

      if (!data) {
        return null
      }

      // Busca a proposta - prioriza proposta_id se existir no chat
      let propostaData = null
      if (data.proposta_id) {
        // Busca direta por proposta_id (mais confiável)
        const { data: prop } = await supabase
          .from('propostas')
          .select('*')
          .eq('id', data.proposta_id)
          .single()
        propostaData = prop
      } else if (data.equipamento_id) {
        // Fallback: busca por equipamento_id e locatario_id
        // Inclui 'finalizada' para manter status correto após devolução
        const { data: prop } = await supabase
          .from('propostas')
          .select('*')
          .eq('equipamento_id', data.equipamento_id)
          .eq('usuario_id', data.locatario_id)
          .in('status', ['pendente', 'aceita', 'finalizada'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        propostaData = prop
      }

      // Busca nomes do locador e locatário para exibição no header
      // Prioriza nome_empresa para locadores, full_name para clientes
      const userIds = [data.locador_id, data.locatario_id].filter(Boolean)
      let locadorNome: string | undefined
      let locatarioNome: string | undefined

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, nome_empresa, email')
          .in('id', userIds)

        if (profilesData) {
          for (const p of profilesData) {
            const nome = p.nome_empresa || p.full_name || p.email || 'Usuário'
            if (p.id === data.locador_id) {
              locadorNome = nome
            }
            if (p.id === data.locatario_id) {
              locatarioNome = nome
            }
          }
        }
      }

      // Adiciona a proposta e nomes ao chat
      const chatComDados = {
        ...data,
        proposta: propostaData || undefined,
        locador_nome: locadorNome,
        locatario_nome: locatarioNome
      } as Chat

      return chatComDados
    } catch (err) {
      console.error('[fetchChat] Erro inesperado:', err)
      return null
    }
  }

  // Helper para garantir que o perfil existe (evita erro 23503)
  const garantirPerfilExiste = async (userId: string): Promise<boolean> => {
    try {
      // Verifica se o perfil já existe
      const { data: profile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (profile) {
        return true // Perfil já existe
      }

      // Se não existe, tenta criar com dados mínimos
      if (checkError?.code === 'PGRST116') { // Not found

        // Busca dados do usuário autenticado
        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user?.email || '',
            full_name: user?.user_metadata?.full_name || null,
            tipo_usuario: user?.user_metadata?.tipo_usuario || 'locatario',
            role: 'customer'
          })

        if (insertError) {
          // Se erro de duplicação, perfil já existe (race condition)
          if (insertError.code === '23505') {
            return true
          }
          console.error('[garantirPerfilExiste] Erro ao criar perfil:', insertError)
          return false
        }

        return true
      }

      console.error('[garantirPerfilExiste] Erro ao verificar perfil:', checkError)
      return false
    } catch (err) {
      console.error('[garantirPerfilExiste] Erro inesperado:', err)
      return false
    }
  }

  const iniciarChat = async (
    equipamentoId: string,
    locadorId: string,
    locatarioId: string,
    mensagemInicial: string,
    dadosSolicitacao?: {
      quantidadeDias: number
      endereco: {
        logradouro: string
        cep: string
        cidade: string
        uf: string
      }
    }
  ): Promise<{ success: boolean; chatId?: string; error?: string }> => {
    try {
      // Verifica se já existe um chat para este equipamento e locatário
      const chatExistente = await fetchChatExistente(equipamentoId, locatarioId)
      if (chatExistente) {
        // Envia a mensagem no chat existente
        await enviarMensagem(chatExistente, locatarioId, mensagemInicial)
        return { success: true, chatId: chatExistente }
      }

      // Garante que o perfil do locatário existe (evita erro 23503)
      const perfilOk = await garantirPerfilExiste(locatarioId)
      if (!perfilOk) {
        return { success: false, error: 'Erro ao verificar seu perfil. Tente fazer logout e login novamente.' }
      }

      // Cria novo chat COM dados da solicitação
      const chatInsert: any = {
        equipamento_id: equipamentoId,
        locador_id: locadorId,
        locatario_id: locatarioId
      }

      // Adiciona dados da solicitação se fornecidos
      if (dadosSolicitacao) {
        chatInsert.quantidade_dias = dadosSolicitacao.quantidadeDias
        chatInsert.endereco_entrega_logradouro = dadosSolicitacao.endereco.logradouro
        chatInsert.endereco_entrega_cep = dadosSolicitacao.endereco.cep
        chatInsert.endereco_entrega_cidade = dadosSolicitacao.endereco.cidade
        chatInsert.endereco_entrega_uf = dadosSolicitacao.endereco.uf
      }

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert(chatInsert)
        .select('id')
        .single()

      if (chatError || !chatData) {
        console.error('Erro ao criar chat:', chatError)
        return { success: false, error: chatError?.message || 'Erro ao criar chat' }
      }

      // Insere a primeira mensagem - APENAS a mensagem do cliente, SEM endereço
      // O endereço já foi salvo nas colunas endereco_entrega_* do chat
      const { error: msgError } = await supabase.from('mensagens').insert({
        chat_id: chatData.id,
        sender_id: locatarioId,
        texto: mensagemInicial
      })

      if (msgError) {
        console.error('Erro ao enviar mensagem inicial:', msgError)
        return { success: false, error: msgError.message }
      }

      // Verificação GARANTIDA: aguarda até confirmar que o chat existe no banco
      // Retry loop para garantir que o chat está disponível antes do redirect
      const MAX_VERIFICACOES = 5
      const DELAY_VERIFICACAO = 400

      for (let tentativa = 1; tentativa <= MAX_VERIFICACOES; tentativa++) {
        const { data: verificacao, error: verifError } = await supabase
          .from('chats')
          .select('id, equipamento_id')
          .eq('id', chatData.id)
          .single()

        if (verificacao && !verifError) {
          return { success: true, chatId: chatData.id }
        }

        await new Promise((resolve) => setTimeout(resolve, DELAY_VERIFICACAO))
      }

      // Se chegou aqui, o chat foi criado mas não conseguimos verificar
      // Retorna sucesso mesmo assim pois o insert retornou OK
      console.warn('[iniciarChat] Chat criado mas verificação incerta - prosseguindo')
      return { success: true, chatId: chatData.id }
    } catch {
      return { success: false, error: 'Erro inesperado ao iniciar chat' }
    }
  }

  // RAIO-X: mensagens usa sender_id e texto (não remetente_id e conteudo)
  const enviarMensagem = async (
    chatId: string,
    senderId: string,
    texto: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('mensagens').insert({
        chat_id: chatId,
        sender_id: senderId,
        texto
      })

      if (error) {
        console.error('Erro ao enviar mensagem:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao enviar mensagem' }
    }
  }

  const fetchMensagens = async (chatId: string): Promise<Mensagem[]> => {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar mensagens:', error)
        return []
      }

      return data || []
    } catch {
      return []
    }
  }

  const fetchMeusChats = async (userId: string): Promise<Chat[]> => {
    try {
      // Busca chats com equipamentos
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          equipamento:equipamentos(*)
        `)
        .or(`locador_id.eq.${userId},locatario_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      let chatsData: Chat[] = []

      if (error) {
        console.warn('[fetchMeusChats] Erro com relação, tentando fallback:', error.message)

        // Fallback: busca chats e equipamentos separadamente
        const { data: chatsRaw, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .or(`locador_id.eq.${userId},locatario_id.eq.${userId}`)
          .order('created_at', { ascending: false })

        if (chatsError || !chatsRaw) {
          console.error('[fetchMeusChats] Falha no fallback:', chatsError?.message)
          return []
        }

        // Busca todos os equipamentos relacionados
        const equipamentoIds = [...new Set(chatsRaw.map(c => c.equipamento_id).filter(Boolean))]
        if (equipamentoIds.length > 0) {
          const { data: eqsData } = await supabase
            .from('equipamentos')
            .select('*')
            .in('id', equipamentoIds)

          const eqsMap = new Map((eqsData || []).map(eq => [eq.id, eq]))

          chatsData = chatsRaw.map(chat => ({
            ...chat,
            equipamento: eqsMap.get(chat.equipamento_id) || null
          })) as Chat[]
        } else {
          chatsData = chatsRaw as Chat[]
        }
      } else {
        chatsData = data || []
      }

      // Busca a última mensagem de cada chat e nomes dos participantes
      if (chatsData.length > 0) {
        const chatIds = chatsData.map(c => c.id)

        // Coleta todos os IDs de usuários (locadores e locatários)
        const userIds = [...new Set([
          ...chatsData.map(c => c.locador_id),
          ...chatsData.map(c => c.locatario_id)
        ].filter(Boolean))]

        // Busca nomes dos usuários
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, nome_empresa, email')
          .in('id', userIds)

        const nomesMap = new Map<string, string>()
        if (profilesData) {
          for (const p of profilesData) {
            nomesMap.set(p.id, p.nome_empresa || p.full_name || p.email || 'Usuário')
          }
        }

        // Para cada chat, busca a última mensagem
        const { data: mensagensData } = await supabase
          .from('mensagens')
          .select('chat_id, texto, created_at, lida, sender_id')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false })

        // Agrupa por chat_id e pega a primeira (mais recente) de cada
        const ultimasMensagens = new Map<string, { texto: string; created_at: string; lida: boolean; sender_id: string }>()

        if (mensagensData && mensagensData.length > 0) {
          for (const msg of mensagensData) {
            if (!ultimasMensagens.has(msg.chat_id)) {
              ultimasMensagens.set(msg.chat_id, {
                texto: msg.texto,
                created_at: msg.created_at,
                lida: msg.lida ?? true,
                sender_id: msg.sender_id
              })
            }
          }
        }

        // Adiciona as últimas mensagens e nomes aos chats
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
    } catch (err) {
      console.error('[fetchMeusChats] Erro inesperado:', err)
      return []
    }
  }

  // Envia uma proposta de locação (LOCADOR envia para LOCATÁRIO)
  // usuario_id na proposta = locatario_id (quem vai aceitar/recusar)
  const enviarProposta = async (
    chatId: string,
    locadorId: string,
    dados: NovaProposta
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Busca o locatario_id do chat para vincular à proposta
      const { data: chatData, error: chatFetchError } = await supabase
        .from('chats')
        .select('locatario_id')
        .eq('id', chatId)
        .single()

      if (chatFetchError || !chatData?.locatario_id) {
        console.error('[enviarProposta] Erro ao buscar chat:', chatFetchError?.message)
        return { success: false, error: 'Chat não encontrado' }
      }

      // Cria a proposta - usuario_id é o LOCATÁRIO (quem recebe a proposta)
      const propostaInsert: any = {
        equipamento_id: dados.equipamento_id,
        usuario_id: chatData.locatario_id,  // ID do LOCATÁRIO que vai aceitar/recusar
        status: 'pendente'
      }

      // Adiciona campos opcionais se fornecidos
      if (dados.valor_diaria !== undefined) propostaInsert.valor_diaria = dados.valor_diaria
      if (dados.quantidade_dias !== undefined) propostaInsert.quantidade_dias = dados.quantidade_dias
      if (dados.valor_frete !== undefined) propostaInsert.valor_frete = dados.valor_frete
      if (dados.valor_total !== undefined) propostaInsert.valor_total = dados.valor_total
      if (dados.desconto !== undefined) propostaInsert.desconto = dados.desconto
      if (dados.taxa_extra !== undefined) propostaInsert.taxa_extra = dados.taxa_extra
      if (dados.data_inicio) propostaInsert.data_inicio = dados.data_inicio
      if (dados.data_fim) propostaInsert.data_fim = dados.data_fim
      // Campos Linha Amarela
      if (dados.horimetro_saida !== undefined) propostaInsert.horimetro_saida = dados.horimetro_saida
      if (dados.horimetro_saida_foto) propostaInsert.horimetro_saida_foto = dados.horimetro_saida_foto
      if (dados.com_operador !== undefined) propostaInsert.com_operador = dados.com_operador
      if (dados.valor_operador_diaria !== undefined) propostaInsert.valor_operador_diaria = dados.valor_operador_diaria
      if (dados.tipo_veiculo_transporte) propostaInsert.tipo_veiculo_transporte = dados.tipo_veiculo_transporte

      const { data: propostaData, error: propostaError } = await supabase
        .from('propostas')
        .insert(propostaInsert)
        .select('id')
        .single()

      if (propostaError) {
        console.error('[enviarProposta] Erro ao criar proposta:', propostaError.message)
        return { success: false, error: propostaError.message }
      }

      if (!propostaData) {
        return { success: false, error: 'Erro ao criar proposta: dados não retornados' }
      }

      // Atualiza o chat para vincular à proposta (chats.proposta_id)
      const { error: chatError } = await supabase
        .from('chats')
        .update({ proposta_id: propostaData.id })
        .eq('id', chatId)

      if (chatError) {
        console.error('[enviarProposta] Erro ao atualizar chat:', chatError.message)
        // Não retorna erro pois a proposta já foi criada
      }

      // Envia mensagem automática informando que proposta foi enviada
      const { error: msgError } = await supabase
        .from('mensagens')
        .insert({
          chat_id: chatId,
          sender_id: locadorId,
          texto: '📋 Proposta de locação enviada! Aguarde a resposta do cliente.',
          lida: false
        })

      if (msgError) {
        console.error('[enviarProposta] Erro ao enviar mensagem:', msgError.message)
      }

      return { success: true }
    } catch (err) {
      console.error('[enviarProposta] Erro inesperado:', err)
      return { success: false, error: 'Erro inesperado ao enviar proposta' }
    }
  }

  const fetchProposta = async (propostaId: string): Promise<Proposta | null> => {
    try {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .eq('id', propostaId)
        .single()

      if (error || !data) {
        return null
      }

      return data as Proposta
    } catch {
      return null
    }
  }

  // Interface para parâmetros da RPC aceitar_proposta_v7
  // A RPC v7 usa SECURITY DEFINER para bypassar RLS e atualiza status_locacao
  // Ordem dos parâmetros: p_proposta_id, p_equipamento_id, p_chat_id, p_sender_id, p_aceitar
  interface ResponderPropostaParams {
    p_proposta_id: string
    p_equipamento_id: string
    p_chat_id: string
    p_sender_id: string
    p_aceitar: boolean
  }

  // Interface para resposta da RPC
  interface RPCResponse {
    success: boolean
    error?: string
    message?: string
  }

  const responderProposta = async (
    propostaId: string,
    chatId: string,
    aceitar: boolean,
    userId: string, // ID do usuário logado (locatário que aceita/recusa)
    endereco?: EnderecoEntrega
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Busca o equipamento_id do chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('equipamento_id')
        .eq('id', chatId)
        .single()

      if (chatError || !chatData?.equipamento_id) {
        console.error('[responderProposta] Erro ao buscar chat:', chatError?.message)
        return { success: false, error: 'Chat não encontrado' }
      }

      // Validação: verifica se nenhum parâmetro é undefined
      if (!propostaId || !chatData.equipamento_id || !chatId || !userId) {
        console.error('[responderProposta] Parâmetros inválidos:', {
          propostaId,
          equipamento_id: chatData.equipamento_id,
          chatId,
          userId,
          aceitar
        })
        return { success: false, error: 'Parâmetros inválidos para a RPC' }
      }

      // Parâmetros na ordem correta da assinatura da função v7
      const params: ResponderPropostaParams = {
        p_proposta_id: propostaId,
        p_equipamento_id: chatData.equipamento_id,
        p_chat_id: chatId,
        p_sender_id: userId,
        p_aceitar: aceitar
      }

      // Chama a RPC estável que usa SECURITY DEFINER para bypassar RLS
      const { data, error } = await supabase.rpc('executar_aceite_proposta', params)

      if (error) {
        console.error('[responderProposta] Erro na RPC:', error)
        // Log adicional para debug de erro PGRST202 (função não encontrada)
        if (error.code === 'PGRST202') {
          console.error('[responderProposta] PGRST202 - Verifique se a função executar_aceite_proposta existe no banco')
        }
        return { success: false, error: error.message || 'Erro ao processar proposta' }
      }

      // Trata a resposta da RPC
      const response = data as RPCResponse | null

      if (response?.success === false) {
        console.error('[responderProposta] RPC retornou erro:', response.error)
        return { success: false, error: response.error || 'Erro ao processar proposta' }
      }

      // Se aceitou e tem endereço, salva o endereço na proposta
      if (aceitar && endereco) {
        await atualizarEnderecoNaProposta(propostaId, endereco)
      }

      // Se aceitou, marca o equipamento como RESERVADO
      if (aceitar && chatData?.equipamento_id) {
        // Busca o nome do locatário para salvar no equipamento
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, nome_empresa, email')
          .eq('id', userId)
          .single()

        const nomeCliente = profileData?.nome_empresa || profileData?.full_name || profileData?.email || 'Cliente'

        const { error: equipamentoError } = await supabase
          .from('equipamentos')
          .update({
            status: 'RESERVADO',
            locado_para: nomeCliente,
            locado_para_id: userId
          })
          .eq('id', chatData.equipamento_id)

        if (equipamentoError) {
          console.warn('[responderProposta] Erro ao marcar equipamento como RESERVADO:', equipamentoError.message)
        } else {
          await fetchEquipamentos()
        }
      }

      return { success: true }

    } catch (err) {
      console.error('[responderProposta] Erro inesperado:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro inesperado ao processar proposta'
      }
    }
  }

  // Atualiza o endereço de entrega na proposta
  // ESTRUTURA REAL DO BANCO: só tem endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
  // NÃO TEM: endereco_numero, endereco_bairro, endereco_complemento
  const atualizarEnderecoNaProposta = async (
    propostaId: string,
    endereco: EnderecoEntrega
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('propostas')
        .update({
          endereco_cep: endereco.cep,
          endereco_logradouro: endereco.logradouro,  // Já vem combinado do modal
          endereco_cidade: endereco.cidade,
          endereco_uf: endereco.uf
        })
        .eq('id', propostaId)

      if (error) {
        console.error('[atualizarEnderecoNaProposta] Erro:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      console.error('[atualizarEnderecoNaProposta] Erro inesperado:', err)
      return { success: false, error: 'Erro ao salvar endereço' }
    }
  }

  // Busca quantidade de CHATS únicos com mensagens não lidas para o usuário
  // (não conta mensagens individuais, apenas quantos chats têm pelo menos 1 msg não lida)
  const fetchMensagensNaoLidas = async (userId: string): Promise<number> => {
    try {
      // Primeiro busca os chats do usuário
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .or(`locador_id.eq.${userId},locatario_id.eq.${userId}`)

      if (chatsError || !chats || chats.length === 0) {
        setMensagensNaoLidas(0)
        return 0
      }

      const chatIds = chats.map(c => c.id)

      // Busca mensagens não lidas agrupadas por chat_id
      // RAIO-X: mensagens usa sender_id (não remetente_id)
      const { data: mensagensNaoLidasData, error } = await supabase
        .from('mensagens')
        .select('chat_id')
        .in('chat_id', chatIds)
        .neq('sender_id', userId)
        .or('lida.is.null,lida.eq.false')

      if (error) {
        console.error('[fetchMensagensNaoLidas] Erro:', error)
        setMensagensNaoLidas(0)
        return 0
      }

      // Conta chats únicos com mensagens não lidas
      const chatsComMensagensNaoLidas = new Set(mensagensNaoLidasData?.map(m => m.chat_id) || [])
      const totalChatsNaoLidos = chatsComMensagensNaoLidas.size

      setMensagensNaoLidas(totalChatsNaoLidos)
      return totalChatsNaoLidos
    } catch (err) {
      console.error('[fetchMensagensNaoLidas] Erro inesperado:', err)
      setMensagensNaoLidas(0)
      return 0
    }
  }

  // Marca todas as mensagens de um chat como lidas
  const marcarMensagensComoLidas = async (chatId: string, userId: string): Promise<void> => {
    try {
      // Update 1: marca mensagens com lida = false
      const { error: err1 } = await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('lida', false)

      if (err1) {
        console.error('[marcarMensagensComoLidas] Erro update lida=false:', err1)
      }

      // Update 2: marca mensagens com lida = null (fallback)
      const { error: err2 } = await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .is('lida', null)

      if (err2) {
        console.error('[marcarMensagensComoLidas] Erro update lida=null:', err2)
      }

      // Atualiza o contador local
      await fetchMensagensNaoLidas(userId)
    } catch (err) {
      console.error('[marcarMensagensComoLidas] Erro inesperado:', err)
    }
  }

  // Busca entregas pendentes (propostas aceitas que ainda não foram entregues)
  // ESTRUTURA REAL DO BANCO:
  // - propostas: id, equipamento_id, usuario_id, status, endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
  // - chats: id, proposta_id, locador_id, locatario_id
  const fetchEntregasPendentes = async (locadorId: string): Promise<EntregaPendente[]> => {
    try {
      // 1. Busca chats do locador (chats têm proposta_id, NÃO equipamento_id)
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id, proposta_id, locatario_id')
        .eq('locador_id', locadorId)

      if (chatsError) {
        console.error('[fetchEntregasPendentes] Erro ao buscar chats:', chatsError)
        return []
      }

      if (!chats || chats.length === 0) {
        return []
      }

      // 2. Busca propostas aceitas pelos IDs dos chats
      const propostaIds = chats.map(c => c.proposta_id).filter(Boolean)

      if (propostaIds.length === 0) {
        return []
      }

      // Busca propostas aceitas que NÃO foram entregues ainda
      // status_entrega pode ser null (não entregue) ou 'ENTREGUE' (já entregue)
      const { data: propostas, error: propostasError } = await supabase
        .from('propostas')
        .select('id, equipamento_id, usuario_id, status, status_entrega, endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf, created_at')
        .in('id', propostaIds)
        .eq('status', 'aceita')

      if (propostasError) {
        console.error('[fetchEntregasPendentes] Erro ao buscar propostas:', propostasError)
        return []
      }

      if (!propostas || propostas.length === 0) {
        return []
      }

      // Filtra apenas propostas que NÃO foram entregues
      const propostasPendentes = propostas.filter(p => {
        const statusEntrega = (p as { status_entrega?: string }).status_entrega
        return !statusEntrega || statusEntrega !== 'ENTREGUE'
      })

      if (propostasPendentes.length === 0) {
        return []
      }

      // 3. Busca equipamentos das propostas pendentes
      const equipamentoIds = [...new Set(propostasPendentes.map(p => p.equipamento_id).filter(Boolean))]
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('id, nome')
        .in('id', equipamentoIds)

      const equipamentosMap = new Map((equipamentos || []).map(e => [e.id, e.nome]))

      // 4. Busca clientes (locatários) - usuario_id na proposta é o locatário
      const clienteIds = [...new Set(propostasPendentes.map(p => p.usuario_id).filter(Boolean))]
      const { data: clientes, error: clientesError } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa, email')
        .in('id', clienteIds)

      if (clientesError) {
        console.warn('[fetchEntregasPendentes] Erro ao buscar clientes:', clientesError.message)
      }

      // Mapeia clientes priorizando nome_empresa > full_name > email
      const clientesMap = new Map((clientes || []).map(c => [
        c.id,
        c.nome_empresa || c.full_name || c.email || 'Cliente'
      ]))

      // 5. Monta a lista de entregas pendentes
      // ESTRUTURA REAL: só tem endereco_logradouro, endereco_cep, endereco_cidade, endereco_uf
      const entregas: EntregaPendente[] = propostasPendentes.map(proposta => {
        return {
          proposta_id: proposta.id,
          equipamento_id: proposta.equipamento_id,
          equipamento_nome: equipamentosMap.get(proposta.equipamento_id) || 'Equipamento',
          cliente_nome: clientesMap.get(proposta.usuario_id) || 'Cliente',
          cliente_id: proposta.usuario_id,
          endereco_cep: proposta.endereco_cep,
          endereco_logradouro: proposta.endereco_logradouro,
          endereco_cidade: proposta.endereco_cidade,
          endereco_uf: proposta.endereco_uf,
          data_aceite: proposta.created_at
        }
      })

      return entregas
    } catch (err) {
      console.error('[fetchEntregasPendentes] Erro:', err)
      return []
    }
  }

  // Marca uma entrega como realizada via RPC
  // Marca equipamento como entregue ao cliente
  // ESTRUTURA REAL: equipamentos só tem campo 'status' (não status_locacao ou disponivel)
  const marcarComoEntregue = async (
    propostaId: string,
    equipamentoId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Tenta usar a RPC se existir
      const { data, error } = await supabase.rpc('marcar_como_entregue', {
        p_equipamento_id: equipamentoId,
        p_proposta_id: propostaId
      })

      // Se RPC não existir, usa fallback com estrutura real do banco
      if (error) {
        console.warn('[marcarComoEntregue] RPC não disponível, usando fallback:', error.message)

        // 1. Atualiza proposta com status_entrega = ENTREGUE
        const { error: propostaError } = await supabase
          .from('propostas')
          .update({ status_entrega: 'ENTREGUE' })
          .eq('id', propostaId)

        if (propostaError) {
          console.error('[marcarComoEntregue] Erro ao atualizar proposta:', propostaError)
          return { success: false, error: propostaError.message }
        }

        // 2. Atualiza equipamento como OCUPADO
        const { error: equipamentoError } = await supabase
          .from('equipamentos')
          .update({ status: 'OCUPADO' })  // Marca como ocupado (em uso)
          .eq('id', equipamentoId)

        if (equipamentoError) {
          console.error('[marcarComoEntregue] Erro ao atualizar equipamento:', equipamentoError)
          return { success: false, error: equipamentoError.message }
        }

        return { success: true }
      }

      // Trata resposta da RPC
      const response = data as { success: boolean; error?: string } | null
      if (response?.success === false) {
        return { success: false, error: response.error || 'Erro ao marcar entrega' }
      }

      return { success: true }
    } catch (err) {
      console.error('[marcarComoEntregue] Erro inesperado:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro inesperado'
      }
    }
  }

  // Despacha equipamento para o cliente (RESERVADO → OCUPADO direto, sem etapa EM_TRANSITO)
  const despacharEquipamento = async (
    propostaId: string,
    equipamentoId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: eqError } = await supabase
        .from('equipamentos')
        .update({ status: 'OCUPADO' })
        .eq('id', equipamentoId)

      if (eqError) {
        console.error('[despacharEquipamento] Erro:', eqError)
        return { success: false, error: eqError.message }
      }

      // Marca proposta com status_entrega = ENTREGUE
      await supabase
        .from('propostas')
        .update({ status_entrega: 'ENTREGUE' })
        .eq('id', propostaId)

      // Envia mensagem automática no chat
      const { data: chatData } = await supabase
        .from('chats')
        .select('id, locador_id')
        .eq('proposta_id', propostaId)
        .single()

      if (chatData?.id) {
        await supabase.from('mensagens').insert({
          chat_id: chatData.id,
          sender_id: chatData.locador_id,
          texto: '🚛 Equipamento enviado ao cliente!',
          lida: false
        })
      }

      await fetchEquipamentos()
      return { success: true }
    } catch (err) {
      console.error('[despacharEquipamento] Erro inesperado:', err)
      return { success: false, error: 'Erro inesperado ao despachar equipamento' }
    }
  }

  // Edita uma proposta pendente (locador pode alterar valores antes do aceite)
  const editarProposta = async (
    propostaId: string,
    dados: Partial<NovaProposta>
  ): Promise<{ success: boolean; error?: string }> => {
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

      const { error } = await supabase
        .from('propostas')
        .update(updateFields)
        .eq('id', propostaId)
        .eq('status', 'pendente') // Só permite editar propostas pendentes

      if (error) {
        console.error('[editarProposta] Erro:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      console.error('[editarProposta] Erro inesperado:', err)
      return { success: false, error: 'Erro inesperado ao editar proposta' }
    }
  }

  // Confirma a devolução/retorno do equipamento
  // Preserva histórico de mensagens e proposta
  const confirmarRetorno = async (
    propostaId: string,
    equipamentoId: string,
    horimetroDados?: { horimetro_chegada?: number; horimetro_chegada_foto?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Salvar dados de horímetro de chegada na proposta (se fornecidos - Linha Amarela)
      if (horimetroDados && (horimetroDados.horimetro_chegada !== undefined || horimetroDados.horimetro_chegada_foto)) {
        const updateData: any = {}
        if (horimetroDados.horimetro_chegada !== undefined) updateData.horimetro_chegada = horimetroDados.horimetro_chegada
        if (horimetroDados.horimetro_chegada_foto) updateData.horimetro_chegada_foto = horimetroDados.horimetro_chegada_foto

        await supabase.from('propostas').update(updateData).eq('id', propostaId)
      }

      // Tenta usar a RPC se existir
      const { data, error } = await supabase.rpc('confirmar_retorno', {
        p_equipamento_id: equipamentoId,
        p_proposta_id: propostaId
      })

      // Se RPC não existir, usa fallback com estrutura real do banco
      if (error) {
        console.warn('[confirmarRetorno] RPC não disponível, usando fallback:', error.message)

        // 1. Busca o chat associado a esta proposta
        const { data: chatData } = await supabase
          .from('chats')
          .select('id, locador_id')
          .eq('proposta_id', propostaId)
          .single()

        // 2. Mantém proposta_id no chat (NÃO reseta - preserva referência para status bar e histórico)
        if (chatData?.id) {
          // Envia mensagem automática de devolução confirmada
          await supabase.from('mensagens').insert({
            chat_id: chatData.id,
            sender_id: chatData.locador_id,
            texto: '✅ Devolução confirmada! Equipamento disponível novamente.',
            lida: false
          })
        }

        // 3. Marca proposta como finalizada (preserva dados para histórico)
        const { error: finalizarPropostaError } = await supabase
          .from('propostas')
          .update({ status: 'finalizada' })
          .eq('id', propostaId)

        if (finalizarPropostaError) {
          console.warn('[confirmarRetorno] Erro ao finalizar proposta:', finalizarPropostaError.message)
        }

        // 4. Atualiza equipamento como DISPONIVEL e limpa dados de locação
        const { error: equipamentoError } = await supabase
          .from('equipamentos')
          .update({
            status: 'DISPONIVEL',
            locado_para: null,
            locado_para_id: null
          })
          .eq('id', equipamentoId)

        if (equipamentoError) {
          console.error('[confirmarRetorno] Erro ao atualizar equipamento:', equipamentoError)
          return { success: false, error: equipamentoError.message }
        }

        // Atualiza a lista de equipamentos para que apareça na Home
        await fetchEquipamentos()

        return { success: true }
      }

      // Trata resposta da RPC
      const response = data as { success: boolean; error?: string } | null
      if (response?.success === false) {
        return { success: false, error: response.error || 'Erro ao confirmar retorno' }
      }

      // Atualiza equipamentos localmente para mostrar na Home
      await fetchEquipamentos()

      return { success: true }
    } catch (err) {
      console.error('[confirmarRetorno] Erro inesperado:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro inesperado'
      }
    }
  }

  // Função para converter imagens para base64 (funciona sempre!)
  const uploadImagens = async (
    files: File[],
    locadorId: string
  ): Promise<{ urls: string[]; error?: string }> => {
    try {
      const urls: string[] = []

      for (const file of files) {
        // Converte para base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        urls.push(base64)
      }

      return { urls }
    } catch (err) {
      console.error('[uploadImagens] Erro inesperado:', err)
      return { urls: [], error: 'Erro inesperado ao converter imagens' }
    }
  }

  // Função para deletar equipamento
  const deletarEquipamento = async (
    equipamentoId: string,
    locadorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verifica se o usuário é o dono do equipamento
      const equipamento = equipamentos.find(eq => eq.id === equipamentoId)
      if (!equipamento || equipamento.locador_id !== locadorId) {
        return { success: false, error: 'Você não tem permissão para deletar este equipamento' }
      }

      // As imagens são base64 agora, não precisa deletar do Storage

      // Deleta o equipamento do banco
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', equipamentoId)
        .eq('locador_id', locadorId) // Segurança extra

      if (error) {
        console.error('[deletarEquipamento] Erro:', error)
        return { success: false, error: error.message }
      }

      // Atualiza o estado local
      setEquipamentos(prev => prev.filter(eq => eq.id !== equipamentoId))

      return { success: true }
    } catch (err) {
      console.error('[deletarEquipamento] Erro inesperado:', err)
      return { success: false, error: 'Erro inesperado ao deletar equipamento' }
    }
  }

  // Função para atualizar equipamento
  const atualizarEquipamento = async (
    equipamentoId: string,
    dados: NovoEquipamento,
    locadorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update({
          nome: dados.nome,
          descricao: dados.descricao,
          preco_diaria: dados.preco_diaria,
          categoria: dados.categoria,
          cidade: dados.cidade,
          uf: dados.uf,
          fotos: dados.fotos,
          // Novos campos técnicos para Linha Amarela
          ano: dados.ano || null,
          horimetro_atual: dados.horimetro_atual || null,
          peso_operacional: dados.peso_operacional || null,
          // NÃO atualizar selo_verificado (apenas admin pode alterar)
          // Campos Light Equipment
          voltagem: dados.voltagem || null
        })
        .eq('id', equipamentoId)
        .eq('locador_id', locadorId)

      if (error) {
        console.error('[atualizarEquipamento] Erro:', error)
        return { success: false, error: error.message }
      }

      // Atualiza o estado local
      await fetchEquipamentos()

      return { success: true }
    } catch (err) {
      console.error('[atualizarEquipamento] Erro inesperado:', err)
      return { success: false, error: 'Erro inesperado ao atualizar equipamento' }
    }
  }

  // ===== Funções de Consumíveis =====

  const fetchConsumiveis = async (equipamentoId: string): Promise<Consumivel[]> => {
    try {
      const { data, error } = await supabase
        .from('consumiveis')
        .select('*')
        .eq('equipamento_id', equipamentoId)
        .eq('ativo', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[fetchConsumiveis] Erro:', error.message)
        return []
      }
      return (data || []) as Consumivel[]
    } catch {
      return []
    }
  }

  const addConsumivel = async (
    equipamentoId: string,
    nome: string,
    preco: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('consumiveis')
        .insert({ equipamento_id: equipamentoId, nome, preco, ativo: true })

      if (error) {
        console.error('[addConsumivel] Erro:', error.message)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao adicionar consumível' }
    }
  }

  const removeConsumivel = async (
    consumivelId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('consumiveis')
        .update({ ativo: false })
        .eq('id', consumivelId)

      if (error) {
        console.error('[removeConsumivel] Erro:', error.message)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao remover consumível' }
    }
  }

  const salvarConsumiveisProposta = async (
    propostaId: string,
    items: { consumivel_id: string; quantidade: number; preco_unitario: number }[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Remove consumíveis anteriores desta proposta
      await supabase.from('proposta_consumiveis').delete().eq('proposta_id', propostaId)

      if (items.length === 0) return { success: true }

      const inserts = items.map(item => ({
        proposta_id: propostaId,
        consumivel_id: item.consumivel_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario
      }))

      const { error } = await supabase.from('proposta_consumiveis').insert(inserts)

      if (error) {
        console.error('[salvarConsumiveisProposta] Erro:', error.message)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao salvar consumíveis da proposta' }
    }
  }

  const fetchConsumiveisProposta = async (propostaId: string): Promise<PropostaConsumivel[]> => {
    try {
      const { data, error } = await supabase
        .from('proposta_consumiveis')
        .select('*, consumivel:consumiveis(nome)')
        .eq('proposta_id', propostaId)

      if (error) {
        console.error('[fetchConsumiveisProposta] Erro:', error.message)
        return []
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        proposta_id: item.proposta_id,
        consumivel_id: item.consumivel_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        nome: item.consumivel?.nome || 'Item'
      }))
    } catch {
      return []
    }
  }

  // ===== Admin: Toggle Destaque =====

  const toggleDestaque = async (
    equipamentoId: string,
    destaque: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update({ destaque })
        .eq('id', equipamentoId)

      if (error) {
        console.error('[toggleDestaque] Erro:', error.message)
        return { success: false, error: error.message }
      }

      await fetchEquipamentos()
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao atualizar destaque' }
    }
  }

  // Referência para o userId atual (para o Realtime de mensagens)
  const currentUserIdRef = useRef<string | null>(null)

  // Configura Realtime para mensagens (incrementa contador quando recebe nova mensagem)
  const setupMensagensRealtime = useCallback((userId: string) => {
    // Remove channel anterior se existir
    if (mensagensChannelRef.current) {
      supabase.removeChannel(mensagensChannelRef.current)
    }

    currentUserIdRef.current = userId

    const channel = supabase
      .channel('mensagens-nao-lidas')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens'
        },
        async (payload) => {
          const novaMensagem = payload.new as Mensagem
          // RAIO-X: mensagens usa sender_id (não remetente_id)
          if (novaMensagem.sender_id !== currentUserIdRef.current) {
            // Recarrega contador para garantir precisão
            if (currentUserIdRef.current) {
              await fetchMensagensNaoLidas(currentUserIdRef.current)
            }
          }
        }
      )
      .subscribe()

    mensagensChannelRef.current = channel
  }, [])

  useEffect(() => {
    // Busca inicial
    fetchEquipamentos()

    // Configura Supabase Realtime para equipamentos
    const channel = supabase
      .channel('equipamentos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipamentos'
        },
        (payload) => {
          handleRealtimeEvent(payload as unknown as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE'
            new: Equipamento | null
            old: { id: string } | null
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    // Refetch quando a janela ganha foco (fallback para sincronia entre abas)
    const handleFocus = () => {
      fetchEquipamentos()
    }
    window.addEventListener('focus', handleFocus)

    // Refetch quando a aba fica visível novamente
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEquipamentos()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (mensagensChannelRef.current) {
        supabase.removeChannel(mensagensChannelRef.current)
      }
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchEquipamentos, handleRealtimeEvent])

  return (
    <AppContext.Provider
      value={{
        equipamentos,
        loadingEquipamentos,
        refetchEquipamentos: fetchEquipamentos,
        addEquipamento,
        fetchMeusEquipamentos,
        iniciarChat,
        enviarMensagem,
        fetchMensagens,
        fetchMeusChats,
        fetchChatExistente,
        fetchChat,
        enviarProposta,
        fetchProposta,
        responderProposta,
        atualizarEnderecoNaProposta,
        mensagensNaoLidas,
        fetchMensagensNaoLidas,
        marcarMensagensComoLidas,
        setupMensagensRealtime,
        fetchEntregasPendentes,
        marcarComoEntregue,
        despacharEquipamento,
        confirmarRetorno,
        editarProposta,
        uploadImagens,
        deletarEquipamento,
        atualizarEquipamento,
        fetchConsumiveis,
        addConsumivel,
        removeConsumivel,
        salvarConsumiveisProposta,
        fetchConsumiveisProposta,
        toggleDestaque
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
