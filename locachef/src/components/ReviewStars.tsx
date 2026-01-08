import { Star } from 'lucide-react'

interface ReviewStarsProps {
  rating: number
  totalReviews?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

export default function ReviewStars({
  rating,
  totalReviews = 0,
  size = 'sm',
  showCount = true
}: ReviewStarsProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <Star
          key={i}
          className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400`}
        />
      )
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <div key={i} className="relative">
          <Star className={`${sizeClasses[size]} text-gray-300`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400`} />
          </div>
        </div>
      )
    } else {
      stars.push(
        <Star
          key={i}
          className={`${sizeClasses[size]} text-gray-300`}
        />
      )
    }
  }

  if (totalReviews === 0) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`${sizeClasses[size]} text-gray-300`} />
          ))}
        </div>
        {showCount && (
          <span className={`${textSizeClasses[size]} text-gray-400`}>
            Sem avaliações
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      {showCount && (
        <span className={`${textSizeClasses[size]} text-gray-500`}>
          {rating.toFixed(1)} ({totalReviews})
        </span>
      )}
    </div>
  )
}
