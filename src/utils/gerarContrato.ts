import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Proposta, Chat, Equipamento } from '../contexts/AppContext'

interface DadosContrato {
  proposta: Proposta
  chat: Chat
  equipamento: Equipamento
  locadorNome: string
  locatarioNome: string
}

// Tipo para o contrato completo com mais detalhes
interface DadosContratoCompleto {
  contratoId: string

  // Identificação das partes
  locador: {
    nome: string
    cpfCnpj: string
    endereco?: string
    telefone?: string
    email?: string
  }
  locatario: {
    nome: string
    cpfCnpj: string
    endereco?: string
    telefone?: string
    email?: string
  }

  // Equipamento
  equipamento: {
    nome: string
    categoria: string
    numeroSerie?: string
    especificacoes?: string
  }

  // Valores e prazo
  valores: {
    valorDiaria: number
    quantidadeDias: number
    valorFrete?: number
    valorOperadorDiaria?: number
    comOperador: boolean
    desconto?: number
    taxaExtra?: number
    valorTotal: number
  }

  // Datas
  dataInicio: string
  dataFim: string
  dataContrato: string

  // Logística
  enderecoEntrega: {
    logradouro: string
    cidade: string
    uf: string
    cep: string
  }
}

// Formata data para pt-BR
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Não informado'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Formata valor em reais
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Gera o PDF do Termo de Locação (formato limpo e profissional)
export function gerarTermoLocacao(dados: DadosContrato): void {
  const { proposta, chat, equipamento, locadorNome, locatarioNome } = dados

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 25
  let yPos = margin

  // Função auxiliar para verificar se precisa nova página
  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - 20) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // ========== HEADER - APENAS TRAKTO ==========
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('TRAKTO', pageWidth / 2, yPos, { align: 'center' })

  yPos += 15

  // ========== TÍTULO DO DOCUMENTO ==========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMO DE LOCAÇÃO DE EQUIPAMENTO', pageWidth / 2, yPos, { align: 'center' })

  yPos += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Termo nº ${proposta.id.substring(0, 8).toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' })

  yPos += 15

  // ========== CORPO DO DOCUMENTO ==========
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  // PARTES ENVOLVIDAS
  doc.setFont('helvetica', 'bold')
  doc.text('LOCADOR:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(locadorNome || 'Locador', margin + 25, yPos)

  yPos += 6

  doc.setFont('helvetica', 'bold')
  doc.text('LOCATÁRIO:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(locatarioNome || 'Locatário', margin + 30, yPos)

  yPos += 15

  // EQUIPAMENTO
  checkPageBreak(30)
  doc.setFont('helvetica', 'bold')
  doc.text('EQUIPAMENTO LOCADO:', margin, yPos)
  yPos += 6

  doc.setFont('helvetica', 'normal')
  const equipText = `${equipamento.nome || 'Não identificado'}, categoria ${equipamento.categoria || 'não informada'}${equipamento.numero_serie ? `, número de série ${equipamento.numero_serie}` : ''}. Localização: ${equipamento.cidade || ''} / ${equipamento.uf || ''}`.trim()

  const equipLines = doc.splitTextToSize(equipText, pageWidth - margin * 2)
  doc.text(equipLines, margin, yPos)
  yPos += equipLines.length * 5 + 8

  // PERÍODO
  checkPageBreak(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PERÍODO DA LOCAÇÃO:', margin, yPos)
  yPos += 6

  doc.setFont('helvetica', 'normal')
  doc.text(`Início: ${formatDate(proposta.data_inicio)} - Término: ${formatDate(proposta.data_fim)} (${proposta.quantidade_dias || 0} dias)`, margin, yPos)
  yPos += 12

  // VALORES
  checkPageBreak(40)
  doc.setFont('helvetica', 'bold')
  doc.text('VALORES:', margin, yPos)
  yPos += 6

  doc.setFont('helvetica', 'normal')
  doc.text(`Diária: ${formatCurrency(proposta.valor_diaria)} x ${proposta.quantidade_dias || 0} dias = ${formatCurrency((proposta.valor_diaria || 0) * (proposta.quantidade_dias || 0))}`, margin, yPos)
  yPos += 5

  if (proposta.valor_frete != null && proposta.valor_frete > 0) {
    doc.text(`Frete: ${formatCurrency(proposta.valor_frete)}`, margin, yPos)
    yPos += 5
  } else if (proposta.valor_frete === 0) {
    doc.text('Frete: GRÁTIS', margin, yPos)
    yPos += 5
  }

  if (proposta.desconto && proposta.desconto > 0) {
    doc.text(`Desconto: - ${formatCurrency(proposta.desconto)}`, margin, yPos)
    yPos += 5
  }

  if (proposta.taxa_extra && proposta.taxa_extra > 0) {
    doc.text(`Taxa Extra: ${formatCurrency(proposta.taxa_extra)}`, margin, yPos)
    yPos += 5
  }

  if (proposta.com_operador && proposta.valor_operador_diaria) {
    doc.text(`Operador: ${formatCurrency(proposta.valor_operador_diaria)} x ${proposta.quantidade_dias || 0} dias = ${formatCurrency(proposta.valor_operador_diaria * (proposta.quantidade_dias || 0))}`, margin, yPos)
    yPos += 5
  }

  yPos += 3
  doc.setFont('helvetica', 'bold')
  doc.text(`VALOR TOTAL: ${formatCurrency(proposta.valor_total)}`, margin, yPos)
  yPos += 12

  // ENDEREÇO DE ENTREGA
  if (proposta.endereco_logradouro || chat.endereco_entrega_logradouro) {
    checkPageBreak(20)
    doc.setFont('helvetica', 'bold')
    doc.text('ENDEREÇO DE ENTREGA:', margin, yPos)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    const endereco = proposta.endereco_logradouro || chat.endereco_entrega_logradouro || ''
    const cidade = proposta.endereco_cidade || chat.endereco_entrega_cidade || ''
    const uf = proposta.endereco_uf || chat.endereco_entrega_uf || ''
    const cep = proposta.endereco_cep || chat.endereco_entrega_cep || ''

    doc.text(`${endereco}, ${cidade}/${uf} - CEP: ${cep}`, margin, yPos)
    yPos += 12
  }

  // ASSINATURAS
  checkPageBreak(40)
  yPos += 10

  const dataAssinatura = formatDate(new Date().toISOString())
  doc.text(`Por estarem assim justos e contratados, firmam o presente termo.`, margin, yPos)
  yPos += 10

  doc.text(`${equipamento.cidade || 'Local'}, ${dataAssinatura}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 20

  const sigWidth = (pageWidth - margin * 2 - 20) / 2

  // Linha assinatura locador
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.line(margin, yPos, margin + sigWidth, yPos)

  doc.setFontSize(9)
  doc.text(locadorNome || 'Locador', margin + sigWidth / 2, yPos + 5, { align: 'center' })
  doc.text('LOCADOR', margin + sigWidth / 2, yPos + 10, { align: 'center' })

  // Linha assinatura locatário
  doc.line(margin + sigWidth + 20, yPos, pageWidth - margin, yPos)
  doc.text(locatarioNome || 'Locatário', margin + sigWidth + 20 + sigWidth / 2, yPos + 5, { align: 'center' })
  doc.text('LOCATÁRIO', margin + sigWidth + 20 + sigWidth / 2, yPos + 10, { align: 'center' })

  // ========== FOOTER SIMPLES EM TODAS AS PÁGINAS ==========
  const totalPages = (doc as any).internal.pages.length - 1

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(`Documento gerado pela plataforma TRAKTO em ${dataAssinatura}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
  }

  // ========== DOWNLOAD ==========
  const nomeArquivo = `Termo_Locacao_${equipamento.nome?.replace(/\s+/g, '_') || 'Equipamento'}_${proposta.id.substring(0, 8)}.pdf`
  doc.save(nomeArquivo)
}

// Gera o PDF do Contrato Completo de Locação
export function gerarContratoCompleto(dados: DadosContratoCompleto): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 25
  let yPos = margin

  // Função auxiliar para verificar se precisa nova página
  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - 20) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // ========== HEADER - APENAS TRAKTO ==========
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('TRAKTO', pageWidth / 2, yPos, { align: 'center' })

  yPos += 15

  // ========== TÍTULO DO CONTRATO ==========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRATO DE LOCAÇÃO DE EQUIPAMENTO', pageWidth / 2, yPos, { align: 'center' })

  yPos += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Contrato nº ${dados.contratoId.substring(0, 8).toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' })

  yPos += 15

  // ========== CORPO DO CONTRATO ==========
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  // QUALIFICAÇÃO DAS PARTES
  const paragrafo1 = `Pelo presente instrumento particular de Contrato de Locação de Equipamento, de um lado ${dados.locador.nome}, inscrito no CPF/CNPJ sob nº ${dados.locador.cpfCnpj}, doravante denominado LOCADOR, e de outro lado ${dados.locatario.nome}, inscrito no CPF/CNPJ sob nº ${dados.locatario.cpfCnpj}, doravante denominado LOCATÁRIO, têm entre si justo e contratado o presente Contrato de Locação de Equipamento, que se regerá pelas seguintes cláusulas e condições:`

  const lines1 = doc.splitTextToSize(paragrafo1, pageWidth - margin * 2)
  doc.text(lines1, margin, yPos)
  yPos += lines1.length * 5 + 8

  // CLÁUSULA 1 - OBJETO
  checkPageBreak(25)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA PRIMEIRA - DO OBJETO', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula1 = `O presente contrato tem por objeto a locação do equipamento ${dados.equipamento.nome}, categoria ${dados.equipamento.categoria}${dados.equipamento.numeroSerie ? `, número de série ${dados.equipamento.numeroSerie}` : ''}${dados.equipamento.especificacoes ? `, com as seguintes especificações: ${dados.equipamento.especificacoes}` : ''}.`

  const lines2 = doc.splitTextToSize(clausula1, pageWidth - margin * 2)
  doc.text(lines2, margin, yPos)
  yPos += lines2.length * 5 + 8

  // CLÁUSULA 2 - PRAZO
  checkPageBreak(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA SEGUNDA - DO PRAZO', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula2 = `O prazo de locação será de ${dados.valores.quantidadeDias} dias, com início em ${formatDate(dados.dataInicio)} e término em ${formatDate(dados.dataFim)}.`

  const lines3 = doc.splitTextToSize(clausula2, pageWidth - margin * 2)
  doc.text(lines3, margin, yPos)
  yPos += lines3.length * 5 + 8

  // CLÁUSULA 3 - VALOR E PAGAMENTO
  checkPageBreak(35)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA TERCEIRA - DO VALOR E FORMA DE PAGAMENTO', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  let valorTexto = `O valor da locação é de ${formatCurrency(dados.valores.valorDiaria)} por diária, totalizando ${formatCurrency(dados.valores.valorDiaria * dados.valores.quantidadeDias)} pelo período contratado.`

  if (dados.valores.valorFrete && dados.valores.valorFrete > 0) {
    valorTexto += ` Acrescido de ${formatCurrency(dados.valores.valorFrete)} referente ao frete.`
  }

  if (dados.valores.comOperador && dados.valores.valorOperadorDiaria) {
    valorTexto += ` Inclui serviço de operador no valor de ${formatCurrency(dados.valores.valorOperadorDiaria)} por diária, totalizando ${formatCurrency(dados.valores.valorOperadorDiaria * dados.valores.quantidadeDias)}.`
  }

  if (dados.valores.desconto && dados.valores.desconto > 0) {
    valorTexto += ` Foi concedido desconto de ${formatCurrency(dados.valores.desconto)}.`
  }

  valorTexto += ` O valor total do contrato é de ${formatCurrency(dados.valores.valorTotal)}.`

  const lines4 = doc.splitTextToSize(valorTexto, pageWidth - margin * 2)
  doc.text(lines4, margin, yPos)
  yPos += lines4.length * 5 + 8

  // CLÁUSULA 4 - ENTREGA E DEVOLUÇÃO
  checkPageBreak(25)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA QUARTA - DA ENTREGA E DEVOLUÇÃO', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula4 = `O equipamento será entregue no endereço ${dados.enderecoEntrega.logradouro}, ${dados.enderecoEntrega.cidade}/${dados.enderecoEntrega.uf}, CEP ${dados.enderecoEntrega.cep}. A devolução do equipamento deverá ocorrer no mesmo local, ao término do prazo contratado, nas mesmas condições em que foi entregue, ressalvado o desgaste natural pelo uso adequado.`

  const lines5 = doc.splitTextToSize(clausula4, pageWidth - margin * 2)
  doc.text(lines5, margin, yPos)
  yPos += lines5.length * 5 + 8

  // CLÁUSULA 5 - OBRIGAÇÕES DO LOCADOR
  checkPageBreak(25)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO LOCADOR', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula5 = `O LOCADOR se obriga a: (a) entregar o equipamento em perfeitas condições de uso e funcionamento; (b) fornecer toda documentação necessária do equipamento; (c) prestar assistência técnica quando necessário, nos termos acordados.`

  const lines6 = doc.splitTextToSize(clausula5, pageWidth - margin * 2)
  doc.text(lines6, margin, yPos)
  yPos += lines6.length * 5 + 8

  // CLÁUSULA 6 - OBRIGAÇÕES DO LOCATÁRIO
  checkPageBreak(30)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA SEXTA - DAS OBRIGAÇÕES DO LOCATÁRIO', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula6 = `O LOCATÁRIO se obriga a: (a) utilizar o equipamento de forma adequada e para os fins a que se destina; (b) arcar com os custos de manutenção preventiva durante o período de locação; (c) comunicar imediatamente ao LOCADOR qualquer defeito ou avaria; (d) devolver o equipamento nas mesmas condições em que o recebeu; (e) não ceder, emprestar ou sublocar o equipamento sem autorização prévia e expressa do LOCADOR; (f) responsabilizar-se por quaisquer danos causados ao equipamento durante o período de locação.`

  const lines7 = doc.splitTextToSize(clausula6, pageWidth - margin * 2)
  doc.text(lines7, margin, yPos)
  yPos += lines7.length * 5 + 8

  // CLÁUSULA 7 - PENALIDADES
  checkPageBreak(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA SÉTIMA - DAS PENALIDADES', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula7 = `O não pagamento no prazo estabelecido acarretará multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de 1% (um por cento) ao mês, sem prejuízo das demais cominações legais.`

  const lines8 = doc.splitTextToSize(clausula7, pageWidth - margin * 2)
  doc.text(lines8, margin, yPos)
  yPos += lines8.length * 5 + 8

  // CLÁUSULA 8 - RESCISÃO
  checkPageBreak(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA OITAVA - DA RESCISÃO', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula8 = `O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação prévia de 5 (cinco) dias, ficando a parte que der causa ao rompimento sujeita ao pagamento de multa equivalente a 20% (vinte por cento) do valor total do contrato.`

  const lines9 = doc.splitTextToSize(clausula8, pageWidth - margin * 2)
  doc.text(lines9, margin, yPos)
  yPos += lines9.length * 5 + 8

  // CLÁUSULA 9 - DISPOSIÇÕES GERAIS
  checkPageBreak(25)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA NONA - DAS DISPOSIÇÕES GERAIS', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula9 = `Este contrato foi gerado através da plataforma TRAKTO. As partes declaram estar cientes e de acordo com os Termos de Uso da plataforma. Este documento possui validade jurídica e foi aceito digitalmente pelas partes. A assinatura digital registrada na plataforma tem a mesma validade que a assinatura física.`

  const lines10 = doc.splitTextToSize(clausula9, pageWidth - margin * 2)
  doc.text(lines10, margin, yPos)
  yPos += lines10.length * 5 + 8

  // CLÁUSULA 10 - FORO
  checkPageBreak(15)
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULA DÉCIMA - DO FORO', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')

  const clausula10 = `Fica eleito o foro da comarca do LOCADOR para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato, com renúncia expressa de qualquer outro, por mais privilegiado que seja.`

  const lines11 = doc.splitTextToSize(clausula10, pageWidth - margin * 2)
  doc.text(lines11, margin, yPos)
  yPos += lines11.length * 5 + 12

  // ASSINATURAS
  checkPageBreak(40)

  const dataAssinatura = formatDate(dados.dataContrato)
  doc.text(`E por estarem assim justos e contratados, firmam o presente instrumento em duas vias de igual teor e forma, na presença das testemunhas abaixo.`, margin, yPos)
  yPos += 10

  doc.text(`${dados.enderecoEntrega.cidade}, ${dataAssinatura}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 20

  const sigWidth = (pageWidth - margin * 2 - 20) / 2

  // Linha assinatura locador
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.line(margin, yPos, margin + sigWidth, yPos)

  doc.setFontSize(9)
  doc.text(dados.locador.nome, margin + sigWidth / 2, yPos + 5, { align: 'center' })
  doc.text(`CPF/CNPJ: ${dados.locador.cpfCnpj}`, margin + sigWidth / 2, yPos + 10, { align: 'center' })
  doc.text('LOCADOR', margin + sigWidth / 2, yPos + 15, { align: 'center' })

  // Linha assinatura locatário
  doc.line(margin + sigWidth + 20, yPos, pageWidth - margin, yPos)
  doc.text(dados.locatario.nome, margin + sigWidth + 20 + sigWidth / 2, yPos + 5, { align: 'center' })
  doc.text(`CPF/CNPJ: ${dados.locatario.cpfCnpj}`, margin + sigWidth + 20 + sigWidth / 2, yPos + 10, { align: 'center' })
  doc.text('LOCATÁRIO', margin + sigWidth + 20 + sigWidth / 2, yPos + 15, { align: 'center' })

  // ========== FOOTER SIMPLES EM TODAS AS PÁGINAS ==========
  const totalPages = (doc as any).internal.pages.length - 1

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(`Documento gerado pela plataforma TRAKTO em ${dataAssinatura}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
  }

  // ========== DOWNLOAD ==========
  const equipamentoNome = dados.equipamento.nome.replace(/\s+/g, '_')
  const contratoIdCurto = dados.contratoId.substring(0, 8)
  const nomeArquivo = `Contrato_Locacao_${equipamentoNome}_${contratoIdCurto}.pdf`
  doc.save(nomeArquivo)
}
