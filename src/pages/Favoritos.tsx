import { Heart, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Favoritos() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-[1600px] mx-auto px-6 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-900 dark:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Favoritos</h1>
        </div>
      </div>

      {/* Empty State */}
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
    </div>
  )
}
