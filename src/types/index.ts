import type { VerticalKey } from '../config/verticals'

// ===== EQUIPMENT TYPES =====

export interface Equipamento {
  id: string
  nome: string
  descricao: string | null
  preco_diaria: number
  fotos: string[] | null
  status: string | null
  categoria: string | null
  cidade: string | null
  uf: string | null
  locador_id: string
  created_at: string
  locado_para?: string | null
  locado_para_id?: string | null
  locador_nome_empresa?: string | null
  locador_?: string | null
  locador_full_name?: string | null
  locador_verificado?: boolean | null
  locador_destacado?: boolean | null
  locador_rating_average?: number | null
  locador_reviews_count?: number | null
  locador_tem_loja?: boolean | null
  ano?: number | null
  horimetro_atual?: number | null
  peso_operacional?: number | null
  selo_verificado?: boolean | null
  voltagem?: string | null
  destaque?: boolean | null
  oferece_operador?: boolean | null
  vertical?: string | null
  specs?: Record<string, unknown> | null
  numero_serie?: string | null
}

export const EQUIPMENT_STATUS = {
  DISPONIVEL: 'DISPONIVEL',
  RESERVADO: 'RESERVADO',
  EM_TRANSITO: 'EM_TRANSITO',
  OCUPADO: 'OCUPADO',
} as const

export type EquipmentStatus = typeof EQUIPMENT_STATUS[keyof typeof EQUIPMENT_STATUS]

export interface NovoEquipamento {
  nome: string
  descricao?: string
  preco_diaria: number
  categoria: string
  cidade: string
  uf: string
  fotos?: string[]
  ano?: number
  horimetro_atual?: number
  peso_operacional?: number
  selo_verificado?: boolean
  voltagem?: string
  oferece_operador?: boolean
  vertical?: VerticalKey
  specs?: Record<string, unknown>
}

// ===== INSPECTION TYPES =====

export type InspectionPhotoPosition = 'frente' | 'traseira' | 'lateral_esquerda' | 'lateral_direita'

export interface InspectionPhoto {
  position: InspectionPhotoPosition
  url: string
  uploaded_at: string
}

export interface InspectionData {
  photos: InspectionPhoto[]
  avarias: string
  declaracaoAceita: boolean
}

export const INSPECTION_PHOTO_POSITIONS: { key: InspectionPhotoPosition; label: string }[] = [
  { key: 'frente', label: 'Frente' },
  { key: 'traseira', label: 'Traseira' },
  { key: 'lateral_esquerda', label: 'Lateral Esquerda' },
  { key: 'lateral_direita', label: 'Lateral Direita' },
]

// ===== CHAT TYPES =====

export interface Chat {
  id: string
  equipamento_id: string
  proposta_id?: string | null
  locador_id: string
  locatario_id: string
  created_at: string
  quantidade_dias?: number
  endereco_entrega_logradouro?: string
  endereco_entrega_cep?: string
  endereco_entrega_cidade?: string
  endereco_entrega_uf?: string
  precisa_operador?: boolean
  proposta?: Proposta
  equipamento?: Equipamento
  ultima_mensagem?: string
  ultima_mensagem_data?: string
  ultima_mensagem_lida?: boolean
  ultima_mensagem_sender_id?: string
  locador_nome?: string
  locatario_nome?: string
}

export interface Mensagem {
  id: string
  chat_id: string
  sender_id: string
  texto: string
  lida?: boolean
  created_at: string
  arquivo_url?: string | null
  arquivo_nome?: string | null
  arquivo_tipo?: string | null
  arquivo_tamanho?: number | null
}

export interface ArquivoChat {
  url: string
  nome: string
  tipo: string
  tamanho: number
}

export const TIPOS_ARQUIVO_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const

export const TAMANHO_MAX_ARQUIVO = 10 * 1024 * 1024

// ===== PROPOSAL TYPES =====

export interface Proposta {
  id: string
  equipamento_id: string
  usuario_id: string
  status: string
  created_at: string
  valor_diaria?: number | null
  quantidade_dias?: number | null
  valor_frete?: number | null
  valor_total?: number | null
  desconto?: number | null
  taxa_extra?: number | null
  data_inicio?: string | null
  data_fim?: string | null
  status_entrega?: string | null
  endereco_cep?: string | null
  endereco_logradouro?: string | null
  endereco_cidade?: string | null
  endereco_uf?: string | null
  horimetro_saida?: number | null
  horimetro_saida_foto?: string | null
  horimetro_chegada?: number | null
  horimetro_chegada_foto?: string | null
  com_operador?: boolean | null
  valor_operador_diaria?: number | null
  tipo_veiculo_transporte?: string | null
  inspection_photos?: InspectionPhoto[] | null
  inspection_avarias?: string | null
  inspection_completed_at?: string | null
  inspection_declaracao_aceita?: boolean | null
}

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
  horimetro_saida?: number
  horimetro_saida_foto?: string
  com_operador?: boolean
  valor_operador_diaria?: number
  tipo_veiculo_transporte?: string
}

export interface EnderecoEntrega {
  cep: string
  logradouro: string
  cidade: string
  uf: string
}

// ===== REVIEW TYPES =====

export interface Review {
  id: string
  rental_id: string
  reviewer_id: string
  target_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_name?: string
}

// ===== CONSUMABLE TYPES =====

export interface Consumivel {
  id: string
  equipamento_id: string
  nome: string
  preco: number
  ativo: boolean
  created_at: string
}

export interface PropostaConsumivel {
  id: string
  proposta_id: string
  consumivel_id: string
  quantidade: number
  preco_unitario: number
  nome?: string
}

// ===== DELIVERY TYPES =====

export interface EntregaPendente {
  proposta_id: string
  equipamento_id: string
  equipamento_nome: string
  cliente_nome: string
  cliente_id: string
  endereco_cep: string | null
  endereco_logradouro: string | null
  endereco_cidade: string | null
  endereco_uf: string | null
  data_aceite: string
}
