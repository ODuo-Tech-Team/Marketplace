import { useState, useMemo } from 'react'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'

interface FotosCarrosselProps {
  fotos?: string[] | null
  imagemPrincipal?: string | null
  nomeEquipamento: string
  heightClass?: string
}

export default function FotosCarrossel({ fotos, imagemPrincipal, nomeEquipamento, heightClass = 'h-56' }: FotosCarrosselProps) {
  const [indiceAtual, setIndiceAtual] = useState(0)

  const todasFotos = useMemo(() => {
    const urlsFotos: string[] = []
    if (fotos && fotos.length > 0) {
      fotos.forEach(path => {
        if (!path) return
        if (path.startsWith('http') || path.startsWith('data:')) {
          urlsFotos.push(path)
        } else {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          if (supabaseUrl) {
            urlsFotos.push(`${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`)
          }
        }
      })
    }
    if (urlsFotos.length === 0 && imagemPrincipal) {
      urlsFotos.push(imagemPrincipal)
    }
    return urlsFotos
  }, [fotos, imagemPrincipal])

  if (todasFotos.length === 0) {
    return (
      <div className={`w-full ${heightClass} bg-surface-elevated flex items-center justify-center`}>
        <Package className="w-12 h-12 text-foreground-muted" />
      </div>
    )
  }

  if (todasFotos.length === 1) {
    return (
      <div className={`w-full ${heightClass} overflow-hidden`}>
        <img src={todasFotos[0]} alt={nomeEquipamento} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    )
  }

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden`}>
      <img
        src={todasFotos[indiceAtual]}
        alt={`${nomeEquipamento} - ${indiceAtual + 1}`}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setIndiceAtual(i => i > 0 ? i - 1 : todasFotos.length - 1) }}
          className="ml-2 p-1.5 bg-white/80 backdrop-blur text-foreground-secondary rounded-full hover:bg-white shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIndiceAtual(i => i < todasFotos.length - 1 ? i + 1 : 0) }}
          className="mr-2 p-1.5 bg-white/80 backdrop-blur text-foreground-secondary rounded-full hover:bg-white shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {todasFotos.map((_, idx) => (
          <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === indiceAtual ? 'bg-white scale-110' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}
