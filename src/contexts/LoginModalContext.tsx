import { createContext, useContext, useState, type ReactNode } from 'react'

interface LoginModalContextType {
  isOpen: boolean
  reason: string | null
  openLoginModal: (reason?: string) => void
  closeLoginModal: () => void
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined)

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)

  const openLoginModal = (reason?: string) => {
    setReason(reason || null)
    setIsOpen(true)
  }

  const closeLoginModal = () => {
    setIsOpen(false)
    setReason(null)
  }

  return (
    <LoginModalContext.Provider value={{ isOpen, reason, openLoginModal, closeLoginModal }}>
      {children}
    </LoginModalContext.Provider>
  )
}

export function useLoginModal() {
  const context = useContext(LoginModalContext)
  if (context === undefined) {
    throw new Error('useLoginModal must be used within a LoginModalProvider')
  }
  return context
}
