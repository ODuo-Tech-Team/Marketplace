import type { Chat, Proposta, Equipamento } from '../contexts/AppContext'
import type { Profile } from '../contexts/AuthContext'

/**
 * Interface completa com todos os dados necessários para gerar o contrato
 * Mapeia dados do AppContext para o template do contrato
 */
export interface DadosContratoCompleto {
  // Metadados do contrato
  contratoId: string
  dataContrato: string

  // LOCADOR (Owner/Proprietário)
  locadorNome: string
  locadorDoc: string
  locadorEndereco: string
  locadorCidade: string
  locadorUF: string

  // LOCATÁRIO (Renter/Cliente)
  locatarioNome: string
  locatarioDoc: string
  locatarioEndereco: string
  locatarioCidade: string
  locatarioUF: string

  // EQUIPAMENTO
  equipamentoNome: string
  equipamentoCategoria: string
  equipamentoSerial: string
  equipamentoSpecs: string

  // FINANCEIRO
  valorDiaria: string
  quantidadeDias: string
  valorFrete: string
  valorOperador: string
  valorTotal: string
  dataInicio: string
  dataFim: string

  // LOGÍSTICA
  enderecoEntrega: string
  enderecoEntregaCidade: string
  enderecoEntregaUF: string
  enderecoEntregaCEP: string

  // ADICIONAIS
  formaPagamento: string
  caucao: string
  multaRescisoria: string
  comOperador: boolean
}

/**
 * Formata CPF (###.###.###-##) ou CNPJ (##.###.###/####-##)
 * Retorna 'Não informado' se documento ausente ou inválido
 */
