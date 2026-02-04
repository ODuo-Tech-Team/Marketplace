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
  // Flag para senha temporária (reset feito pelo admin)
  senha_temporaria?: boolean
  // Onboarding fields
  document_id?: string | null
  whatsapp?: string | null
  website_instagram?: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  // Função para atualizar senha e limpar flag de senha temporária
  atualizarSenha: (novaSenha: string) => Promise<{ success: boolean; error?: string }>
  // Função para recarregar profile
  recarregarProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        setProfile(null)
        return
      }

      if (!data) {
        setProfile(null)
        return
      }

      setProfile(data as Profile)
    } catch (err) {
      setProfile(null)
    }
  }

  useEffect(() => {
    let initialized = false

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          // Erro ao obter sessão
        } else if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        // Erro inesperado
      } finally {
        initialized = true
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        // Ignora eventos durante inicialização
        if (!initialized) {
          return
        }

        if (session?.user) {
          setUser(session.user)
          // Sempre busca o profile fresco do banco no login
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

  // Atualiza a senha do usuário e remove a flag de senha temporária
  const atualizarSenha = async (novaSenha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // 1. Atualiza a senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: novaSenha
      })

      if (authError) {
        // Traduz mensagens de erro do Supabase para português
        let errorMessage = authError.message

        // Se a senha não pode ser igual à anterior, significa que a senha já foi trocada
        // (usuário pode ter recarregado a página no meio do processo)
        // Nesse caso, limpa a flag e deixa o usuário continuar
        if (errorMessage.includes('different from the old password')) {
          // Limpa a flag no banco
          await supabase
            .from('profiles')
            .update({ senha_temporaria: false })
            .eq('id', user.id)
          // Atualiza o profile local
          if (profile) {
            setProfile({ ...profile, senha_temporaria: false })
          }
          // Retorna sucesso - o modal vai fechar
          return { success: true }
        } else if (errorMessage.includes('at least 6 characters')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres'
        } else if (errorMessage.includes('Password')) {
          errorMessage = 'Erro ao atualizar senha. Tente novamente.'
        }
        return { success: false, error: errorMessage }
      }

      // 2. Remove a flag de senha temporária no profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ senha_temporaria: false })
        .eq('id', user.id)

      if (profileError) {
        // Senha foi atualizada, mas flag não foi limpa - ainda é sucesso
      }

      // 3. Atualiza o profile local
      if (profile) {
        setProfile({ ...profile, senha_temporaria: false })
      }

      return { success: true }

    } catch (err) {
      return { success: false, error: 'Erro inesperado ao atualizar senha' }
    }
  }

  // Recarrega o profile do usuário atual
  const recarregarProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, atualizarSenha, recarregarProfile }}>
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
