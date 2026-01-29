import { Package } from 'lucide-react'
import type { Consumivel } from '../../contexts/AppContext'

interface SelectedConsumivel {
  consumivel_id: string
  quantidade: number
  preco_unitario: number
  nome: string
}

interface ConsumiveisSelectorProps {
  consumiveis: Consumivel[]
  selected: SelectedConsumivel[]
  onChange: (selected: SelectedConsumivel[]) => void
}

export function ConsumiveisSelector({ consumiveis, selected, onChange }: ConsumiveisSelectorProps) {
  if (consumiveis.length === 0) return null

  const isSelected = (id: string) => selected.some(s => s.consumivel_id === id)
  const getQuantidade = (id: string) => selected.find(s => s.consumivel_id === id)?.quantidade || 1

  const toggleItem = (item: Consumivel) => {
    if (isSelected(item.id)) {
      onChange(selected.filter(s => s.consumivel_id !== item.id))
    } else {
      onChange([...selected, {
        consumivel_id: item.id,
        quantidade: 1,
        preco_unitario: item.preco,
        nome: item.nome
      }])
    }
  }

  const updateQuantidade = (id: string, quantidade: number) => {
    if (quantidade < 1) return
    onChange(selected.map(s => s.consumivel_id === id ? { ...s, quantidade } : s))
  }

  const subtotal = selected.reduce((acc, s) => acc + (s.preco_unitario * s.quantidade), 0)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
      <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
        <Package className="w-4 h-4" /> Kit de Consumíveis
      </p>

      <div className="space-y-2">
        {consumiveis.map((item) => {
          const checked = isSelected(item.id)
          return (
            <div key={item.id} className={`flex items-center gap-3 bg-white rounded-lg px-3 py-2 border ${checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleItem(item)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">{item.nome}</span>
                <span className="text-sm text-blue-600 font-bold ml-2">R$ {item.preco.toFixed(2)}</span>
              </div>
              {checked && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQuantidade(item.id, getQuantidade(item.id) - 1)}
                    className="w-6 h-6 bg-blue-200 text-blue-800 rounded text-sm font-bold hover:bg-blue-300"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{getQuantidade(item.id)}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantidade(item.id, getQuantidade(item.id) + 1)}
                    className="w-6 h-6 bg-blue-200 text-blue-800 rounded text-sm font-bold hover:bg-blue-300"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {subtotal > 0 && (
        <div className="flex justify-between mt-2 pt-2 border-t border-blue-200">
          <span className="text-sm font-semibold text-blue-800">Subtotal Consumíveis</span>
          <span className="text-sm font-bold text-blue-600">R$ {subtotal.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}
