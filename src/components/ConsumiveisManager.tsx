import { useState } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'
import type { Consumivel } from '../contexts/AppContext'

interface ConsumiveisManagerProps {
  consumiveis: Consumivel[]
  onAdd: (nome: string, preco: number) => Promise<void>
  onRemove: (id: string) => Promise<void>
  loading?: boolean
}

export function ConsumiveisManager({ consumiveis, onAdd, onRemove, loading }: ConsumiveisManagerProps) {
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [removendoId, setRemovendoId] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!nome.trim() || !preco) return
    setAdicionando(true)
    await onAdd(nome.trim(), parseFloat(preco))
    setNome('')
    setPreco('')
    setAdicionando(false)
  }

  const handleRemove = async (id: string) => {
    setRemovendoId(id)
    await onRemove(id)
    setRemovendoId(null)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
        <Package className="w-4 h-4" />
        Kit de Consumíveis (Venda Cruzada)
      </h4>

      {/* Lista de consumíveis existentes */}
      {consumiveis.length > 0 && (
        <div className="space-y-2 mb-3">
          {consumiveis.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-100">
              <div>
                <span className="text-sm font-medium text-gray-800">{item.nome}</span>
                <span className="text-sm text-blue-600 font-bold ml-2">R$ {item.preco.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={removendoId === item.id}
                className="p-1 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {consumiveis.length === 0 && (
        <p className="text-xs text-blue-600 mb-3">Nenhum consumível cadastrado. Adicione itens como discos, brocas, etc.</p>
      )}

      {/* Formulário para adicionar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do item"
          className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="R$"
          className="w-24 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adicionando || !nome.trim() || !preco}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
