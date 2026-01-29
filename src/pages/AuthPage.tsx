import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2, Wrench, HardHat, ArrowLeft, Truck, CheckCircle, Mail, Building2, User } from 'lucide-react'

type PageView = 'landing' | 'login' | 'register' | 'forgot-password'
type TipoUsuario = 'locador' | 'locatario'

export default function AuthPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<PageView>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('locatario')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setNomeEmpresa('')
    setError(null)
    setResetEmailSent(false)
  }

  const handleStartRegister = (tipo: TipoUsuario) => {
    setTipoUsuario(tipo)
    resetForm()
    setView('register')
  }

  const handleGoToLogin = () => {
    resetForm()
    setView('login')
  }

  const handleBack = () => {
    resetForm()
    setView('landing')
  }

  const handleGoToForgotPassword = () => {
    setError(null)
    setResetEmailSent(false)
    setView('forgot-password')
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email.trim()) {
      setError('Digite seu email')
      setLoading(false)
      return
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (profileError || !profile) {
        setResetEmailSent(true)
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ solicitou_reset: true })
        .eq('id', profile.id)

      if (updateError) {
        setError('Erro ao processar solicitação. Tente novamente.')
        setLoading(false)
        return
      }

      setResetEmailSent(true)
      setLoading(false)
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email.trim() || !password) {
      setError('Preencha email e senha')
      setLoading(false)
      return
    }

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else if (loginError.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique sua caixa de entrada.')
        } else {
          setError(loginError.message)
        }
        setLoading(false)
        return
      }

      navigate('/')
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos obrigatórios')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            nome_empresa: nomeEmpresa.trim() || null,
            tipo_usuario: tipoUsuario
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.')
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          nome_empresa: nomeEmpresa.trim() || null,
          tipo_usuario: tipoUsuario,
          verificado: false
        })

        if (profileError) {
          console.error('[AuthPage] Erro ao criar perfil:', profileError)
        }
      }

      navigate('/')
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  // ========== LANDING PAGE - ESCOLHA DE PERFIL ==========
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="py-6 px-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Loca<span className="text-amber-500">Obra</span></span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-4xl">
            {/* Título */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                Bem-vindo ao <span className="text-amber-500">LocaObra</span>
              </h1>
              <p className="text-xl text-slate-600">
                O marketplace de equipamentos para construção civil
              </p>
            </div>

            {/* Cards de Escolha */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Card Locatário */}
              <button
                onClick={() => handleStartRegister('locatario')}
                className="group bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <HardHat className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Quero Alugar</h2>
                <p className="text-amber-100 text-lg mb-4">
                  Encontre equipamentos para sua obra
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span>Começar agora</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Card Locador */}
              <button
                onClick={() => handleStartRegister('locador')}
                className="group bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                  <Wrench className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Tenho Equipamentos</h2>
                <p className="text-slate-400 text-lg mb-4">
                  Anuncie e alugue seus equipamentos
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span>Começar agora</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Link Login */}
            <div className="text-center">
              <p className="text-slate-600">
                Já tem uma conta?{' '}
                <button
                  onClick={handleGoToLogin}
                  className="text-amber-600 hover:text-amber-700 font-semibold"
                >
                  Faça login
                </button>
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ========== TELA DE LOGIN ==========
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Truck className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Entrar no LocaObra</h1>
            <p className="text-slate-600 mt-2">Acesse sua conta para continuar</p>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Entrar
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleGoToForgotPassword}
                className="text-sm text-slate-500 hover:text-amber-600"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-slate-600">
              Não tem conta?{' '}
              <button onClick={handleBack} className="text-amber-600 hover:text-amber-700 font-semibold">
                Cadastre-se
              </button>
            </p>
            <button
              onClick={handleBack}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== TELA DE CADASTRO ==========
  if (view === 'register') {
    const isLocador = tipoUsuario === 'locador'

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${isLocador ? 'bg-slate-900' : 'bg-amber-500'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
              {isLocador ? <Wrench className="w-8 h-8 text-white" /> : <HardHat className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Criar conta como {isLocador ? 'Locador' : 'Locatário'}
            </h1>
            <p className="text-slate-600 mt-2">
              {isLocador ? 'Anuncie seus equipamentos' : 'Encontre equipamentos para sua obra'}
            </p>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="Seu nome"
                  required
                />
              </div>

              {isLocador && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Empresa</label>
                  <input
                    type="text"
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    placeholder="Nome da sua empresa (opcional)"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Senha *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 ${isLocador ? 'bg-slate-900 hover:bg-slate-800' : 'bg-amber-500 hover:bg-amber-600'} text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Criar conta
              </button>
            </form>
          </div>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-slate-600">
              Já tem conta?{' '}
              <button onClick={handleGoToLogin} className="text-amber-600 hover:text-amber-700 font-semibold">
                Faça login
              </button>
            </p>
            <button
              onClick={handleBack}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar e escolher outro tipo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== TELA DE RECUPERAR SENHA ==========
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
            <p className="text-slate-600 mt-2">
              Digite seu email para solicitar a recuperação
            </p>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            {resetEmailSent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Solicitação enviada!</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.
                </p>
                <button
                  onClick={handleGoToLogin}
                  className="w-full py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600"
                >
                  Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Enviar solicitação
                </button>
              </form>
            )}
          </div>

          {/* Link Voltar */}
          {!resetEmailSent && (
            <div className="mt-6 text-center">
              <button
                onClick={handleGoToLogin}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
