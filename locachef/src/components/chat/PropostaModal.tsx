import React, { useState, useEffect } from 'react'
import { X, Check, Loader2, Package } from 'lucide-react'

interface PropostaModalProps {
  isOpen: boolean
  onClose: () => void
  onEnviar: (dados: { valorDiaria: number; valorFrete: number }) => Promise<void>
  loading: boolean
  equipamentoNome?: string
  equipamentoPreco?: number
  quantidadeDias?: number
}

export function PropostaModal({
  isOpen,
  onClose,
  onEnviar,
  loading,
  equipamentoNome,
  equipamentoPreco,
  quantidadeDias
}: PropostaModalProps) {
  const [valorDiaria, setValorDiaria] = useState('')
  const [valorFrete, setValorFrete] = useState('')

  const valorDiariaNum = parseFloat(valorDiaria) || 0
  const valorFreteNum = parseFloat(valorFrete) || 0
  const diasNum = quantidadeDias || 0
  const valorTotal = (valorDiariaNum * diasNum) + valorFreteNum

  useEffect(() => {
    if (isOpen && equipamentoPreco && !valorDiaria) {
      setValorDiaria(equipamentoPreco.toFixed(2))
    }
  }, [isOpen, equipamentoPreco, valorDiaria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onEnviar({
      valorDiaria: valorDiariaNum,
      valorFrete: valorFreteNum
    })
    setValorDiaria('')
    setValorFrete('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Gerar Proposta</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-orange-600" />
              <span className="font-bold text-gray-800 text-lg">
                {equipamentoNome || 'Equipamento'}
              </span>
            </div>
            {quantidadeDias && (
              <p className="text-sm text-gray-600">
                Período solicitado: <span className="font-bold">{quantidadeDias} dias</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">
              Valor da Diária (R$) *
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
            {quantidadeDias && valorDiariaNum > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                Subtotal ({quantidadeDias} dias):{' '}
                <span className="font-bold">R$ {(valorDiariaNum * quantidadeDias).toFixed(2)}</span>
              </p>
            )}
          </div>

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

          {valorTotal > 0 && (
            <div className="bg-green-50 p-4 rounded-xl border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-1">Valor Total da Proposta</p>
              <p className="text-3xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</p>
            </div>
          )}

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
              <span>{loading ? 'Enviando...' : 'Enviar Proposta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
