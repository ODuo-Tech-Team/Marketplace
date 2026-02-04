import { useState, useMemo } from 'react'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'

interface FotosCarrosselProps {
  fotos?: string[] | null
  imagemPrincipal?: string | null
  nomeEquipamento: string
  heightClass?: string
}

// Helper para verificar se é Base64 (com ou sem prefixo data:)
const isBase64 = (str: string): boolean => {
  if (str.startsWith('data:')) return true
  // Detecta Base64 sem prefixo (strings muito longas com caracteres típicos)
  if (str.length > 500 && /^[A-Za-z0-9+/=]+$/.test(str.substring(0, 100))) return true
  return false
}

export default function FotosCarrossel({ fotos, imagemPrincipal, nomeEquipamento, heightClass = 'h-56' }: FotosCarrosselProps) {
  const [indiceAtual, setIndiceAtual] = useState(0)

  const todasFotos = useMemo(() => {
    const urlsFotos: string[] = []
    if (fotos && fotos.length > 0) {
      fotos.forEach(path => {
        if (!path) return

        // URL completa - usa direto
        if (path.startsWith('http://') || path.startsWith('https://')) {
          urlsFotos.push(path)
          return
        }

        // Base64 com prefixo - usa direto
        if (path.startsWith('data:')) {
          urlsFotos.push(path)
          return
        }

        // Base64 sem prefixo - ignora (dado corrompido)
        if (isBase64(path)) {
          console.warn('Imagem Base64 detectada sem prefixo data: - ignorando')
          return
        }

        // Path relativo do Supabase Storage - constrói URL pública
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        if (supabaseUrl) {
          urlsFotos.push(`${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`)
        }
      })
    }
    if (urlsFotos.length === 0 && imagemPrincipal) {
      if (imagemPrincipal.startsWith('http') || imagemPrincipal.startsWith('data:')) {
        urlsFotos.push(imagemPrincipal)
      }
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
      <div className={`w-full ${heightClass} overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-neutral-800 p-3`}>
        <img src={todasFotos[0]} alt={nomeEquipamento} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
      </div>
    )
  }

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-neutral-800 p-3`}>
      <img
        src={todasFotos[indiceAtual]}
        alt={`${nomeEquipamento} - ${indiceAtual + 1}`}
        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
      />
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
