import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'customer' | 'chef' | 'admin'
  created_at: string
  // Tipo de usuário para redirecionamento inteligente
  tipo_usuario?: 'locador' | 'locatario' | null
  // Dados da empresa/locadora (escalabilidade para múltiplas locadoras)
  nome_empresa?: string | null
  razao_social?: string | null
  // Campos de endereço para entrega
  cep?: string | null
  rua?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[Auth] Buscando profile para userId:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[Auth] Erro ao buscar profile:', error)
        setProfile(null)
        return
      }

      if (!data) {
        console.warn('[Auth] Profile não encontrado para userId:', userId)
        setProfile(null)
        return
      }

      console.log('[Auth] Profile carregado:', {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        tipo_usuario: data.tipo_usuario,
        nome_empresa: data.nome_empresa
      })
      setProfile(data as Profile)
    } catch (err) {
      console.error('[Auth] Erro inesperado ao buscar profile:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    let initialized = false

    const initAuth = async () => {
      try {
        console.log('[Auth] Iniciando verificação de sessão...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[Auth] Erro ao obter sessão:', error)
        } else if (session?.user) {
          console.log('[Auth] Usuário encontrado:', session.user.email)
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          console.log('[Auth] Nenhuma sessão ativa')
        }
      } catch (err) {
        console.error('[Auth] Erro inesperado:', err)
      } finally {
        console.log('[Auth] Inicialização concluída')
        initialized = true
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        // Ignora eventos durante inicialização
        if (!initialized) {
          console.log('[Auth] Ignorando evento durante inicialização')
          return
        }

        console.log('[Auth] Estado mudou:', _event)
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
