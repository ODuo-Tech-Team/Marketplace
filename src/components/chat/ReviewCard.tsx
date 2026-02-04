import { useState, useEffect } from 'react'
import { Star, CheckCircle2, Loader2, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

interface ReviewCardProps {
  rentalId: string
  reviewerId: string
  targetId: string
  locadorNome: string
}

export default function ReviewCard({ rentalId, reviewerId, targetId, locadorNome }: ReviewCardProps) {
  const { submitReview, checkReviewExists } = useApp()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    checkReviewExists(rentalId).then(exists => setAlreadyReviewed(exists))
  }, [rentalId, checkReviewExists])

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setAlreadyReviewed(true) // This will make the component return null
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [submitted])

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return
    setError('')
    setSubmitting(true)
    try {
      const result = await submitReview(rentalId, reviewerId, targetId, rating, comment)
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error || 'Erro ao enviar avaliação')
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  // Loading check
  if (alreadyReviewed === null) return null
  // Already reviewed or dismissed - don't render
  if (alreadyReviewed || dismissed) return null

  // Success state - brief message before hiding
  if (submitted) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-6 rounded-3xl text-center animate-in fade-in duration-300">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">Obrigado!</h3>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">Sua avaliação ajuda a comunidade.</p>
      </div>
    )
  }

  // Review form - Lovable theme
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl shadow-indigo-500/5 border border-gray-100 dark:border-neutral-800 overflow-hidden relative">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 dark:bg-neutral-800/80 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
        title="Fechar"
      >
        <X size={16} className="text-slate-400" />
      </button>

      {/* Header Gradiente */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white text-center">
        <div className="w-12 h-12 bg-white rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">
          <Star size={20} className="text-indigo-600" />
        </div>
        <h3 className="font-bold text-lg leading-tight">Como foi sua experiência?</h3>
        <p className="text-xs text-white/90 font-medium">Avalie {locadorNome}</p>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Estrelas Interativas */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 focus:scale-90"
            >
              <Star
                size={32}
                fill={(hoverRating || rating) >= star ? '#f97316' : 'none'}
                className={(hoverRating || rating) >= star ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600'}
                strokeWidth={2}
              />
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          placeholder="O equipamento funcionou bem? O atendimento foi bom?"
          className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none mb-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Error */}
        {error && (
          <p className="text-red-500 dark:text-red-400 text-xs font-medium mb-3 text-center">{error}</p>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
            ${rating === 0 || submitting
              ? 'bg-slate-300 dark:bg-neutral-700 cursor-not-allowed'
              : 'bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 shadow-indigo-500/20'}`}
        >
          {submitting ? (
            <><Loader2 size={18} className="animate-spin" /> Enviando...</>
          ) : (
            'Enviar Avaliação'
          )}
        </button>

        {/* Skip link */}
        <button
          onClick={handleDismiss}
          className="w-full mt-3 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
        >
          Avaliar depois
        </button>
      </div>
    </div>
  )
}
