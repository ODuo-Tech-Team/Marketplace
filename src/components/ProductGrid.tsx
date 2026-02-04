import { Loader2, Package } from 'lucide-react'
import ProductCard from './ProductCard'
import type { Equipamento } from '../contexts/AppContext'

interface ProductGridProps {
  equipamentos: Equipamento[]
  loading: boolean
  onCardClick: (equipamento: Equipamento) => void
}

export default function ProductGrid({ equipamentos, loading, onCardClick }: ProductGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (equipamentos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-surface-elevated p-4 rounded-full mb-4 inline-block">
          <Package className="w-12 h-12 text-foreground-muted" />
        </div>
        <h3 className="text-lg font-bold text-foreground-secondary mb-2">Nenhum equipamento encontrado</h3>
        <p className="text-foreground-muted">Tente ajustar os filtros de busca</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
      {equipamentos.map(equipamento => (
        <ProductCard
          key={equipamento.id}
          equipamento={equipamento}
          onClick={() => onCardClick(equipamento)}
        />
      ))}
    </div>
  )
}
