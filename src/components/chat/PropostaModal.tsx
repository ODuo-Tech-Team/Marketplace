import React, { useState, useEffect } from 'react'
import { X, Check, Loader2, Package, Edit3, Calendar, Truck, User } from 'lucide-react'
import type { Proposta, Consumivel } from '../../contexts/AppContext'
import { TIPOS_VEICULO_TRANSPORTE } from '../../contexts/AppContext'
import { HorimetroInput } from './HorimetroInput'
import { ConsumiveisSelector } from './ConsumiveisSelector'

interface SelectedConsumivel {
  consumivel_id: string
  quantidade: number
  preco_unitario: number
  nome: string
}

interface PropostaModalProps {
  isOpen: boolean
  onClose: () => void
  onEnviar: (dados: {
    valorDiaria: number
    valorFrete: number
    desconto?: number
    taxaExtra?: number
    dataInicio?: string
    dataFim?: string
    // Linha Amarela
    horimetroSaida?: number
    horimetroSaidaFoto?: string
    comOperador?: boolean
    valorOperadorDiaria?: number
    tipoVeiculoTransporte?: string
    // Consumíveis selecionados
    consumiveisSelecionados?: SelectedConsumivel[]
  }) => Promise<void>
  loading: boolean
  equipamentoNome?: string
  equipamentoPreco?: number
  quantidadeDias?: number
  // Modo edicao
  propostaExistente?: Proposta | null
  onEditar?: (dados: {
    valorDiaria: number
    valorFrete: number
    desconto?: number
    taxaExtra?: number
    dataInicio?: string
    dataFim?: string
    horimetroSaida?: number
    horimetroSaidaFoto?: string
    comOperador?: boolean
    valorOperadorDiaria?: number
    tipoVeiculoTransporte?: string
    consumiveisSelecionados?: SelectedConsumivel[]
  }) => Promise<void>
  // Categoria para campos condicionais
  isLinhaAmarela?: boolean
  // Consumíveis disponíveis (Light Equipment)
  consumiveisDisponiveis?: Consumivel[]
}

