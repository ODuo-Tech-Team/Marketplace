import { useState, useRef, useCallback, useEffect } from 'react'

interface UseToastReturn {
  erro: string | null
  sucesso: string | null
  mostrarErro: (mensagem: string) => void
  mostrarSucesso: (mensagem: string) => void
  limparErro: () => void
  limparSucesso: () => void
}

export function useToast(): UseToastReturn {
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const erroTimeoutRef = useRef<number | null>(null)
  const sucessoTimeoutRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (erroTimeoutRef.current) clearTimeout(erroTimeoutRef.current)
      if (sucessoTimeoutRef.current) clearTimeout(sucessoTimeoutRef.current)
    }
  }, [])

  const mostrarErro = useCallback((mensagem: string) => {
    if (erroTimeoutRef.current) {
      clearTimeout(erroTimeoutRef.current)
    }
    setErro(mensagem)
    erroTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setErro(null)
      }
    }, 5000)
  }, [])

  const mostrarSucesso = useCallback((mensagem: string) => {
    if (sucessoTimeoutRef.current) {
      clearTimeout(sucessoTimeoutRef.current)
    }
    setSucesso(mensagem)
    sucessoTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setSucesso(null)
      }
    }, 4000)
  }, [])

  const limparErro = useCallback(() => setErro(null), [])
  const limparSucesso = useCallback(() => setSucesso(null), [])

  return {
    erro,
    sucesso,
    mostrarErro,
    mostrarSucesso,
    limparErro,
    limparSucesso
  }
}