export function formatCPFCNPJ(doc: string | null | undefined): string {
  if (!doc) return 'Não informado'

  // Remove tudo exceto números
  const numbers = doc.replace(/\D/g, '')

  if (numbers.length === 11) {
    // CPF: ###.###.###-##
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else if (numbers.length === 14) {
    // CNPJ: ##.###.###/####-##
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  // Se não for CPF nem CNPJ válido, retorna o original ou fallback
  return doc.trim() || 'Não informado'
}

/**
 * Combina campos de endereço em string formatada
 * Formato: "Rua X, Nº Y, Bairro, Cidade - UF, CEP: Z"
 * Omite campos ausentes graciosamente
 */
export function formatAddress(
  rua: string | null | undefined,
  numero: string | null | undefined,
  bairro: string | null | undefined,
  cidade: string | null | undefined,
  uf: string | null | undefined,
  cep: string | null | undefined
): string {
  const parts: string[] = []

  // Rua e número
  if (rua) {
    parts.push(numero ? `${rua}, Nº ${numero}` : rua)
  }

  // Bairro
  if (bairro) {
    parts.push(bairro)
  }

  // Cidade e UF
  if (cidade && uf) {
    parts.push(`${cidade} - ${uf}`)
  } else if (cidade) {
    parts.push(cidade)
  }

  // CEP
  if (cep) {
    const cepFormatado = cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
    parts.push(`CEP: ${cepFormatado}`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Endereço a definir'
}

/**
 * Gera string de especificações técnicas do equipamento
 * Inclui specs do equipamento + horímetro + voltagem
 */
export function generateSpecsSummary(
  equipamento: Equipamento | null | undefined,
  proposta: Proposta | null | undefined
): string {
  if (!equipamento) return 'Conforme especificado'

  const specs: string[] = []

  // Specs do equipamento (JSONB flexível por vertical)
  if (equipamento.specs && typeof equipamento.specs === 'object') {
    Object.entries(equipamento.specs).forEach(([key, value]) => {
      if (value) {
        // Formata chave (camelCase -> Sentence case)
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim()
        specs.push(`${label}: ${value}`)
      }
    })
  }

  // Ano de fabricação (Linha Amarela)
  if (equipamento.ano) {
    specs.push(`Ano: ${equipamento.ano}`)
  }

  // Peso operacional (Linha Amarela)
  if (equipamento.peso_operacional) {
    specs.push(`Peso: ${equipamento.peso_operacional}t`)
  }

  // Voltagem (Light Equipment)
  if (equipamento.voltagem) {
    specs.push(`Voltagem: ${equipamento.voltagem}`)
  }

  // Horímetro de saída (Linha Amarela - da proposta)
  if (proposta?.horimetro_saida) {
    specs.push(`Horímetro: ${proposta.horimetro_saida}h`)
  }

  // Número de série
  if (equipamento.numero_serie) {
    specs.push(`Série: ${equipamento.numero_serie}`)
  }

  return specs.length > 0 ? specs.join(', ') : 'Conforme especificado'
}

/**
 * Formata valor monetário (R$ X.XXX,XX)
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/**
 * Formata data (DD/MM/AAAA)
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '____/____/____'

  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return '____/____/____'
  }
}

/**
 * Função principal: mapeia dados do AppContext para o formato do contrato
 * Handles gracefully missing data with fallback values
 *
 * @param chat - Chat ativo com dados da solicitação
 * @param proposta - Proposta aceita com valores e datas
 * @param equipamento - Equipamento alugado
 * @param locadorProfile - Perfil do locador (proprietário)
 * @param locatarioProfile - Perfil do locatário (cliente)
 * @returns DadosContratoCompleto com todos os campos preenchidos
 */
export function mapContextToContractData(
  chat: Chat | null | undefined,
  proposta: Proposta | null | undefined,
  equipamento: Equipamento | null | undefined,
  locadorProfile: Profile | null | undefined,
  locatarioProfile: Profile | null | undefined
): DadosContratoCompleto {
  // Metadados do contrato
  const contratoId = proposta?.id || 'N/A'
  const dataContrato = formatDate(new Date().toISOString())

  // LOCADOR (Owner)
  const locadorNome = locadorProfile?.nome_empresa ||
                      locadorProfile?.razao_social ||
                      locadorProfile?.full_name ||
                      'Não informado'
  const locadorDoc = formatCPFCNPJ(locadorProfile?.document_id)
  const locadorEndereco = formatAddress(
    locadorProfile?.rua,
    locadorProfile?.numero,
    locadorProfile?.bairro,
    locadorProfile?.cidade,
    locadorProfile?.uf,
    locadorProfile?.cep
  )
  const locadorCidade = locadorProfile?.cidade || 'Não informado'
  const locadorUF = locadorProfile?.uf || 'Não informado'

  // LOCATÁRIO (Renter)
  const locatarioNome = locatarioProfile?.full_name ||
                        locatarioProfile?.nome_empresa ||
                        chat?.locatario_nome ||
                        'Não informado'
  const locatarioDoc = formatCPFCNPJ(locatarioProfile?.document_id)
  const locatarioEndereco = formatAddress(
    locatarioProfile?.rua,
    locatarioProfile?.numero,
    locatarioProfile?.bairro,
    locatarioProfile?.cidade,
    locatarioProfile?.uf,
    locatarioProfile?.cep
  )
  const locatarioCidade = locatarioProfile?.cidade || 'Não informado'
  const locatarioUF = locatarioProfile?.uf || 'Não informado'

  // EQUIPAMENTO
  const equipamentoNome = equipamento?.nome || 'Não informado'
  const equipamentoCategoria = equipamento?.categoria || 'Não informado'
  const equipamentoSerial = equipamento?.numero_serie || 'Não informado'
  const equipamentoSpecs = generateSpecsSummary(equipamento, proposta)

  // FINANCEIRO
  const valorDiaria = formatCurrency(proposta?.valor_diaria)
  const quantidadeDias = String(proposta?.quantidade_dias || 0)
  const valorFrete = formatCurrency(proposta?.valor_frete)

  // Valor do operador (se solicitado e categoria for Linha Amarela)
  const comOperador = proposta?.com_operador === true
  const valorOperadorNum = comOperador
    ? (proposta?.valor_operador_diaria || 0) * (proposta?.quantidade_dias || 0)
    : 0
  const valorOperador = formatCurrency(valorOperadorNum)

  const valorTotal = formatCurrency(proposta?.valor_total)
  const dataInicio = formatDate(proposta?.data_inicio)
  const dataFim = formatDate(proposta?.data_fim)

  // LOGÍSTICA (endereço de entrega da proposta)
  const enderecoEntrega = proposta?.endereco_logradouro ||
                          chat?.endereco_entrega_logradouro ||
                          'A definir'
  const enderecoEntregaCidade = proposta?.endereco_cidade ||
                                chat?.endereco_entrega_cidade ||
                                'A definir'
  const enderecoEntregaUF = proposta?.endereco_uf ||
                            chat?.endereco_entrega_uf ||
                            'A definir'
  const enderecoEntregaCEP = proposta?.endereco_cep ||
                             chat?.endereco_entrega_cep ||
                             'A definir'

  // ADICIONAIS
  const formaPagamento = 'PIX ou Transferência' // Pode ser expandido futuramente
  const caucao = 'Conforme negociado' // Pode ser campo adicional na proposta
  const multaRescisoria = '20% do valor total' // Padrão do contrato

  return {
    contratoId,
    dataContrato,
    locadorNome,
    locadorDoc,
    locadorEndereco,
    locadorCidade,
    locadorUF,
    locatarioNome,
    locatarioDoc,
    locatarioEndereco,
    locatarioCidade,
    locatarioUF,
    equipamentoNome,
    equipamentoCategoria,
    equipamentoSerial,
    equipamentoSpecs,
    valorDiaria,
    quantidadeDias,
    valorFrete,
    valorOperador,
    valorTotal,
    dataInicio,
    dataFim,
    enderecoEntrega,
    enderecoEntregaCidade,
    enderecoEntregaUF,
    enderecoEntregaCEP,
    formaPagamento,
    caucao,
    multaRescisoria,
    comOperador
  }
}