function calcularDiasEntreDatas(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0
  const d1 = new Date(inicio)
  const d2 = new Date(fim)
  const diff = d2.getTime() - d1.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function PropostaModal({
  isOpen,
  onClose,
  onEnviar,
  loading,
  equipamentoNome,
  equipamentoPreco,
  quantidadeDias,
  propostaExistente,
  onEditar,
  isLinhaAmarela,
  consumiveisDisponiveis
}: PropostaModalProps) {
  const isEdicao = !!propostaExistente && !!onEditar

  const [valorDiaria, setValorDiaria] = useState('')
  const [valorFrete, setValorFrete] = useState('')
  const [desconto, setDesconto] = useState('')
  const [taxaExtra, setTaxaExtra] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Campos Linha Amarela
  const [horimetroSaida, setHorimetroSaida] = useState('')
  const [horimetroSaidaFoto, setHorimetroSaidaFoto] = useState<string | null>(null)
  const [comOperador, setComOperador] = useState(false)
  const [valorOperadorDiaria, setValorOperadorDiaria] = useState('')
  const [tipoVeiculoTransporte, setTipoVeiculoTransporte] = useState('')

  // Consumíveis (Light)
  const [consumiveisSelecionados, setConsumiveisSelecionados] = useState<SelectedConsumivel[]>([])

  // Pre-fill on open
  useEffect(() => {
    if (!isOpen) return

    if (isEdicao && propostaExistente) {
      setValorDiaria(propostaExistente.valor_diaria?.toString() || '')
      setValorFrete(propostaExistente.valor_frete?.toString() || '0')
      setDesconto(propostaExistente.desconto?.toString() || '')
      setTaxaExtra(propostaExistente.taxa_extra?.toString() || '')
      setDataInicio(propostaExistente.data_inicio || '')
      setDataFim(propostaExistente.data_fim || '')
      // LA fields
      setHorimetroSaida(propostaExistente.horimetro_saida?.toString() || '')
      setHorimetroSaidaFoto(propostaExistente.horimetro_saida_foto || null)
      setComOperador(propostaExistente.com_operador || false)
      setValorOperadorDiaria(propostaExistente.valor_operador_diaria?.toString() || '')
      setTipoVeiculoTransporte(propostaExistente.tipo_veiculo_transporte || '')
    } else {
      if (equipamentoPreco) setValorDiaria(equipamentoPreco.toFixed(2))
      setValorFrete('')
      setDesconto('')
      setTaxaExtra('')
      setDataInicio('')
      setDataFim('')
      setHorimetroSaida('')
      setHorimetroSaidaFoto(null)
      setComOperador(false)
      setValorOperadorDiaria('')
      setTipoVeiculoTransporte('')
      setConsumiveisSelecionados([])
    }
  }, [isOpen, isEdicao, propostaExistente, equipamentoPreco])

  const valorDiariaNum = parseFloat(valorDiaria) || 0
  const valorFreteNum = parseFloat(valorFrete) || 0
  const descontoNum = parseFloat(desconto) || 0
  const taxaExtraNum = parseFloat(taxaExtra) || 0
  const valorOperadorNum = comOperador ? (parseFloat(valorOperadorDiaria) || 0) : 0

  // Calcular dias: usa datas se disponivel, senao usa quantidadeDias do chat
  const diasPorDatas = calcularDiasEntreDatas(dataInicio, dataFim)
  const diasNum = diasPorDatas > 0 ? diasPorDatas : (quantidadeDias || 0)

  const subtotalLocacao = valorDiariaNum * diasNum
  const subtotalOperador = valorOperadorNum * diasNum
  const subtotalConsumiveis = consumiveisSelecionados.reduce((acc, s) => acc + (s.preco_unitario * s.quantidade), 0)
  const valorTotal = subtotalLocacao + subtotalOperador + valorFreteNum - descontoNum + taxaExtraNum + subtotalConsumiveis

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dados = {
      valorDiaria: valorDiariaNum,
      valorFrete: valorFreteNum,
      desconto: descontoNum > 0 ? descontoNum : undefined,
      taxaExtra: taxaExtraNum > 0 ? taxaExtraNum : undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      // LA
      horimetroSaida: horimetroSaida ? parseFloat(horimetroSaida) : undefined,
      horimetroSaidaFoto: horimetroSaidaFoto || undefined,
      comOperador: comOperador || undefined,
      valorOperadorDiaria: valorOperadorNum > 0 ? valorOperadorNum : undefined,
      tipoVeiculoTransporte: tipoVeiculoTransporte || undefined,
      // Consumíveis
      consumiveisSelecionados: consumiveisSelecionados.length > 0 ? consumiveisSelecionados : undefined,
    }

    if (isEdicao && onEditar) {
      await onEditar(dados)
    } else {
      await onEnviar(dados)
    }
    // Reset
    setValorDiaria('')
    setValorFrete('')
    setDesconto('')
    setTaxaExtra('')
    setDataInicio('')
    setDataFim('')
    setHorimetroSaida('')
    setHorimetroSaidaFoto(null)
    setComOperador(false)
    setValorOperadorDiaria('')
    setTipoVeiculoTransporte('')
    setConsumiveisSelecionados([])
  }

  if (!isOpen) return null

  // Data minima = hoje
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            {isEdicao ? (
              <><Edit3 className="w-5 h-5 text-amber-600" /> Editar Proposta</>
            ) : (
              <><Package className="w-5 h-5 text-orange-600" /> Gerar Proposta</>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Equipamento Info */}
          <div className={`p-4 rounded-xl border-2 ${isLinhaAmarela ? 'bg-amber-50 border-amber-300' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-3 mb-1">
              <Package className={`w-6 h-6 ${isLinhaAmarela ? 'text-amber-600' : 'text-orange-600'}`} />
              <span className="font-bold text-gray-800 text-lg">
                {equipamentoNome || 'Equipamento'}
              </span>
            </div>
            {isLinhaAmarela && (
              <span className="inline-block px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full mt-1">PESADO</span>
            )}
            {quantidadeDias && !dataInicio && (
              <p className="text-sm text-gray-600 mt-1">
                Periodo solicitado: <span className="font-bold">{quantidadeDias} dias</span>
              </p>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Periodo de Locacao
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Data Inicio</label>
                <input
                  type="date"
                  value={dataInicio}
                  min={hoje}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio || hoje}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
            {diasPorDatas > 0 && (
              <p className="text-xs text-blue-700 mt-2 font-medium">
                Periodo: {diasPorDatas} dias
              </p>
            )}
          </div>

          {/* === CAMPOS LINHA AMARELA === */}
          {isLinhaAmarela && (
            <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-300 space-y-4">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-1">
                <Truck className="w-4 h-4" /> Campos Linha Amarela
              </p>

              {/* Horímetro de Saída */}
              <HorimetroInput
                value={horimetroSaida}
                foto={horimetroSaidaFoto}
                onChange={setHorimetroSaida}
                onFotoChange={setHorimetroSaidaFoto}
                label="Horímetro de Saída"
              />

              {/* Operador Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={comOperador}
                    onChange={(e) => setComOperador(e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <User className="w-4 h-4 text-amber-600" />
                    Incluir Operador
                  </span>
                </label>
                {comOperador && (
                  <div className="mt-2 ml-8">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor Operador/Dia (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorOperadorDiaria}
                      onChange={(e) => setValorOperadorDiaria(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="200.00"
                    />
                    {valorOperadorNum > 0 && diasNum > 0 && (
                      <p className="text-xs text-amber-700 mt-1">
                        Subtotal operador: R$ {subtotalOperador.toFixed(2)} ({diasNum}d)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Tipo de Veículo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Truck className="w-4 h-4 text-amber-600" /> Tipo de Veículo para Transporte
                </label>
                <select
                  value={tipoVeiculoTransporte}
                  onChange={(e) => setTipoVeiculoTransporte(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="">Selecione...</option>
                  {TIPOS_VEICULO_TRANSPORTE.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* === CONSUMÍVEIS (Light Equipment) === */}
          {!isLinhaAmarela && consumiveisDisponiveis && consumiveisDisponiveis.length > 0 && (
            <ConsumiveisSelector
              consumiveis={consumiveisDisponiveis}
              selected={consumiveisSelecionados}
              onChange={setConsumiveisSelecionados}
            />
          )}

          {/* Valor Diaria */}
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">
              Valor da Diaria (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorDiaria}
              onChange={(e) => setValorDiaria(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="150.00"
              required
            />
            {diasNum > 0 && valorDiariaNum > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                Subtotal ({diasNum} dias): <span className="font-bold">R$ {subtotalLocacao.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Valor Frete */}
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">
              Valor do Frete (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorFrete}
              onChange={(e) => setValorFrete(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="50.00"
              required
            />
          </div>

          {/* Desconto e Taxa Extra */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Desconto (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Taxa Extra (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxaExtra}
                onChange={(e) => setTaxaExtra(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Resumo de Valores */}
          {valorTotal > 0 && (
            <div className="bg-green-50 p-4 rounded-xl border-2 border-green-300 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Locacao ({diasNum}d x R$ {valorDiariaNum.toFixed(2)})</span>
                <span className="font-medium">R$ {subtotalLocacao.toFixed(2)}</span>
              </div>
              {subtotalOperador > 0 && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span>Operador ({diasNum}d x R$ {valorOperadorNum.toFixed(2)})</span>
                  <span className="font-medium">+ R$ {subtotalOperador.toFixed(2)}</span>
                </div>
              )}
              {valorFreteNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="font-medium">R$ {valorFreteNum.toFixed(2)}</span>
                </div>
              )}
              {subtotalConsumiveis > 0 && (
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Consumíveis</span>
                  <span className="font-medium">+ R$ {subtotalConsumiveis.toFixed(2)}</span>
                </div>
              )}
              {descontoNum > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Desconto</span>
                  <span className="font-medium">- R$ {descontoNum.toFixed(2)}</span>
                </div>
              )}
              {taxaExtraNum > 0 && (
                <div className="flex justify-between text-sm text-orange-700">
                  <span>Taxa Extra</span>
                  <span className="font-medium">+ R$ {taxaExtraNum.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-green-300 mt-1">
                <span className="font-bold text-gray-800">TOTAL</span>
                <span className="text-2xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Botoes */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-200 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-300 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !valorDiaria || !valorFrete}
              className="flex-1 py-4 bg-orange-600 text-white text-lg font-bold rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
              <span>{loading ? 'Enviando...' : isEdicao ? 'Atualizar Proposta' : 'Enviar Proposta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
