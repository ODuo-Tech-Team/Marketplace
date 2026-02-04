import { FileText, X, Loader2, Calendar, Truck, HardHat, Clock, Package } from 'lucide-react'
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
    <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-border-subtle">
      {/* Dark Header */}
      <div className="bg-surface-elevated px-5 py-4 flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cta rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              PROPOSTA
              {isLA && <span className="px-2 py-0.5 bg-cta/20 text-cta text-[10px] font-bold rounded-full uppercase tracking-wider">Pesado</span>}
            </h3>
          </div>
        </div>
        <span className="px-3 py-1 bg-cta/20 text-cta text-[10px] font-bold rounded-full uppercase tracking-wider">
          Pendente
        </span>
      </div>

      {/* Body */}
      <div className="bg-surface-elevated p-5 space-y-4">
        {/* Periodo */}
        {temDatas && (
          <div className="bg-surface-inset/50 rounded-2xl p-4 border border-border-subtle">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Periodo
            </p>
            <p className="text-sm text-foreground-secondary font-medium">
              {formatDate(proposta.data_inicio)} - {formatDate(proposta.data_fim)}
            </p>
          </div>
        )}

        {/* Campos Linha Amarela */}
        {isLA && (proposta.horimetro_saida || proposta.tipo_veiculo_transporte || temOperador) && (
          <div className="bg-cta/10 border border-cta/20 rounded-2xl p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cta flex items-center gap-1">
              <Truck className="w-3 h-3" /> Dados Linha Amarela
            </p>
            {proposta.horimetro_saida && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-cta" />
                <span className="text-sm text-foreground-secondary">Horímetro Saída: <strong>{proposta.horimetro_saida}h</strong></span>
                {proposta.horimetro_saida_foto && (
                  <img src={proposta.horimetro_saida_foto} alt="Horímetro" className="w-8 h-8 rounded-lg object-cover border border-cta/30" />
                )}
              </div>
            )}
            {temOperador && (
              <div className="flex items-center gap-2">
                <HardHat className="w-3 h-3 text-cta" />
                <span className="text-sm text-foreground-secondary">
                  Operador: <strong>R$ {proposta.valor_operador_diaria!.toFixed(2)}/dia</strong>
                </span>
              </div>
            )}
            {proposta.tipo_veiculo_transporte && (
              <div className="flex items-center gap-2">
                <Truck className="w-3 h-3 text-cta" />
                <span className="text-sm text-foreground-secondary">
                  Veículo: <strong>{proposta.tipo_veiculo_transporte}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Valores */}
        <div className="bg-surface-inset/50 rounded-2xl p-4 space-y-2 border border-border-subtle">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground-secondary">Valor da Diaria</span>
            <span className="text-sm font-bold text-foreground-secondary">
              R$ {proposta.valor_diaria?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground-secondary">Quantidade de Dias</span>
            <span className="text-sm font-bold text-foreground-secondary">
              {proposta.quantidade_dias || 0} dias
            </span>
          </div>
          {temOperador && (
            <div className="flex justify-between items-center text-cta">
              <span className="text-sm">Operador</span>
              <span className="text-sm font-bold">
                + R$ {((proposta.valor_operador_diaria || 0) * (proposta.quantidade_dias || 0)).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground-secondary">Valor do Frete</span>
            <span className="text-sm font-bold text-foreground-secondary">
              R$ {proposta.valor_frete?.toFixed(2) || '0.00'}
            </span>
          </div>
          {temDesconto && (
            <div className="flex justify-between items-center text-green-400">
              <span className="text-sm">Desconto</span>
              <span className="text-sm font-bold">
                - R$ {proposta.desconto!.toFixed(2)}
              </span>
            </div>
          )}
          {temTaxaExtra && (
            <div className="flex justify-between items-center text-cta">
              <span className="text-sm">Taxa Extra</span>
              <span className="text-sm font-bold">
                + R$ {proposta.taxa_extra!.toFixed(2)}
              </span>
            </div>
          )}

          {/* Consumíveis */}
          {consumiveisProposta && consumiveisProposta.length > 0 && (
            <>
              <div className="h-px bg-border-subtle my-1" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Consumíveis
                </p>
                {consumiveisProposta.map((c) => (
                  <div key={c.id} className="flex justify-between items-center text-blue-400">
                    <span className="text-sm">{c.nome} x{c.quantidade}</span>
                    <span className="text-sm font-bold">+ R$ {(c.preco_unitario * c.quantidade).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="h-px bg-border-subtle my-2" />
          <div className="flex justify-between items-center pt-1">
            <span className="font-black text-foreground">TOTAL</span>
            <span className="text-2xl font-black text-green-400">
              R$ {proposta.valor_total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="bg-cta/10 border border-cta/20 rounded-2xl p-4 text-center">
          <p className="text-cta font-bold text-sm">Aguardando Cliente</p>
          <p className="text-cta/60 text-xs mt-0.5">A proposta foi enviada e está sendo analisada</p>
        </div>

        <button
          onClick={onApagar}
          disabled={apagando}
          className="w-full py-3.5 bg-glass-hover text-foreground-secondary font-bold rounded-xl hover:bg-glass-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-border-subtle"
        >
          {apagando ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
          {apagando ? 'Apagando...' : 'Cancelar Proposta'}
        </button>
        <p className="text-[11px] text-foreground-muted text-center font-medium">
          Voce pode cancelar esta proposta e criar uma nova com valores diferentes
        </p>
      </div>
    </div>
  )
}
