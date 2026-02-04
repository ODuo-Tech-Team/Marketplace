import { useState } from 'react'
import { FileText, X, Check, Loader2, MapPin, Calendar, Truck, HardHat, Clock, Package } from 'lucide-react'
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
    if (enderecoExistente?.logradouro) {
      onAceitar(enderecoExistente)
      return
    }
    setMostrarFormEndereco(true)
  }

  const handleConfirmarEndereco = () => {
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

  // Formulário de Endereço (Dark)
  if (mostrarFormEndereco) {
    return (
      <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-border-subtle">
        <div className="bg-surface-elevated px-5 py-4 flex items-center gap-3 border-b border-border-subtle">
          <div className="w-8 h-8 bg-cta rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Endereco de Entrega</h3>
        </div>

        <div className="bg-surface-elevated p-5 space-y-4">
          <p className="text-foreground-secondary text-sm">
            Para aceitar a proposta, informe o endereco onde o equipamento deve ser entregue.
          </p>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
              Rua / Logradouro *
            </label>
            <input
              type="text"
              value={endereco.logradouro}
              onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
              placeholder="Ex: Rua das Flores, 123"
              className="w-full px-4 py-3 bg-surface-inset/50 border border-border rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-all text-foreground placeholder:text-foreground-muted"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
              CEP *
            </label>
            <input
              type="text"
              value={endereco.cep}
              onChange={(e) => setEndereco({ ...endereco, cep: formatCEP(e.target.value) })}
              placeholder="00000-000"
              maxLength={9}
              className="w-full px-4 py-3 bg-surface-inset/50 border border-border rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-all text-foreground placeholder:text-foreground-muted"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={endereco.cidade}
                onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                placeholder="São Paulo"
                className="w-full px-4 py-3 bg-surface-inset/50 border border-border rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-all text-foreground placeholder:text-foreground-muted"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
                UF *
              </label>
              <input
                type="text"
                value={endereco.uf}
                onChange={(e) => setEndereco({ ...endereco, uf: e.target.value.toUpperCase() })}
                placeholder="SP"
                maxLength={2}
                className="w-full px-4 py-3 bg-surface-inset/50 border border-border rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-all text-foreground placeholder:text-foreground-muted uppercase"
              />
            </div>
          </div>

          {erroEndereco && (
            <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-sm font-medium border border-red-500/20">
              {erroEndereco}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setMostrarFormEndereco(false)}
              disabled={respondendo}
              className="flex-1 py-3.5 bg-glass-hover text-foreground-secondary font-bold rounded-xl hover:bg-glass-hover transition-all disabled:opacity-50 border border-border-subtle"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmarEndereco}
              disabled={respondendo}
              className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
            >
              {respondendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Confirmar e Aceitar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isLA = equipamentoCategoria ? isLinhaAmarela(equipamentoCategoria) : false
  const temOperador = proposta.com_operador && proposta.valor_operador_diaria && proposta.valor_operador_diaria > 0

  return (
    <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-border-subtle">
      {/* Dark Header */}
      <div className="bg-surface-elevated px-5 py-4 flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              PROPOSTA RECEBIDA
              {isLA && <span className="px-2 py-0.5 bg-cta/20 text-cta text-[10px] font-bold rounded-full uppercase tracking-wider">Pesado</span>}
            </h3>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
          Nova
        </span>
      </div>

      {/* Body */}
      <div className="bg-surface-elevated p-5 space-y-4">
        {/* Periodo */}
        {(proposta.data_inicio || proposta.data_fim) && (
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
          {proposta.desconto && proposta.desconto > 0 && (
            <div className="flex justify-between items-center text-green-400">
              <span className="text-sm">Desconto</span>
              <span className="text-sm font-bold">- R$ {proposta.desconto.toFixed(2)}</span>
            </div>
          )}
          {proposta.taxa_extra && proposta.taxa_extra > 0 && (
            <div className="flex justify-between items-center text-cta">
              <span className="text-sm">Taxa Extra</span>
              <span className="text-sm font-bold">+ R$ {proposta.taxa_extra.toFixed(2)}</span>
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

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRecusar}
            disabled={respondendo}
            className="flex-1 py-3.5 bg-glass-hover text-foreground-secondary font-bold rounded-xl hover:bg-glass-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-border-subtle"
          >
            <X className="w-5 h-5" />
            Recusar
          </button>
          <button
            onClick={handleAceitarClick}
            disabled={respondendo}
            className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-900/50"
          >
            {respondendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Aceitar e Pagar
          </button>
        </div>
      </div>
    </div>
  )
}
