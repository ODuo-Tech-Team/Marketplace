import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp, CATEGORIAS, ESTADOS_BR, CATEGORIA_CORES, type Equipamento, type NovoEquipamento, type EntregaPendente, isEquipamentoDisponivel } from '../contexts/AppContext'
import { HardHat, Plus, X, Loader2, Package, MapPin, BadgeCheck, Truck, Copy, Check, User, ImagePlus, Trash2, RotateCcw, Pencil } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ReviewStars from '../components/ReviewStars'

// Interface para equipamento em uso (com dados da proposta/cliente)
interface EquipamentoEmUso {
  equipamento: Equipamento
  proposta_id: string
  cliente_nome: string
  data_entrega?: string
}

function NovoEquipamentoModal({
  isOpen,
  onClose,
  onSubmit,
  onUploadImagens,
  loading,
  equipamentoInicial
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dados: NovoEquipamento) => Promise<void>
  onUploadImagens: (files: File[]) => Promise<{ urls: string[]; error?: string }>
  loading: boolean
  equipamentoInicial?: Equipamento | null
}) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [precoDiaria, setPrecoDiaria] = useState('')
  const [categoria, setCategoria] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [especificacoes, setEspecificacoes] = useState('')

  // Estados para fotos
  const [fotosPreview, setFotosPreview] = useState<string[]>([])
  const [fotosFiles, setFotosFiles] = useState<File[]>([])
  const [uploadingFotos, setUploadingFotos] = useState(false)
  const [fotosError, setFotosError] = useState<string | null>(null)
  const [fotosSuccess, setFotosSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preenche formulário quando está editando
  useEffect(() => {
    if (equipamentoInicial && isOpen) {
      setNome(equipamentoInicial.nome || '')
      setDescricao(equipamentoInicial.descricao || '')
      setPrecoDiaria(equipamentoInicial.preco_diaria?.toString() || '')
      setCategoria(equipamentoInicial.categoria || '')
      setCidade(equipamentoInicial.cidade || '')
      setUf(equipamentoInicial.uf || '')
      setEspecificacoes('')
      // Mostra fotos existentes
      if (equipamentoInicial.fotos && equipamentoInicial.fotos.length > 0) {
        setFotosPreview(equipamentoInicial.fotos)
      }
    } else if (isOpen) {
      resetForm()
    }
  }, [equipamentoInicial, isOpen])

  const resetForm = () => {
    setNome('')
    setDescricao('')
    setPrecoDiaria('')
    setCategoria('')
    setCidade('')
    setUf('')
    setEspecificacoes('')
    setFotosPreview([])
    setFotosFiles([])
    setFotosError(null)
    setFotosSuccess(false)
  }

  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limita a 5 fotos
    const novosFiles = [...fotosFiles, ...files].slice(0, 5)
    setFotosFiles(novosFiles)

    // Gera previews
    const novosPreviews: string[] = []
    novosFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        novosPreviews.push(e.target?.result as string)
        if (novosPreviews.length === novosFiles.length) {
          setFotosPreview(novosPreviews)
        }
      }
      reader.readAsDataURL(file)
    })

    setFotosError(null)
    setFotosSuccess(false)
  }

  const removerFoto = (index: number) => {
    setFotosFiles(prev => prev.filter((_, i) => i !== index))
    setFotosPreview(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFotosError(null)

    let fotosUrls: string[] = []

    // Separa fotos existentes (base64 ou URLs) das novas (File)
    const fotosExistentes = fotosPreview.filter(url => typeof url === 'string' && (url.startsWith('data:') || url.startsWith('http')))

    // Se tem fotos novas, faz upload primeiro
    if (fotosFiles.length > 0) {
      setUploadingFotos(true)
      const result = await onUploadImagens(fotosFiles)
      setUploadingFotos(false)

      if (result.error) {
        setFotosError(result.error)
        return
      }

      fotosUrls = result.urls
      setFotosSuccess(true)
    }

    // Mescla fotos existentes com novas
    const todasFotos = [...fotosExistentes, ...fotosUrls]

    await onSubmit({
      nome,
      descricao: descricao || undefined,
      preco_diaria: parseFloat(precoDiaria),
      categoria,
      cidade,
      uf,
      fotos: todasFotos.length > 0 ? todasFotos : undefined
    })
    resetForm()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Anunciar Equipamento</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Upload de Fotos - UX 35+ */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              Fotos do Equipamento
            </label>

            {/* Área de upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotosChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-amber-100 rounded-full">
                  <ImagePlus className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-base font-medium text-gray-700">
                  Toque para adicionar fotos
                </p>
                <p className="text-sm text-gray-500">
                  Máximo 5 fotos (JPG, PNG)
                </p>
              </div>
            </div>

            {/* Preview das fotos */}
            {fotosPreview.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {fotosPreview.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={preview}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removerFoto(index)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-amber-600 text-white text-xs font-medium rounded">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Feedback de upload */}
            {uploadingFotos && (
              <div className="mt-2 flex items-center gap-2 text-amber-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Enviando fotos...</span>
              </div>
            )}
            {fotosSuccess && (
              <div className="mt-2 flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Fotos enviadas com sucesso!</span>
              </div>
            )}
            {fotosError && (
              <div className="mt-2 text-red-600 text-sm">
                {fotosError}
              </div>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Nome do Equipamento *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="Ex: Betoneira 400L"
              required
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              required
            >
              <option value="">Selecione uma categoria</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Preço por Diária (R$) *
            </label>
            <input
              type="number"
              value={precoDiaria}
              onChange={(e) => setPrecoDiaria(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="150.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Localização - Cidade e UF lado a lado */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-base font-semibold text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="Ex: São Paulo"
                required
              />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-1">
                UF *
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                required
              >
                <option value="">UF</option>
                {ESTADOS_BR.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              placeholder="Descreva o equipamento, condições, acessórios inclusos..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Especificações Técnicas
            </label>
            <textarea
              value={especificacoes}
              onChange={(e) => setEspecificacoes(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              placeholder="Ex: Voltagem: 220V, Peso: 85kg, Capacidade: 400L, Motor: 2HP"
              rows={2}
            />
            <p className="text-sm text-gray-500 mt-1">
              Informe voltagem, peso, capacidade, potência, etc.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingFotos}
            className="w-full py-4 bg-amber-600 text-white text-lg font-bold rounded-xl hover:bg-amber-700 focus:ring-4 focus:ring-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(loading || uploadingFotos) && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{loading ? 'Cadastrando...' : uploadingFotos ? 'Enviando fotos...' : 'Anunciar Equipamento'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

// Card de entrega pendente - UX otimizada para 35+
function EntregaCard({
  entrega,
  onConfirmarEntrega,
  confirmando
}: {
  entrega: EntregaPendente
  onConfirmarEntrega: (propostaId: string, equipamentoId: string) => Promise<void>
  confirmando: boolean
}) {
  const [copiado, setCopiado] = useState(false)

  // ESTRUTURA REAL DO BANCO:
  // - endereco_logradouro: contém endereço completo (rua, número, bairro)
  // - endereco_cep, endereco_cidade, endereco_uf
  // NÃO TEM: endereco_numero, endereco_bairro, endereco_complemento, valor_total, quantidade_dias

  // Monta endereço completo para cópia
  const enderecoCompleto = `${entrega.endereco_logradouro || ''}
${entrega.endereco_cidade || ''} - ${entrega.endereco_uf || ''}
CEP: ${entrega.endereco_cep || ''}`

  const copiarEndereco = async () => {
    try {
      await navigator.clipboard.writeText(enderecoCompleto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const temEndereco = entrega.endereco_logradouro

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 border-l-4 border-amber-500">
      {/* Cabeçalho com nome da máquina */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-bold text-gray-800">
              {entrega.equipamento_nome}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-5 h-5 text-slate-500" />
            <span className="text-lg font-medium">{entrega.cliente_nome}</span>
          </div>
        </div>
      </div>

      {/* Endereço de Entrega - Fonte grande para 35+ */}
      {temEndereco ? (
        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-6 h-6 text-slate-600" />
            <span className="font-bold text-slate-700 text-lg">Endereço de Entrega</span>
          </div>
          <div className="space-y-1 text-base">
            <p className="font-semibold text-gray-800 text-lg">
              {entrega.endereco_logradouro}
            </p>
            <p className="font-medium text-gray-800 text-base">
              {entrega.endereco_cidade} - {entrega.endereco_uf}
            </p>
            {entrega.endereco_cep && (
              <p className="text-gray-600">CEP: {entrega.endereco_cep}</p>
            )}
          </div>

          {/* Botão Copiar Endereço */}
          <button
            onClick={copiarEndereco}
            className={`mt-4 w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              copiado
                ? 'bg-green-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
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
      ) : (
        <div className="bg-yellow-50 rounded-xl p-5 mb-4 border-2 border-yellow-300">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="text-yellow-800 text-lg font-bold">
                Aguardando endereço do cliente
              </p>
              <p className="text-yellow-700 text-base mt-1">
                O cliente ainda não informou o endereço de entrega.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botão Confirmar Entrega - Grande e verde */}
      <button
        onClick={() => onConfirmarEntrega(entrega.proposta_id, entrega.equipamento_id)}
        disabled={confirmando}
        className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {confirmando ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Confirmando...</span>
          </>
        ) : (
          <>
            <Check className="w-6 h-6" />
            <span>Confirmar Entrega</span>
          </>
        )}
      </button>
    </div>
  )
}

// Card para equipamento em uso com botão de retorno - UX 35+
function EquipamentoEmUsoCard({
  item,
  onConfirmarRetorno,
  confirmando
}: {
  item: EquipamentoEmUso
  onConfirmarRetorno: (propostaId: string, equipamentoId: string) => Promise<void>
  confirmando: boolean
}) {
  const { equipamento, cliente_nome, data_entrega } = item

  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(equipamento.preco_diaria)

  // Prioriza fotos[0] sobre imagem_url
  const imagemExibir = (equipamento.fotos && equipamento.fotos.length > 0)
    ? equipamento.fotos[0]
    : null

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-blue-500">
      <div className="flex gap-4 p-5">
        {/* Imagem do equipamento */}
        <div className="w-28 h-28 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
          {imagemExibir ? (
            <img
              src={imagemExibir}
              alt={equipamento.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-800 truncate">
              {equipamento.nome}
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full whitespace-nowrap">
              EM USO
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <User className="w-5 h-5 text-blue-500" />
            <span className="text-base font-medium">Cliente: {cliente_nome}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-amber-600 font-bold text-lg">
              {precoFormatado}/dia
            </span>
            {data_entrega && (
              <span className="text-gray-500 text-sm">
                Entregue em: {new Date(data_entrega).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botão Confirmar Devolução - Azul destacado */}
      <div className="px-5 pb-5">
        <button
          onClick={() => onConfirmarRetorno(item.proposta_id, equipamento.id)}
          disabled={confirmando}
          className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {confirmando ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Confirmando...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-6 h-6" />
              <span>Confirmar Devolução/Retorno</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function EquipamentoCard({
  equipamento,
  onEdit,
  onDelete
}: {
  equipamento: Equipamento
  onEdit?: (equipamento: Equipamento) => void
  onDelete?: (equipamentoId: string) => void
}) {
  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(equipamento.preco_diaria)

  const isDisponivel = isEquipamentoDisponivel(equipamento)
  const isLocado = equipamento.status === 'LOCADO' || equipamento.status === 'locado'

  // Prioriza fotos[0] sobre imagem_url
  const imagemExibir = (equipamento.fotos && equipamento.fotos.length > 0)
    ? equipamento.fotos[0]
    : null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 relative">
        {imagemExibir ? (
          <img
            src={imagemExibir}
            alt={equipamento.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {equipamento.categoria && (
            <span className={`px-2 py-1 ${CATEGORIA_CORES[equipamento.categoria] || 'bg-gray-600'} text-white text-xs font-medium rounded-full w-fit`}>
              {equipamento.categoria}
            </span>
          )}
          {/* Badge de status: LOCADO tem destaque especial */}
          {isLocado ? (
            <span className="px-3 py-1.5 text-sm font-bold rounded-full bg-orange-600 text-white shadow-lg">
              LOCADO
            </span>
          ) : (
            <span
              className={`px-3 py-1.5 text-sm font-bold rounded-full uppercase ${
                isDisponivel
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-600 text-white'
              }`}
            >
              {isDisponivel ? 'Disponível' : 'Indisponível'}
            </span>
          )}
        </div>

        {/* Botões de Editar e Deletar */}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(equipamento)
              }}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
              title="Editar equipamento"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Deseja realmente deletar este equipamento?')) {
                  onDelete(equipamento.id)
                }
              }}
              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              title="Deletar equipamento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Preço em destaque estilo OLX */}
        <div className="mb-2">
          <span className="text-amber-600 font-bold text-2xl">
            {precoFormatado}
          </span>
          <span className="text-gray-500 text-sm font-medium">/dia</span>
        </div>

        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800 text-base line-clamp-2">
            {equipamento.nome}
          </h3>
          {false && (
            <span title="Locador Verificado">
              <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
            </span>
          )}
        </div>

        {/* Localização em destaque */}
        {(equipamento.cidade || equipamento.uf) && (
          <div className="flex items-center gap-1 text-gray-600 text-sm mb-2 bg-gray-50 px-2 py-1 rounded-md w-fit">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span className="font-medium">
              {equipamento.cidade}{equipamento.cidade && equipamento.uf ? ', ' : ''}{equipamento.uf}
            </span>
          </div>
        )}

        {/* Avaliações */}
        <div className="mb-2">
          <ReviewStars
            rating={0 || 0}
            totalReviews={0 || 0}
            size="sm"
          />
        </div>

        {equipamento.descricao && (
          <p className="text-gray-500 text-sm mb-2 line-clamp-2">
            {equipamento.descricao}
          </p>
        )}

        {equipamento.descricao && (
          <p className="text-gray-400 text-xs line-clamp-1 italic">
            {equipamento.descricao}
          </p>
        )}

        {/* Mostra nome do cliente quando equipamento está LOCADO */}
        {isLocado && equipamento.locado_para && (
          <div className="mt-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-xl">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-orange-600 font-semibold uppercase">Locado para</p>
                <p className="text-sm font-bold text-gray-800">{equipamento.locado_para}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MeusEquipamentos() {
  const { user, profile, signOut } = useAuth()
  const { addEquipamento, fetchMeusEquipamentos, fetchEntregasPendentes, marcarComoEntregue, confirmarRetorno, uploadImagens, deletarEquipamento, atualizarEquipamento } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estados principais
  const [activeTab, setActiveTab] = useState<'equipamentos' | 'entregas'>('equipamentos')
  const [meusEquipamentos, setMeusEquipamentos] = useState<Equipamento[]>([])
  const [entregasPendentes, setEntregasPendentes] = useState<EntregaPendente[]>([])
  const [equipamentosEmUso, setEquipamentosEmUso] = useState<EquipamentoEmUso[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEntregas, setLoadingEntregas] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [equipamentoEditando, setEquipamentoEditando] = useState<Equipamento | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmandoEntrega, setConfirmandoEntrega] = useState(false)
  const [confirmandoRetorno, setConfirmandoRetorno] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const mountedRef = useRef(true)

  // Abre modal automaticamente se vier do cadastro de locador (?novo=1)
  // Ou abre aba de entregas se vier com ?tab=entregas
  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      setModalOpen(true)
      // Remove o parâmetro da URL para não reabrir em refresh
      setSearchParams({})
    }
    if (searchParams.get('tab') === 'entregas') {
      setActiveTab('entregas')
      // Remove o parâmetro da URL
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const carregarMeusEquipamentos = async () => {
    if (!user || !mountedRef.current) return
    setLoading(true)
    try {
      const dados = await fetchMeusEquipamentos(user.id)
      if (mountedRef.current) {
        setMeusEquipamentos(dados)
        setLoading(false)
      }
    } catch (err) {
      console.error('[MeusEquipamentos] Erro ao carregar:', err)
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const carregarEntregasPendentes = async () => {
    if (!user || !mountedRef.current) return
    setLoadingEntregas(true)
    try {
      const dados = await fetchEntregasPendentes(user.id)
      if (mountedRef.current) {
        setEntregasPendentes(dados)
        setLoadingEntregas(false)
      }
    } catch (err) {
      console.error('[MeusEquipamentos] Erro ao carregar entregas:', err)
      if (mountedRef.current) {
        setLoadingEntregas(false)
      }
    }
  }

  // Identifica equipamentos em uso (status_locacao === 'EM_USO' ou 'LOCADO')
  // e busca dados do cliente da proposta entregue
  const identificarEquipamentosEmUso = async () => {
    if (!user || !mountedRef.current) return

    try {
      // Filtra equipamentos com status OCUPADO
      const emUso = meusEquipamentos.filter(eq =>
        eq.status === 'OCUPADO' || eq.status === 'ocupado'
      )

      if (emUso.length === 0) {
        setEquipamentosEmUso([])
        return
      }

      // Para cada equipamento em uso, busca a proposta entregue correspondente
      const { supabase } = await import('../lib/supabase')

      // Busca chats dos equipamentos em uso
      const { data: chats } = await supabase
        .from('chats')
        .select('id, equipamento_id, locatario_id')
        .eq('locador_id', user.id)
        .in('equipamento_id', emUso.map(eq => eq.id))

      if (!chats || chats.length === 0) {
        // Fallback: retorna sem dados do cliente
        setEquipamentosEmUso(emUso.map(eq => ({
          equipamento: eq,
          proposta_id: '',
          cliente_nome: 'Cliente'
        })))
        return
      }

      const chatIds = chats.map(c => c.id)

      // Busca propostas entregues (status_entrega = 'ENTREGUE')
      const { data: propostas } = await supabase
        .from('propostas')
        .select('id, chat_id, created_at, status_entrega')
        .in('chat_id', chatIds)
        .eq('status', 'aceita')
        .eq('status_entrega', 'ENTREGUE')

      // Busca clientes
      const clienteIds = [...new Set(chats.map(c => c.locatario_id))]
      const { data: clientes } = await supabase
        .from('profiles')
        .select('id, full_name, nome_empresa, razao_social, email')
        .in('id', clienteIds)

      const clientesMap = new Map((clientes || []).map(c => [
        c.id,
        c.nome_empresa || c.razao_social || c.full_name || c.email || 'Cliente'
      ]))

      // Monta lista de equipamentos em uso com dados
      const lista: EquipamentoEmUso[] = emUso.map(eq => {
        const chat = chats.find(c => c.equipamento_id === eq.id)
        const proposta = propostas?.find(p => p.chat_id === chat?.id)
        return {
          equipamento: eq,
          proposta_id: proposta?.id || '',
          cliente_nome: chat ? (clientesMap.get(chat.locatario_id) || 'Cliente') : 'Cliente',
          data_entrega: proposta?.created_at
        }
      })

      if (mountedRef.current) {
        setEquipamentosEmUso(lista)
      }
    } catch (err) {
      console.error('[MeusEquipamentos] Erro ao identificar equipamentos em uso:', err)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    carregarMeusEquipamentos()
    carregarEntregasPendentes()

    return () => {
      mountedRef.current = false
    }
  }, [user])

  // Identifica equipamentos em uso quando a lista de equipamentos muda
  useEffect(() => {
    if (meusEquipamentos.length > 0) {
      identificarEquipamentosEmUso()
    }
  }, [meusEquipamentos])

  // Recarrega entregas quando troca para a aba
  useEffect(() => {
    if (activeTab === 'entregas' && user) {
      carregarEntregasPendentes()
    }
  }, [activeTab])

  const handleAddEquipamento = async (dados: NovoEquipamento) => {
    if (!user || !mountedRef.current) return

    setSubmitting(true)
    setError(null)

    try {
      // Se está editando, atualiza. Senão, cria novo
      const result = equipamentoEditando
        ? await atualizarEquipamento(equipamentoEditando.id, dados, user.id)
        : await addEquipamento(dados, user.id)

      if (!mountedRef.current) return

      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 150))
        if (!mountedRef.current) return

        setSubmitting(false)
        setModalOpen(false)
        setEquipamentoEditando(null)
        await carregarMeusEquipamentos()

        // Mensagem de sucesso
        const mensagem = equipamentoEditando ? 'Equipamento atualizado com sucesso!' : 'Equipamento cadastrado com sucesso!'
        setSuccessMessage(mensagem)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const mensagem = equipamentoEditando ? 'Erro ao atualizar equipamento' : 'Erro ao cadastrar equipamento'
        setError(result.error || mensagem)
        setSubmitting(false)
      }
    } catch (err) {
      console.error('[MeusEquipamentos] Erro ao adicionar:', err)
      if (mountedRef.current) {
        const mensagem = equipamentoEditando ? 'Erro inesperado ao atualizar equipamento' : 'Erro inesperado ao cadastrar equipamento'
        setError(mensagem)
        setSubmitting(false)
      }
    }
  }

  // Handler para editar equipamento
  const handleEdit = (equipamento: Equipamento) => {
    setEquipamentoEditando(equipamento)
    setModalOpen(true)
  }

  // Handler para deletar equipamento
  const handleDelete = async (equipamentoId: string) => {
    if (!user) return

    const result = await deletarEquipamento(equipamentoId, user.id)

    if (result.success) {
      // Remove da lista local
      setMeusEquipamentos(prev => prev.filter(eq => eq.id !== equipamentoId))
      setSuccessMessage('Equipamento deletado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } else if (result.error) {
      setError(result.error)
    }
  }

  const handleConfirmarEntrega = async (propostaId: string, equipamentoId: string) => {
    if (!mountedRef.current) return

    setConfirmandoEntrega(true)
    setError(null)

    try {
      const result = await marcarComoEntregue(propostaId, equipamentoId)

      if (!mountedRef.current) return

      if (result.success) {
        // Remove da lista local
        setEntregasPendentes(prev => prev.filter(e => e.proposta_id !== propostaId))
        setSuccessMessage('Entrega confirmada! Status do equipamento atualizado para EM USO.')
        setTimeout(() => setSuccessMessage(null), 4000)
        // Recarrega equipamentos para atualizar status
        await carregarMeusEquipamentos()
      } else {
        setError(result.error || 'Erro ao confirmar entrega')
      }
    } catch (err) {
      console.error('[MeusEquipamentos] Erro ao confirmar entrega:', err)
      if (mountedRef.current) {
        setError('Erro inesperado ao confirmar entrega')
      }
    } finally {
      if (mountedRef.current) {
        setConfirmandoEntrega(false)
      }
    }
  }

  // Handler para confirmar devolução/retorno de equipamento
  const handleConfirmarRetorno = async (propostaId: string, equipamentoId: string) => {
    if (!mountedRef.current) return

    setConfirmandoRetorno(true)
    setError(null)

    try {
      const result = await confirmarRetorno(propostaId, equipamentoId)

      if (!mountedRef.current) return

      if (result.success) {
        // Remove da lista local de equipamentos em uso
        setEquipamentosEmUso(prev => prev.filter(e => e.equipamento.id !== equipamentoId))
        setSuccessMessage('Devolução confirmada! O equipamento está novamente disponível para locação.')
        setTimeout(() => setSuccessMessage(null), 4000)
        // Recarrega equipamentos para atualizar status
        await carregarMeusEquipamentos()
      } else {
        setError(result.error || 'Erro ao confirmar devolução')
      }
    } catch (err) {
      console.error('[MeusEquipamentos] Erro ao confirmar retorno:', err)
      if (mountedRef.current) {
        setError('Erro inesperado ao confirmar devolução')
      }
    } finally {
      if (mountedRef.current) {
        setConfirmandoRetorno(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-zinc-200">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <HardHat className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-600">LocaObra</h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 hidden sm:block font-medium">
              {profile?.nome_empresa || profile?.full_name || user?.email || 'Perfil'}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Cabeçalho com título e botão */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Painel do Locador
            </h2>
            <p className="text-gray-600">
              Gerencie seus equipamentos e entregas
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Anunciar Novo
          </button>
        </div>

        {/* Sistema de Abas */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('equipamentos')}
              className={`flex-1 py-4 px-6 text-center font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'equipamentos'
                  ? 'text-amber-600 border-b-3 border-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Meus Equipamentos</span>
              <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-sm rounded-full">
                {meusEquipamentos.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('entregas')}
              className={`flex-1 py-4 px-6 text-center font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'entregas'
                  ? 'text-amber-600 border-b-3 border-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span>Entregas Pendentes</span>
              {entregasPendentes.length > 0 && (
                <span className="ml-1 px-2.5 py-0.5 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                  {entregasPendentes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mensagens de erro e sucesso */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-base mb-6 flex items-center gap-2">
            <X className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* UX 35+: Toast verde de sucesso - grande e visível */}
        {successMessage && (
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl text-lg font-bold mb-6 flex items-center gap-3 shadow-lg animate-pulse">
            <Check className="w-7 h-7" />
            {successMessage}
          </div>
        )}

        {/* Conteúdo da aba Equipamentos */}
        {activeTab === 'equipamentos' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-16 min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              </div>
            ) : meusEquipamentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
                <Package className="w-20 h-20 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Nenhum equipamento cadastrado
                </h3>
                <p className="text-gray-400 text-center max-w-md mb-6">
                  Você ainda não anunciou nenhum equipamento. Comece agora e alcance profissionais de toda a região!
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Anunciar Primeiro Equipamento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {meusEquipamentos.map((equipamento) => (
                  <EquipamentoCard
                    key={equipamento.id}
                    equipamento={equipamento}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Conteúdo da aba Entregas Pendentes */}
        {activeTab === 'entregas' && (
          <>
            {loadingEntregas ? (
              <div className="flex items-center justify-center py-16 min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Seção: Entregas Pendentes */}
                {entregasPendentes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Truck className="w-6 h-6 text-amber-600" />
                      Entregas Pendentes
                    </h3>
                    <p className="text-gray-600 mb-4 text-base">
                      {entregasPendentes.length} entrega{entregasPendentes.length !== 1 ? 's' : ''} aguardando confirmação
                    </p>
                    {entregasPendentes.map((entrega) => (
                      <EntregaCard
                        key={entrega.proposta_id}
                        entrega={entrega}
                        onConfirmarEntrega={handleConfirmarEntrega}
                        confirmando={confirmandoEntrega}
                      />
                    ))}
                  </div>
                )}

                {/* Seção: Equipamentos em Uso (aguardando devolução) */}
                {equipamentosEmUso.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <RotateCcw className="w-6 h-6 text-blue-600" />
                      Equipamentos em Uso
                    </h3>
                    <p className="text-gray-600 mb-4 text-base">
                      {equipamentosEmUso.length} equipamento{equipamentosEmUso.length !== 1 ? 's' : ''} com cliente - aguardando devolução
                    </p>
                    <div className="space-y-4">
                      {equipamentosEmUso.map((item) => (
                        <EquipamentoEmUsoCard
                          key={item.equipamento.id}
                          item={item}
                          onConfirmarRetorno={handleConfirmarRetorno}
                          confirmando={confirmandoRetorno}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado vazio: nenhuma entrega nem equipamento em uso */}
                {entregasPendentes.length === 0 && equipamentosEmUso.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
                    <Truck className="w-20 h-20 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Nenhuma entrega ou devolução pendente
                    </h3>
                    <p className="text-gray-400 text-center max-w-md">
                      Quando um cliente aceitar uma proposta, a entrega aparecerá aqui. Equipamentos em uso também aparecerão para confirmar devolução.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <NovoEquipamentoModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEquipamentoEditando(null)
        }}
        onSubmit={handleAddEquipamento}
        onUploadImagens={(files) => uploadImagens(files, user?.id || '')}
        loading={submitting}
        equipamentoInicial={equipamentoEditando}
      />
    </div>
  )
}
