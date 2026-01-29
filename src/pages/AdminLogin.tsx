import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Shield, HardHat } from 'lucide-react'

const ADMIN_EMAILS = [
  'mauricio.reis@oduo.com.br',
  'maumaureis0404@gmail.com'
]

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Verifica se o email é de admin antes mesmo de tentar logar
    if (!ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      setError('Acesso negado. Este email não possui permissão de administrador.')
      setLoading(false)
      return
    }

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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HardHat className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-amber-500">LocaObra</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Shield className="w-6 h-6 text-slate-400" />
            <p className="text-slate-400 text-lg font-medium">Acesso Administrativo</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email - UX 35+ */}
            <div>
              <label
                htmlFor="email"
                className="block text-base font-semibold text-slate-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 text-lg bg-slate-700 border-2 border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors placeholder-slate-400"
                placeholder="admin@email.com"
                required
              />
            </div>

            {/* Senha - UX 35+ */}
            <div>
              <label
                htmlFor="password"
                className="block text-base font-semibold text-slate-300 mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 text-lg bg-slate-700 border-2 border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors placeholder-slate-400"
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

            {/* Botão Entrar - Grande e destacado */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-600 text-white text-xl font-bold rounded-xl hover:bg-amber-700 focus:ring-4 focus:ring-amber-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading && <Loader2 className="w-6 h-6 animate-spin" />}
              Entrar
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Acesso restrito a administradores autorizados
          </p>
        </div>
      </div>
    </div>
  )
}
