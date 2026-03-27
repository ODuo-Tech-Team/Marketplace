import { Link } from 'react-router-dom'
import { Heart, Star, MapPin, ShieldCheck, ArrowRight, Store } from 'lucide-react'
import FotosCarrossel from './FotosCarrossel'
import type { Equipamento } from '../contexts/AppContext'
import { getLocadorDisplayName } from '../contexts/AppContext'
import { TrustSealsRow } from './TrustSeal'
import type { VerticalKey } from '../config/verticals'
import { useAuth } from '../contexts/AuthContext'
import { useLoginModal } from '../contexts/LoginModalContext'
import { useFavorites } from '../hooks/useFavorites'

interface ProductCardProps {
  equipamento: Equipamento
  onClick: () => void
}

export default function ProductCard({ equipamento, onClick }: ProductCardProps) {
  const { user } = useAuth()
  const { openLoginModal } = useLoginModal()
  const { isFav, toggleFav: rawToggle } = useFavorites(equipamento.id)

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      openLoginModal('Para favoritar equipamentos, faca login ou crie sua conta')
      return
    }
    rawToggle()
  }

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-neutral-900 rounded-3xl p-3 border border-gray-100 dark:border-neutral-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer group flex flex-col"
    >
      {/* Image Container */}
      <div className="relative h-52 rounded-2xl overflow-hidden bg-gray-50 dark:bg-neutral-800 mb-3">
        <FotosCarrossel
          fotos={equipamento.fotos}
          nomeEquipamento={equipamento.nome}
          heightClass="h-full"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border border-indigo-100 dark:border-indigo-800">
            {equipamento.categoria || 'Equipamento'}
          </span>
          {equipamento.locador_verificado && (
            <span className="bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-100 dark:border-emerald-800">
              <ShieldCheck size={12} /> Verificado
            </span>
          )}
        </div>
        <button
          onClick={toggleFav}
          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${
            isFav
              ? 'bg-red-500/20 text-red-500'
              : 'bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart size={18} strokeWidth={2} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="px-1 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {equipamento.nome}
            </h4>
          </div>
          {(equipamento.locador_reviews_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold ml-2 flex-shrink-0">
              <Star size={12} className="fill-current" />
              {(equipamento.locador_rating_average ?? 0).toFixed(1)}
            </div>
          )}
        </div>

        {/* Locador com link para loja */}
        {getLocadorDisplayName(equipamento) && (
          <Link
            to={`/loja/${equipamento.locador_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-slate-600 dark:text-slate-400 text-xs mb-1 flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-fit"
          >
            <Store size={11} />
            <span className="truncate max-w-[180px]">{getLocadorDisplayName(equipamento)}</span>
          </Link>
        )}

        {(equipamento.cidade || equipamento.uf) && (
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-2 flex items-center gap-1">
            <MapPin size={12} /> {equipamento.cidade}{equipamento.uf ? `, ${equipamento.uf}` : ''}
          </p>
        )}

        {/* Selos de Confiança */}
        <div className="mb-3">
          <TrustSealsRow
            vertical={(equipamento.vertical as VerticalKey) || 'construcao'}
            isVerified={equipamento.selo_verificado || equipamento.locador_verificado}
            oferecesOperador={equipamento.oferece_operador}
          />
        </div>

        {/* Footer: Price + Button */}
        <div className="mt-auto pt-3 border-t border-gray-50 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Diária</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">R$</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{equipamento.preco_diaria?.toFixed(0)?.replace('.', ',')}</span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 group-hover:bg-indigo-600 flex items-center justify-center text-slate-900 dark:text-white group-hover:text-white transition-all duration-300">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
