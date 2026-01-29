import { useState } from 'react'
import { FileText, X, Check, Loader2, MapPin, Calendar, Truck, User, Clock, Package } from 'lucide-react'
import type { Proposta, PropostaConsumivel } from '../../contexts/AppContext'
import { isLinhaAmarela } from '../../contexts/AppContext'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface EnderecoEntrega {
  logradouro: string
  cep: string
  cidade: string
  uf: string
}

interface PropostaRecebidaCardProps {
  proposta: Proposta
  onAceitar: (endereco: EnderecoEntrega) => void | Promise<void>
  onRecusar: () => void | Promise<void>
  respondendo: boolean
  enderecoExistente?: EnderecoEntrega
  equipamentoCategoria?: string | null
  consumiveisProposta?: PropostaConsumivel[]
}

export function PropostaRecebidaCard({
  proposta,
  onAceitar,
  onRecusar,
  respondendo,
  enderecoExistente,
  equipamentoCategoria,
  consumiveisProposta
}: PropostaRecebidaCardProps) {
  const [mostrarFormEndereco, setMostrarFormEndereco] = useState(false)
  const [endereco, setEndereco] = useState<EnderecoEntrega>(
    enderecoExistente || { logradouro: '', cep: '', cidade: '', uf: '' }
  )
  const [erroEndereco, setErroEndereco] = useState<string | null>(null)

  const handleAceitarClick = () => {
    // Se já tem endereço existente, aceita direto
    if (enderecoExistente?.logradouro) {
      onAceitar(enderecoExistente)
      return
    }
    // Senão, mostra formulário
    setMostrarFormEndereco(true)
  }

  const handleConfirmarEndereco = () => {
    // Validação
    if (!endereco.logradouro.trim()) {
      setErroEndereco('Informe a rua/logradouro')
      return
    }
    if (!endereco.cep.trim() || endereco.cep.replace(/\D/g, '').length < 8) {
      setErroEndereco('Informe um CEP válido')
      return
    }
    if (!endereco.cidade.trim()) {
      setErroEndereco('Informe a cidade')
      return
    }
    if (!endereco.uf.trim() || endereco.uf.length !== 2) {
      setErroEndereco('Informe o UF (ex: SP)')
      return
    }

    setErroEndereco(null)
    onAceitar(endereco)
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  // Modal de Endereço Obrigatório
  if (mostrarFormEndereco) {
    return (
      <div className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-400 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-amber-600" />
          Endereco de Entrega
        </h3>

        <p className="text-gray-600 mb-4 text-sm">
          Para aceitar a proposta, informe o endereco onde o equipamento deve ser entregue.
        </p>

        <div className="space-y-4">
          {/* Logradouro */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Rua / Logradouro *
            </label>
            <input
              type="text"
              value={endereco.logradouro}
              onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
              placeholder="Ex: Rua das Flores, 123"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {/* CEP */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              CEP *
            </label>
            <input
              type="text"
              value={endereco.cep}
              onChange={(e) => setEndereco({ ...endereco, cep: formatCEP(e.target.value) })}
              placeholder="00000-000"
              maxLength={9}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Cidade e UF */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                value={endereco.cidade}
                onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                placeholder="São Paulo"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                UF *
              </label>
              <input
                type="text"
                value={endereco.uf}
                onChange={(e) => setEndereco({ ...endereco, uf: e.target.value.toUpperCase() })}
                placeholder="SP"
                maxLength={2}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none uppercase"
              />
            </div>
          </div>

          {/* Erro */}
          {erroEndereco && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-200">
              {erroEndereco}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setMostrarFormEndereco(false)}
              disabled={respondendo}
              className="flex-1 py-4 bg-gray-200 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmarEndereco}
              disabled={respondendo}
              className="flex-1 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {respondendo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
              Confirmar e Aceitar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isLA = equipamentoCategoria ? isLinhaAmarela(equipamentoCategoria) : false
  const temOperador = proposta.com_operador && proposta.valor_operador_diaria && proposta.valor_operador_diaria > 0

  // Card normal da proposta
  return (
    <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-green-600" />
        Proposta Recebida
        {isLA && <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">PESADO</span>}
      </h3>

      <div className="space-y-4">
        {/* Periodo */}
        {(proposta.data_inicio || proposta.data_fim) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Periodo
            </p>
            <p className="text-sm text-gray-800 font-medium">
              {formatDate(proposta.data_inicio)} - {formatDate(proposta.data_fim)}
            </p>
          </div>
        )}

        {/* Campos Linha Amarela */}
        {isLA && (proposta.horimetro_saida || proposta.tipo_veiculo_transporte || temOperador) && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
              <Truck className="w-3 h-3" /> Dados Linha Amarela
            </p>
            {proposta.horimetro_saida && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-amber-600" />
                <span className="text-sm text-gray-700">Horímetro Saída: <strong>{proposta.horimetro_saida}h</strong></span>
                {proposta.horimetro_saida_foto && (
                  <img src={proposta.horimetro_saida_foto} alt="Horímetro" className="w-8 h-8 rounded object-cover border border-amber-300" />
                )}
              </div>
            )}
            {temOperador && (
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-amber-600" />
                <span className="text-sm text-gray-700">
                  Operador: <strong>R$ {proposta.valor_operador_diaria!.toFixed(2)}/dia</strong>
                </span>
              </div>
            )}
            {proposta.tipo_veiculo_transporte && (
              <div className="flex items-center gap-2">
                <Truck className="w-3 h-3 text-amber-600" />
                <span className="text-sm text-gray-700">
                  Veículo: <strong>{proposta.tipo_veiculo_transporte}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor da Diaria</span>
            <span className="text-base font-bold text-gray-800">
              R$ {proposta.valor_diaria?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Quantidade de Dias</span>
            <span className="text-base font-bold text-gray-800">
              {proposta.quantidade_dias || 0} dias
            </span>
          </div>
          {temOperador && (
            <div className="flex justify-between items-center text-amber-700">
              <span className="text-sm">Operador</span>
              <span className="text-base font-bold">
                + R$ {((proposta.valor_operador_diaria || 0) * (proposta.quantidade_dias || 0)).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor do Frete</span>
            <span className="text-base font-bold text-gray-800">
              R$ {proposta.valor_frete?.toFixed(2) || '0.00'}
            </span>
          </div>
          {proposta.desconto && proposta.desconto > 0 && (
            <div className="flex justify-between items-center text-green-700">
              <span className="text-sm">Desconto</span>
              <span className="text-base font-bold">- R$ {proposta.desconto.toFixed(2)}</span>
            </div>
          )}
          {proposta.taxa_extra && proposta.taxa_extra > 0 && (
            <div className="flex justify-between items-center text-orange-700">
              <span className="text-sm">Taxa Extra</span>
              <span className="text-base font-bold">+ R$ {proposta.taxa_extra.toFixed(2)}</span>
            </div>
          )}

          {/* Consumíveis */}
          {consumiveisProposta && consumiveisProposta.length > 0 && (
            <>
              <div className="h-px bg-blue-200 my-1" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Consumíveis
                </p>
                {consumiveisProposta.map((c) => (
                  <div key={c.id} className="flex justify-between items-center text-blue-700">
                    <span className="text-sm">{c.nome} x{c.quantidade}</span>
                    <span className="text-sm font-bold">+ R$ {(c.preco_unitario * c.quantidade).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="h-px bg-gray-200 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-700">Valor Total</span>
            <span className="text-2xl font-bold text-green-600">
              R$ {proposta.valor_total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRecusar}
            disabled={respondendo}
            className="flex-1 py-4 bg-red-100 text-red-700 text-lg font-bold rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <X className="w-6 h-6" />
            Recusar
          </button>
          <button
            onClick={handleAceitarClick}
            disabled={respondendo}
            className="flex-1 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {respondendo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
            Aceitar
          </button>
        </div>
      </div>
    </div>
  )
}
