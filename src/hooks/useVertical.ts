import { useState, useCallback } from 'react'
import { type VerticalKey, DEFAULT_VERTICAL, getVerticalConfig } from '../config/verticals'

export function useVertical(initial: VerticalKey = DEFAULT_VERTICAL) {
  const [activeVertical, setActiveVertical] = useState<VerticalKey>(initial)

  const verticalConfig = getVerticalConfig(activeVertical)

  const switchVertical = useCallback((key: VerticalKey) => {
    setActiveVertical(key)
  }, [])

  return { activeVertical, verticalConfig, switchVertical }
}
