import { Link } from 'react-router-dom'
import { Heart, ArrowRight, Star, MapPin, Crown, Sparkles, Store } from 'lucide-react'
import FotosCarrossel from './FotosCarrossel'
import { type Equipamento, isLinhaAmarela, getLocadorDisplayName } from '../contexts/AppContext'
import { TrustSealsRow } from './TrustSeal'
import type { VerticalKey } from '../config/verticals'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../contexts/AuthContext'
import { useLoginModal } from '../contexts/LoginModalContext'

interface PremiumProductCardProps {
  equipamento: Equipamento
  onClick: () => void
}

function deriveTags(eq: Equipamento): string[] {
  const tags: string[] = []
  if (eq.oferece_operador) tags.push('Operador Incluso')
  if (eq.voltagem) tags.push(eq.voltagem)
  if (eq.categoria && isLinhaAmarela(eq.categoria) && eq.ano) tags.push(`Ano ${eq.ano}`)
  if (eq.categoria && isLinhaAmarela(eq.categoria) && eq.peso_operacional) tags.push(`${eq.peso_operacional} ton`)
  return tags.slice(0, 3)
}

export default function PremiumProductCard({
  equipamento,
  onClick,
}: PremiumProductCardProps) {
  const tags = deriveTags(equipamento)
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

  // Locador PRO usa indigo/purple, destaque individual usa amber
  const isLocadorPro = equipamento.locador_destacado

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer group flex flex-col sm:flex-row relative"
    >
      {/* Gradient overlay for premium effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${
        isLocadorPro ? 'from-indigo-500/5' : 'from-amber-500/5'
      } via-transparent to-transparent pointer-events-none`} />

      {/* Borda esquerda destaque */}
      <div className={`hidden sm:block w-1.5 bg-gradient-to-b flex-shrink-0 ${
        isLocadorPro
          ? 'from-indigo-500 via-purple-500 to-violet-600'
          : 'from-amber-400 via-amber-500 to-orange-500'
      }`} />

      {/* Imagem Grande */}
      <div className="w-full sm:w-2/5 h-56 sm:h-auto relative flex-shrink-0">
        <FotosCarrossel
          fotos={equipamento.fotos}
          nomeEquipamento={equipamento.nome}
          heightClass="h-full"
        />

        {/* Badge - PRO para locador destacado, DESTAQUE para equipamento */}
        {isLocadorPro ? (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 z-10 shadow-lg shadow-indigo-600/30">
            <Sparkles size={14} fill="currentColor" /> PARCEIRO PRO
          </div>
        ) : (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 z-10 shadow-lg shadow-amber-500/30">
            <Crown size={14} fill="currentColor" /> DESTAQUE
          </div>
        )}
      </div>

      {/* Info Rica */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
              {equipamento.categoria || 'Equipamento'}
            </p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
              {equipamento.nome}
            </h3>
          </div>
          <button
            onClick={toggleFav}
            aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`p-2 rounded-full flex-shrink-0 ml-3 transition-colors ${
              isFav
                ? 'bg-red-500/20 text-red-500'
                : 'bg-gray-100 dark:bg-neutral-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500'
            }`}
          >
            <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map(tag => (
              <span key={tag} className="text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full border border-gray-200 dark:border-neutral-700">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Locador com link para loja */}
        {getLocadorDisplayName(equipamento) && (
          <Link
            to={`/loja/${equipamento.locador_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-slate-600 dark:text-slate-400 text-sm mb-1 flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-fit"
          >
            <Store size={13} />
            <span className="truncate max-w-[200px] font-medium">{getLocadorDisplayName(equipamento)}</span>
          </Link>
        )}

        {/* Location */}
        {(equipamento.cidade || equipamento.uf) && (
          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <MapPin size={14} /> {equipamento.cidade}{equipamento.uf ? `, ${equipamento.uf}` : ''}
          </div>
        )}

        {/* Rating */}
        {(equipamento.locador_reviews_count ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-sm text-amber-500 font-bold mb-3">
            <Star size={14} className="fill-current" />
            <span>{(equipamento.locador_rating_average ?? 0).toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({equipamento.locador_reviews_count})</span>
          </div>
        )}

        {/* Selos de Confiança */}
        <div className="mb-3">
          <TrustSealsRow
            vertical={(equipamento.vertical as VerticalKey) || 'construcao'}
            isVerified={equipamento.selo_verificado || equipamento.locador_verificado}
            oferecesOperador={equipamento.oferece_operador}
            size="md"
          />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-neutral-800">
          <div className="flex items-end justify-between gap-4 min-w-0">
            <div>
              <span className="text-xs text-slate-400 font-medium">Diária</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">R$</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {equipamento.preco_diaria?.toFixed(0)?.replace('.', ',')}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              Alugar Agora <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
