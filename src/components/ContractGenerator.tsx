import { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  User,
  Building2,
  Package,
  MapPin,
  DollarSign,
  Hash,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react'
import type { DadosContratoCompleto } from '../utils/contractDataMapper'
import { gerarContratoCompleto } from '../utils/gerarContrato'

interface ContractData {
  // Locador
  locadorNome: string
  locadorDoc: string
  locadorEndereco: string
  locadorCidade: string
  locadorUF: string
  // Locatário
  locatarioNome: string
  locatarioDoc: string
  locatarioEndereco: string
  locatarioCidade: string
  locatarioUF: string
  // Equipamento
  equipamentoNome: string
  equipamentoSerial: string
  equipamentoDescricao: string
  enderecoUso: string
  // Financeiro
  valorDiaria: string
  valorTotal: string
  prazoLocacao: string
  dataInicio: string
  dataFim: string
  formaPagamento: string
  // Termos
  caucao: string
  multa: string
}

interface ContractGeneratorProps {
  locadorNome?: string
  locadorDoc?: string
  propostaAtiva?: {
    locatarioNome?: string
    locatarioDoc?: string
    equipamentoNome?: string
    valorDiaria?: number
    valorTotal?: number
    dataInicio?: string
    dataFim?: string
    diasLocacao?: number
  }
  mode?: 'standalone' | 'context-aware'
  initialData?: Partial<DadosContratoCompleto>
}

// Limites de caracteres para cada campo
const MAX_LENGTHS = {
  nome: 100,
  documento: 18,
  endereco: 150,
  cidade: 50,
  uf: 2,
  equipamento: 100,
  serial: 50,
  descricao: 300,
  valor: 15,
  dias: 4
}

export function ContractGenerator({
  locadorNome = '',
  locadorDoc = '',
  propostaAtiva,
  mode = 'standalone',
  initialData
}: ContractGeneratorProps) {
  const [contractData, setContractData] = useState<ContractData>({
    locadorNome: locadorNome,
    locadorDoc: locadorDoc,
    locadorEndereco: '',
    locadorCidade: '',
    locadorUF: '',
    locatarioNome: propostaAtiva?.locatarioNome || '',
    locatarioDoc: propostaAtiva?.locatarioDoc || '',
    locatarioEndereco: '',
    locatarioCidade: '',
    locatarioUF: '',
    equipamentoNome: propostaAtiva?.equipamentoNome || '',
    equipamentoSerial: '',
    equipamentoDescricao: '',
    enderecoUso: '',
    valorDiaria: propostaAtiva?.valorDiaria?.toFixed(2) || '',
    valorTotal: propostaAtiva?.valorTotal?.toFixed(2) || '',
    prazoLocacao: propostaAtiva?.diasLocacao?.toString() || '',
    dataInicio: propostaAtiva?.dataInicio || '',
    dataFim: propostaAtiva?.dataFim || '',
    formaPagamento: 'PIX',
    caucao: '',
    multa: '10'
  })

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill form when initialData is provided
  useEffect(() => {
    if (initialData && mode === 'context-aware') {
      setContractData(prev => ({
        ...prev,
        locadorNome: initialData.locadorNome || prev.locadorNome,
        locadorDoc: initialData.locadorDoc || prev.locadorDoc,
        locadorEndereco: initialData.locadorEndereco || prev.locadorEndereco,
        locadorCidade: initialData.locadorCidade || prev.locadorCidade,
        locadorUF: initialData.locadorUF || prev.locadorUF,
        locatarioNome: initialData.locatarioNome || prev.locatarioNome,
        locatarioDoc: initialData.locatarioDoc || prev.locatarioDoc,
        locatarioEndereco: initialData.locatarioEndereco || prev.locatarioEndereco,
        locatarioCidade: initialData.locatarioCidade || prev.locatarioCidade,
        locatarioUF: initialData.locatarioUF || prev.locatarioUF,
        equipamentoNome: initialData.equipamentoNome || prev.equipamentoNome,
        equipamentoSerial: initialData.equipamentoSerial || prev.equipamentoSerial,
        equipamentoDescricao: initialData.equipamentoSpecs || prev.equipamentoDescricao,
        enderecoUso: initialData.enderecoEntrega ?
          `${initialData.enderecoEntrega}, ${initialData.enderecoEntregaCidade} - ${initialData.enderecoEntregaUF}, ${initialData.enderecoEntregaCEP}` :
          prev.enderecoUso,
        valorDiaria: initialData.valorDiaria ? initialData.valorDiaria.replace(/[^\d,]/g, '').replace(',', '.') : prev.valorDiaria,
        valorTotal: initialData.valorTotal ? initialData.valorTotal.replace(/[^\d,]/g, '').replace(',', '.') : prev.valorTotal,
        prazoLocacao: initialData.quantidadeDias || prev.prazoLocacao,
        dataInicio: initialData.dataInicio ? convertDateFormat(initialData.dataInicio) : prev.dataInicio,
        dataFim: initialData.dataFim ? convertDateFormat(initialData.dataFim) : prev.dataFim,
        formaPagamento: initialData.formaPagamento || prev.formaPagamento,
        caucao: initialData.caucao || prev.caucao,
        multa: initialData.multaRescisoria ? initialData.multaRescisoria.replace(/[^\d]/g, '') : prev.multa
      }))
    }
  }, [initialData, mode])

  const [expandedSections, setExpandedSections] = useState({
    locador: true,
    locatario: true,
    equipamento: true,
    financeiro: true,
    termos: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateField = (field: keyof ContractData, value: string) => {
    setContractData(prev => ({ ...prev, [field]: value }))
  }

  const handleDownloadPDF = () => {
    try {
      setGenerating(true)
      setError(null)

      // Validação básica
      if (!contractData.locadorNome || !contractData.locatarioNome || !contractData.equipamentoNome) {
        setError('Preencha pelo menos os campos obrigatórios: Nome do Locador, Locatário e Equipamento')
        setGenerating(false)
        return
      }

      // Map ContractData to the structure expected by gerarContratoCompleto
      const dadosParaPDF = {
        contratoId: new Date().getTime().toString(),
        locador: {
          nome: contractData.locadorNome,
          cpfCnpj: contractData.locadorDoc,
          endereco: contractData.locadorEndereco,
          telefone: '',
          email: ''
        },
        locatario: {
          nome: contractData.locatarioNome,
          cpfCnpj: contractData.locatarioDoc,
          endereco: contractData.locatarioEndereco,
          telefone: '',
          email: ''
        },
        equipamento: {
          nome: contractData.equipamentoNome,
          categoria: 'Conforme especificado',
          numeroSerie: contractData.equipamentoSerial,
          especificacoes: contractData.equipamentoDescricao
        },
        valores: {
          valorDiaria: parseFloat(contractData.valorDiaria || '0'),
          quantidadeDias: parseInt(contractData.prazoLocacao || '0'),
          valorFrete: 0,
          valorOperadorDiaria: 0,
          comOperador: false,
          desconto: 0,
          taxaExtra: 0,
          valorTotal: parseFloat(contractData.valorTotal || '0')
        },
        dataInicio: contractData.dataInicio,
        dataFim: contractData.dataFim,
        dataContrato: new Date().toISOString(),
        enderecoEntrega: {
          logradouro: contractData.enderecoUso,
          cidade: contractData.locatarioCidade,
          uf: contractData.locatarioUF,
          cep: ''
        }
      }

      gerarContratoCompleto(dadosParaPDF)
      setGenerating(false)
    } catch (error) {
      setError('Erro ao gerar PDF. Verifique os dados e tente novamente.')
      setGenerating(false)
    }
  }

  const isComplete = () => {
    return (
      contractData.locadorNome &&
      contractData.locatarioNome &&
      contractData.equipamentoNome &&
      contractData.valorTotal &&
      contractData.dataInicio &&
      contractData.dataFim
    )
  }

  const getCompletionPercentage = () => {
    const requiredFields = [
      contractData.locadorNome,
      contractData.locadorDoc,
      contractData.locatarioNome,
      contractData.locatarioDoc,
      contractData.equipamentoNome,
      contractData.valorDiaria,
      contractData.valorTotal,
      contractData.prazoLocacao,
      contractData.dataInicio,
      contractData.dataFim
    ]
    const filledFields = requiredFields.filter(field => field && field.trim() !== '').length
    return Math.round((filledFields / requiredFields.length) * 100)
  }

  const isFieldPreFilled = (fieldName: keyof ContractData): boolean => {
    if (mode !== 'context-aware' || !initialData) return false

    const mapping: Record<string, keyof DadosContratoCompleto> = {
      locadorNome: 'locadorNome',
      locadorDoc: 'locadorDoc',
      locadorEndereco: 'locadorEndereco',
      locadorCidade: 'locadorCidade',
      locadorUF: 'locadorUF',
      locatarioNome: 'locatarioNome',
      locatarioDoc: 'locatarioDoc',
      locatarioEndereco: 'locatarioEndereco',
      locatarioCidade: 'locatarioCidade',
      locatarioUF: 'locatarioUF',
      equipamentoNome: 'equipamentoNome',
      equipamentoSerial: 'equipamentoSerial',
      valorDiaria: 'valorDiaria',
      valorTotal: 'valorTotal',
      prazoLocacao: 'quantidadeDias',
      dataInicio: 'dataInicio',
      dataFim: 'dataFim'
    }

    const initialKey = mapping[fieldName]
    return initialKey ? !!initialData[initialKey] : false
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      {/* Status do Contrato */}
      <div className={`p-5 rounded-2xl border-2 mb-6 ${
        isComplete()
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isComplete() ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            )}
            <div>
              <p className={`font-bold ${isComplete() ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                {isComplete() ? 'Contrato Completo' : 'Preencha os campos obrigatórios'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isComplete() ? 'Pronto para gerar o PDF' : 'Preencha os dados para gerar o contrato'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${isComplete() ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {getCompletionPercentage()}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">completo</div>
          </div>
        </div>
        {mode === 'context-aware' && (
          <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Campos pré-preenchidos com dados do contexto</span>
          </div>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Formulário */}
      <div className="space-y-4 mb-6">
        {/* Seção Locador */}
        <FormSection
          title="Dados do Locador"
          icon={<Building2 className="w-4 h-4" />}
          expanded={expandedSections.locador}
          onToggle={() => toggleSection('locador')}
        >
          <InputField
            label="Nome/Razão Social *"
            value={contractData.locadorNome}
            onChange={(v) => updateField('locadorNome', v)}
            placeholder="Nome completo ou razão social"
            preFilled={isFieldPreFilled('locadorNome')}
            maxLength={MAX_LENGTHS.nome}
          />
          <InputField
            label="CPF/CNPJ *"
            value={contractData.locadorDoc}
            onChange={(v) => updateField('locadorDoc', v)}
            placeholder="000.000.000-00"
            preFilled={isFieldPreFilled('locadorDoc')}
            maxLength={MAX_LENGTHS.documento}
          />
          <InputField
            label="Endereço"
            value={contractData.locadorEndereco}
            onChange={(v) => updateField('locadorEndereco', v)}
            placeholder="Rua, número, bairro"
            preFilled={isFieldPreFilled('locadorEndereco')}
            maxLength={MAX_LENGTHS.endereco}
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <InputField
                label="Cidade"
                value={contractData.locadorCidade}
                onChange={(v) => updateField('locadorCidade', v)}
                placeholder="Cidade"
                preFilled={isFieldPreFilled('locadorCidade')}
                maxLength={MAX_LENGTHS.cidade}
              />
            </div>
            <InputField
              label="UF"
              value={contractData.locadorUF}
              onChange={(v) => updateField('locadorUF', v.toUpperCase())}
              placeholder="SP"
              preFilled={isFieldPreFilled('locadorUF')}
              maxLength={MAX_LENGTHS.uf}
            />
          </div>
        </FormSection>

        {/* Seção Locatário */}
        <FormSection
          title="Dados do Locatário"
          icon={<User className="w-4 h-4" />}
          expanded={expandedSections.locatario}
          onToggle={() => toggleSection('locatario')}
        >
          <InputField
            label="Nome/Razão Social *"
            value={contractData.locatarioNome}
            onChange={(v) => updateField('locatarioNome', v)}
            placeholder="Nome do cliente"
            preFilled={isFieldPreFilled('locatarioNome')}
            maxLength={MAX_LENGTHS.nome}
          />
          <InputField
            label="CPF/CNPJ"
            value={contractData.locatarioDoc}
            onChange={(v) => updateField('locatarioDoc', v)}
            placeholder="000.000.000-00"
            preFilled={isFieldPreFilled('locatarioDoc')}
            maxLength={MAX_LENGTHS.documento}
          />
          <InputField
            label="Endereço"
            value={contractData.locatarioEndereco}
            onChange={(v) => updateField('locatarioEndereco', v)}
            placeholder="Rua, número, bairro"
            preFilled={isFieldPreFilled('locatarioEndereco')}
            maxLength={MAX_LENGTHS.endereco}
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <InputField
                label="Cidade"
                value={contractData.locatarioCidade}
                onChange={(v) => updateField('locatarioCidade', v)}
                placeholder="Cidade"
                preFilled={isFieldPreFilled('locatarioCidade')}
                maxLength={MAX_LENGTHS.cidade}
              />
            </div>
            <InputField
              label="UF"
              value={contractData.locatarioUF}
              onChange={(v) => updateField('locatarioUF', v.toUpperCase())}
              placeholder="SP"
              preFilled={isFieldPreFilled('locatarioUF')}
              maxLength={MAX_LENGTHS.uf}
            />
          </div>
        </FormSection>

        {/* Seção Equipamento */}
        <FormSection
          title="Dados do Equipamento"
          icon={<Package className="w-4 h-4" />}
          expanded={expandedSections.equipamento}
          onToggle={() => toggleSection('equipamento')}
        >
          <InputField
            label="Nome do Equipamento *"
            value={contractData.equipamentoNome}
            onChange={(v) => updateField('equipamentoNome', v)}
            placeholder="Ex: Retroescavadeira CAT 416"
            preFilled={isFieldPreFilled('equipamentoNome')}
            maxLength={MAX_LENGTHS.equipamento}
          />
          <InputField
            label="Número de Série"
            icon={<Hash className="w-4 h-4" />}
            value={contractData.equipamentoSerial}
            onChange={(v) => updateField('equipamentoSerial', v)}
            placeholder="Identificação única"
            preFilled={isFieldPreFilled('equipamentoSerial')}
            maxLength={MAX_LENGTHS.serial}
          />
          <TextAreaField
            label="Descrição"
            value={contractData.equipamentoDescricao}
            onChange={(v) => updateField('equipamentoDescricao', v)}
            placeholder="Características do equipamento"
            maxLength={MAX_LENGTHS.descricao}
          />
          <InputField
            label="Endereço de Uso/Entrega"
            icon={<MapPin className="w-4 h-4" />}
            value={contractData.enderecoUso}
            onChange={(v) => updateField('enderecoUso', v)}
            placeholder="Local onde será utilizado"
            maxLength={MAX_LENGTHS.endereco}
          />
        </FormSection>

        {/* Seção Financeiro */}
        <FormSection
          title="Valores e Prazos"
          icon={<DollarSign className="w-4 h-4" />}
          expanded={expandedSections.financeiro}
          onToggle={() => toggleSection('financeiro')}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Valor da Diária (R$)"
              value={contractData.valorDiaria}
              onChange={(v) => updateField('valorDiaria', v)}
              placeholder="150.00"
              type="number"
              preFilled={isFieldPreFilled('valorDiaria')}
              maxLength={MAX_LENGTHS.valor}
            />
            <InputField
              label="Prazo (dias) *"
              value={contractData.prazoLocacao}
              onChange={(v) => updateField('prazoLocacao', v)}
              placeholder="30"
              type="number"
              preFilled={isFieldPreFilled('prazoLocacao')}
              maxLength={MAX_LENGTHS.dias}
            />
          </div>
          <InputField
            label="Valor Total (R$) *"
            value={contractData.valorTotal}
            onChange={(v) => updateField('valorTotal', v)}
            placeholder="4500.00"
            type="number"
            preFilled={isFieldPreFilled('valorTotal')}
            maxLength={MAX_LENGTHS.valor}
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Data Início *"
              value={contractData.dataInicio}
              onChange={(v) => updateField('dataInicio', v)}
              type="date"
              preFilled={isFieldPreFilled('dataInicio')}
            />
            <InputField
              label="Data Fim *"
              value={contractData.dataFim}
              onChange={(v) => updateField('dataFim', v)}
              type="date"
              preFilled={isFieldPreFilled('dataFim')}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Forma de Pagamento</label>
            <select
              value={contractData.formaPagamento}
              onChange={(e) => updateField('formaPagamento', e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="PIX">PIX</option>
              <option value="Transferência Bancária">Transferência Bancária</option>
              <option value="Boleto">Boleto</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>
        </FormSection>

        {/* Seção Termos */}
        <FormSection
          title="Termos Adicionais"
          icon={<FileText className="w-4 h-4" />}
          expanded={expandedSections.termos}
          onToggle={() => toggleSection('termos')}
        >
          <InputField
            label="Caução (R$)"
            value={contractData.caucao}
            onChange={(v) => updateField('caucao', v)}
            placeholder="Opcional"
            type="number"
            maxLength={MAX_LENGTHS.valor}
          />
          <InputField
            label="Multa Rescisória (%)"
            value={contractData.multa}
            onChange={(v) => updateField('multa', v)}
            placeholder="10"
            type="number"
            maxLength={3}
          />
        </FormSection>
      </div>

      {/* Botão de Gerar */}
      <button
        onClick={handleDownloadPDF}
        disabled={generating || !isComplete()}
        className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Gerar e Baixar Contrato (PDF)
          </>
        )}
      </button>

      {!isComplete() && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
          Complete os campos obrigatórios (*) para gerar o contrato
        </p>
      )}
    </div>
  )
}

// Componentes auxiliares
function FormSection({
  title,
  icon,
  expanded,
  onToggle,
  children
}: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {expanded && (
        <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  icon,
  preFilled = false,
  maxLength
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  icon?: React.ReactNode
  preFilled?: boolean
  maxLength?: number
}) {
  return (
    <div>
      {label && (
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {label}
            {preFilled && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold rounded uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                Auto
              </span>
            )}
          </span>
          {maxLength && value.length > 0 && (
            <span className={`text-[10px] ${value.length >= maxLength ? 'text-red-500' : 'text-slate-400'}`}>
              {value.length}/{maxLength}
            </span>
          )}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-800 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all ${
            preFilled
              ? 'border-indigo-300 dark:border-indigo-700 focus:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
              : 'border-gray-200 dark:border-neutral-700 focus:border-indigo-500'
          } ${icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder = '',
  maxLength
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
}) {
  return (
    <div>
      {label && (
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
          <span>{label}</span>
          {maxLength && value.length > 0 && (
            <span className={`text-[10px] ${value.length >= maxLength ? 'text-red-500' : 'text-slate-400'}`}>
              {value.length}/{maxLength}
            </span>
          )}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
      />
    </div>
  )
}

// Helper function to convert date from DD/MM/YYYY to YYYY-MM-DD
function convertDateFormat(dateStr: string): string {
  if (!dateStr) return ''

  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Convert from DD/MM/YYYY to YYYY-MM-DD
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return dateStr
}
