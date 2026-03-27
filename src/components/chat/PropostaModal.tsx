import React, { useState, useEffect } from 'react'
import { X, Check, Loader2, Package, Edit3, Calendar, Truck, HardHat, Wrench, Sparkles, GraduationCap } from 'lucide-react'
import type { Proposta, Consumivel } from '../../contexts/AppContext'
import { TIPOS_VEICULO_TRANSPORTE } from '../../contexts/AppContext'
import { HorimetroInput } from './HorimetroInput'
import { ConsumiveisSelector } from './ConsumiveisSelector'

// Serviços inclusos disponíveis
export const SERVICOS_INCLUSOS = [
  { key: 'montagem_local', label: 'Montagem no local', icon: Wrench, description: 'Instalação e montagem do equipamento no endereço' },
  { key: 'higienizacao', label: 'Higienização prévia', icon: Sparkles, description: 'Limpeza e sanitização antes da entrega' },
  { key: 'treinamento', label: 'Treinamento de uso', icon: GraduationCap, description: 'Instrução de operação do equipamento' },
] as const

export type ServicoIncluso = typeof SERVICOS_INCLUSOS[number]['key']

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
    // Serviços inclusos
    servicosInclusos?: ServicoIncluso[]
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
    servicosInclusos?: ServicoIncluso[]
  }) => Promise<void>
  // Categoria para campos condicionais
  isLinhaAmarela?: boolean
  // Cliente precisa de operador (vindo do chat)
  precisaOperador?: boolean
  // Consumíveis disponíveis (Light Equipment)
  consumiveisDisponiveis?: Consumivel[]
}

