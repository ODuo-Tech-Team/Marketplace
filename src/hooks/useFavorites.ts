import { useState, useCallback } from 'react'

const FAVORITES_KEY = 'trakto_favorites'

function readFavIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch {
    return []
  }
}

export function useFavorites(equipamentoId: string) {
  const [isFav, setIsFav] = useState(() => readFavIds().includes(equipamentoId))

  const toggleFav = useCallback(() => {
    try {
      let ids = readFavIds()
      if (ids.includes(equipamentoId)) {
        ids = ids.filter(fid => fid !== equipamentoId)
        setIsFav(false)
      } else {
        ids.push(equipamentoId)
        setIsFav(true)
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
    } catch { /* ignore */ }
  }, [equipamentoId])

  return { isFav, toggleFav }
}

export function getFavoriteIds(): string[] {
  return readFavIds()
}

export function removeFavorite(id: string): string[] {
  const ids = readFavIds().filter(fid => fid !== id)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  return ids
}

export { FAVORITES_KEY }
