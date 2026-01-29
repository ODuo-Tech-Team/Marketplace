import { FileText, X, Loader2, Calendar, Truck, User, Clock, Package } from 'lucide-react'
import type { Proposta, PropostaConsumivel } from '../../contexts/AppContext'
import { isLinhaAmarela } from '../../contexts/AppContext'

interface PropostaEnviadaCardProps {
  proposta: Proposta
  onApagar: () => void
  apagando: boolean
  equipamentoCategoria?: string | null
  consumiveisProposta?: PropostaConsumivel[]
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function PropostaEnviadaCard({ proposta, onApagar, apagando, equipamentoCategoria, consumiveisProposta }: PropostaEnviadaCardProps) {
  const temDatas = proposta.data_inicio || proposta.data_fim
  const temDesconto = proposta.desconto && proposta.desconto > 0
  const temTaxaExtra = proposta.taxa_extra && proposta.taxa_extra > 0
  const isLA = equipamentoCategoria ? isLinhaAmarela(equipamentoCategoria) : false
  const temOperador = proposta.com_operador && proposta.valor_operador_diaria && proposta.valor_operador_diaria > 0

  return (
    <div className={`mb-6 bg-gradient-to-br ${isLA ? 'from-amber-50 to-yellow-50 border-2 border-amber-400' : 'from-blue-50 to-cyan-50 border-2 border-blue-300'} rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className={`w-6 h-6 ${isLA ? 'text-amber-600' : 'text-blue-600'}`} />
          Proposta Enviada
          {isLA && <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">PESADO</span>}
        </h3>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-full">
          Aguardando resposta
        </span>
      </div>

      <div className="space-y-4">
        {/* Periodo */}
        {temDatas && (
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
          {temDesconto && (
            <div className="flex justify-between items-center text-green-700">
              <span className="text-sm">Desconto</span>
              <span className="text-base font-bold">
                - R$ {proposta.desconto!.toFixed(2)}
              </span>
            </div>
          )}
          {temTaxaExtra && (
            <div className="flex justify-between items-center text-orange-700">
              <span className="text-sm">Taxa Extra</span>
              <span className="text-base font-bold">
                + R$ {proposta.taxa_extra!.toFixed(2)}
              </span>
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
            <span className={`text-2xl font-bold ${isLA ? 'text-amber-600' : 'text-blue-600'}`}>
              R$ {proposta.valor_total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        <button
          onClick={onApagar}
          disabled={apagando}
          className="w-full py-3 bg-red-100 text-red-700 text-base font-bold rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {apagando ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
          {apagando ? 'Apagando...' : 'Cancelar Proposta'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Voce pode cancelar esta proposta e criar uma nova com valores diferentes
        </p>
      </div>
    </div>
  )
}