function calcularDiasEntreDatas(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0
  const d1 = new Date(inicio)
  const d2 = new Date(fim)
  const diff = d2.getTime() - d1.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
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
  precisaOperador,
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

  // Serviços Inclusos
  const [servicosInclusos, setServicosInclusos] = useState<ServicoIncluso[]>([])

  const toggleServico = (key: ServicoIncluso) => {
    setServicosInclusos(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    )
  }

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
      setComOperador(precisaOperador || false)
      setValorOperadorDiaria('')
      setTipoVeiculoTransporte('')
      setConsumiveisSelecionados([])
      setServicosInclusos([])
    }
  }, [isOpen, isEdicao, propostaExistente, equipamentoPreco, precisaOperador])

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
      // Serviços Inclusos
      servicosInclusos: servicosInclusos.length > 0 ? servicosInclusos : undefined,
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
    setServicosInclusos([])
  }

  if (!isOpen) return null

  // Data minima = hoje
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="Enviar Proposta">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl shadow-indigo-500/10 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-neutral-800">
        {/* Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-3xl" />
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isEdicao ? (
              <><Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Editar Proposta</>
            ) : (
              <><Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Gerar Proposta</>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Equipamento Info */}
          <div className={`p-4 rounded-xl border-2 ${isLinhaAmarela ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800' : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'}`}>
            <div className="flex items-center gap-3 mb-1">
              <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-slate-900 dark:text-white text-lg">
                {equipamentoNome || 'Equipamento'}
              </span>
            </div>
            {isLinhaAmarela && (
              <span className="inline-block px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full mt-1">PESADO</span>
            )}
            {quantidadeDias && !dataInicio && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Periodo solicitado: <span className="font-bold text-slate-900 dark:text-white">{quantidadeDias} dias</span>
              </p>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Periodo de Locacao
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data Inicio</label>
                <input
                  type="date"
                  value={dataInicio}
                  min={hoje}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio || hoje}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            {diasPorDatas > 0 && (
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2 font-medium">
                Periodo: {diasPorDatas} dias
              </p>
            )}
          </div>

          {/* === CAMPOS LINHA AMARELA === */}
          {isLinhaAmarela && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border-2 border-amber-300 dark:border-amber-800 space-y-4">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
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
                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-colors ${precisaOperador ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500' : 'border-transparent'}`}>
                  <input
                    type="checkbox"
                    checked={comOperador}
                    onChange={(e) => setComOperador(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <HardHat className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Incluir Operador
                  </span>
                  {precisaOperador && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold ml-auto">Solicitado</span>
                  )}
                </label>
                {comOperador && (
                  <div className="mt-2 ml-8">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valor Operador/Dia (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorOperadorDiaria}
                      onChange={(e) => setValorOperadorDiaria(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-neutral-800 text-slate-900 dark:text-white"
                      placeholder="200.00"
                    />
                    {valorOperadorNum > 0 && diasNum > 0 && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        Subtotal operador: R$ {subtotalOperador.toFixed(2)} ({diasNum}d)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Tipo de Veículo */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Tipo de Veículo para Transporte
                </label>
                <select
                  value={tipoVeiculoTransporte}
                  onChange={(e) => setTipoVeiculoTransporte(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-neutral-800 text-slate-900 dark:text-white"
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
            <label className="block text-base font-bold text-slate-700 dark:text-slate-200 mb-2">
              Valor da Diaria (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorDiaria}
              onChange={(e) => setValorDiaria(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-neutral-800 text-slate-900 dark:text-white"
              placeholder="150.00"
              required
            />
            {diasNum > 0 && valorDiariaNum > 0 && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Subtotal ({diasNum} dias): <span className="font-bold text-slate-900 dark:text-white">R$ {subtotalLocacao.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Valor Frete */}
          <div>
            <label className="block text-base font-bold text-slate-700 dark:text-slate-200 mb-2">
              Valor do Frete (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorFrete}
              onChange={(e) => setValorFrete(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-neutral-800 text-slate-900 dark:text-white"
              placeholder="50.00"
              required
            />
          </div>

          {/* Serviços Inclusos */}
          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Serviços Inclusos (opcional)
            </p>
            <div className="space-y-2">
              {SERVICOS_INCLUSOS.map(servico => {
                const Icon = servico.icon
                const isSelected = servicosInclusos.includes(servico.key)
                return (
                  <label
                    key={servico.key}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600'
                        : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleServico(servico.key)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <div className="flex-1">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-purple-800 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {servico.label}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{servico.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Desconto e Taxa Extra */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Desconto (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Taxa Extra (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxaExtra}
                onChange={(e) => setTaxaExtra(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Resumo de Valores */}
          {valorTotal > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border-2 border-emerald-300 dark:border-emerald-800 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Locacao ({diasNum}d x R$ {valorDiariaNum.toFixed(2)})</span>
                <span className="font-medium text-slate-900 dark:text-white">R$ {subtotalLocacao.toFixed(2)}</span>
              </div>
              {subtotalOperador > 0 && (
                <div className="flex justify-between text-sm text-indigo-600 dark:text-indigo-400">
                  <span>Operador ({diasNum}d x R$ {valorOperadorNum.toFixed(2)})</span>
                  <span className="font-medium">+ R$ {subtotalOperador.toFixed(2)}</span>
                </div>
              )}
              {valorFreteNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Frete</span>
                  <span className="font-medium text-slate-900 dark:text-white">R$ {valorFreteNum.toFixed(2)}</span>
                </div>
              )}
              {subtotalConsumiveis > 0 && (
                <div className="flex justify-between text-sm text-indigo-700 dark:text-indigo-400">
                  <span>Consumíveis</span>
                  <span className="font-medium">+ R$ {subtotalConsumiveis.toFixed(2)}</span>
                </div>
              )}
              {descontoNum > 0 && (
                <div className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400">
                  <span>Desconto</span>
                  <span className="font-medium">- R$ {descontoNum.toFixed(2)}</span>
                </div>
              )}
              {taxaExtraNum > 0 && (
                <div className="flex justify-between text-sm text-amber-700 dark:text-amber-400">
                  <span>Taxa Extra</span>
                  <span className="font-medium">+ R$ {taxaExtraNum.toFixed(2)}</span>
                </div>
              )}
              {servicosInclusos.length > 0 && (
                <div className="flex justify-between text-sm text-purple-700 dark:text-purple-400">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    Serviços: {SERVICOS_INCLUSOS.filter(s => servicosInclusos.includes(s.key)).map(s => s.label).join(', ')}
                  </span>
                  <span className="font-medium">Incluso</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-emerald-300 dark:border-emerald-700 mt-1">
                <span className="font-bold text-slate-900 dark:text-white">TOTAL</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-tech">R$ {valorTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Botoes */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 text-lg font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !valorDiaria || !valorFrete}
              className="flex-1 py-4 bg-slate-900 dark:bg-indigo-600 text-white text-lg font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
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
