import { useState, useEffect, useMemo } from 'react'
import { Heart, ArrowLeft, Package, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import ProductCard from '../components/ProductCard'

const FAVORITES_KEY = 'trakto_favorites'

export default function Favoritos() {
  const navigate = useNavigate()
  const { equipamentos, loadingEquipamentos } = useApp()
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  // Carrega IDs dos favoritos do localStorage
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
      setFavoriteIds(ids)
    } catch {
      setFavoriteIds([])
    }

    // Listener para atualizar quando favoritos mudam em outra aba/componente
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) {
        try {
          const ids = JSON.parse(e.newValue || '[]')
          setFavoriteIds(ids)
        } catch {
          setFavoriteIds([])
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Filtra equipamentos que estão nos favoritos
  const favoritosEquipamentos = useMemo(() => {
    if (favoriteIds.length === 0) return []
    return equipamentos.filter(eq => favoriteIds.includes(eq.id))
  }, [equipamentos, favoriteIds])

  const isLoading = loadingEquipamentos && favoriteIds.length > 0

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Mobile */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#0f0f11]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 h-16 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-900 dark:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">Favoritos</h1>
        </div>
        {favoritosEquipamentos.length > 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {favoritosEquipamentos.length} {favoritosEquipamentos.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-[1600px] mx-auto px-6 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-900 dark:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Favoritos</h1>
          </div>
          {favoritosEquipamentos.length > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {favoritosEquipamentos.length} {favoritosEquipamentos.length === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
      </div>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-4" />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : favoritosEquipamentos.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center px-4 pt-20 lg:pt-12">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 dark:from-purple-900 dark:via-purple-800 dark:to-pink-900 flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20 dark:shadow-purple-900/20">
            <Heart size={40} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 text-center">
            Seus favoritos aparecerão aqui
          </h2>

          <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-md mb-8">
            Salve os equipamentos que você mais gosta para encontrá-los facilmente depois
          </p>

          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 dark:bg-purple-600 hover:bg-indigo-500 dark:hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/30 dark:shadow-purple-600/30 transition-all active:scale-[0.98]"
          >
            Explorar Equipamentos
          </button>
        </div>
      ) : (
        /* Grid de Favoritos */
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {favoritosEquipamentos.map(eq => (
              <ProductCard
                key={eq.id}
                equipamento={eq}
                onClick={() => navigate(`/product/${eq.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
