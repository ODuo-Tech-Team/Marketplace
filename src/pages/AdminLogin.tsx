import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Shield } from 'lucide-react'
import TraktoLogo from '../components/TraktoLogo'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Confirme seu email antes de entrar')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // Login bem sucedido - AdminGuard vai liberar o acesso
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        {/* Logo e Titulo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <TraktoLogo />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Shield className="w-6 h-6 text-foreground-secondary" />
            <p className="text-foreground-secondary text-lg font-medium">Acesso Administrativo</p>
          </div>
        </div>

        <div className="bg-surface-elevated rounded-2xl shadow-xl p-6 border border-border">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email - UX 35+ */}
            <div>
              <label
                htmlFor="email"
                className="block text-base font-semibold text-foreground-secondary mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 text-lg bg-surface-elevated border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-colors placeholder:text-foreground-muted"
                placeholder="admin@email.com"
                required
              />
            </div>

            {/* Senha - UX 35+ */}
            <div>
              <label
                htmlFor="password"
                className="block text-base font-semibold text-foreground-secondary mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 text-lg bg-surface-elevated border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-cta focus:border-cta outline-none transition-colors placeholder:text-foreground-muted"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-900/50 text-red-300 px-4 py-3 rounded-xl text-base font-medium border border-red-700">
                {error}
              </div>
            )}

            {/* Botao Entrar - Grande e destacado */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-cta-hover text-white text-xl font-bold rounded-xl hover:bg-cta-hover focus:ring-4 focus:ring-cta/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading && <Loader2 className="w-6 h-6 animate-spin" />}
              Entrar
            </button>
          </form>

          <p className="text-center text-foreground-muted text-sm mt-6">
            Acesso restrito a administradores autorizados
          </p>
        </div>
      </div>
    </div>
  )
}
