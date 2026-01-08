import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2, Wrench, HardHat, ArrowLeft, Construction, CheckCircle, Mail } from 'lucide-react'

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
    // Mantém o email se já estiver preenchido
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
      // Busca o usuário pelo email na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (profileError || !profile) {
        // Se não encontrar, mostra mensagem genérica (segurança)
        setResetEmailSent(true)
        setLoading(false)
        return
      }

      // Atualiza solicitou_reset = true no perfil do usuário
      // O ADM irá disparar o email de reset manualmente
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ solicitou_reset: true })
        .eq('id', profile.id)

      if (updateError) {
        console.error('[AuthPage] Erro ao solicitar reset:', updateError)
        setError('Erro ao processar solicitação. Tente novamente.')
        setLoading(false)
        return
      }

      setResetEmailSent(true)
      setLoading(false)
    } catch (err) {
      console.error('[AuthPage] Erro inesperado:', err)
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
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

    // Busca o perfil para saber o tipo de usuário e redirecionar
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tipo_usuario')
        .eq('id', data.user.id)
        .single()

      // Redirecionamento inteligente
      if (profile?.tipo_usuario === 'locador') {
        navigate('/meus-equipamentos')
      } else {
        navigate('/')
      }
    }

    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!fullName.trim()) {
      setError('Nome completo é obrigatório')
      setLoading(false)
      return
    }

    // VERSÃO PERFEITA: Cadastro direto sem confirmação de email
    // Cria o usuário com metadata do tipo
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          tipo_usuario: tipoUsuario,
        },
        // Não exige confirmação de email - login automático
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado. Faça login.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // VERSÃO FINAL: Atualiza o perfil com full_name, tipo_usuario E nome_empresa
    if (data.user) {
      // Upsert para garantir que o perfil existe e está correto
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          tipo_usuario: tipoUsuario,
          nome_empresa: nomeEmpresa.trim() || null
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('[AuthPage] Erro ao salvar perfil:', profileError)
        // Continua mesmo com erro - o trigger pode ter criado
      }

      // VERSÃO PERFEITA: Login automático - vai direto para Home/MeusEquipamentos
      if (tipoUsuario === 'locador') {
        // Locador vai para tela de anunciar equipamento
        navigate('/meus-equipamentos?novo=1')
      } else {
        // Locatário vai para Home ver os anúncios
        navigate('/')
      }
    }

    setLoading(false)
  }

  // ========== LANDING PAGE ==========
  if (view === 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-slate-100 to-zinc-200 p-4">
        <div className="w-full max-w-lg text-center">
          {/* Logo e Título Principal */}
          <div className="mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Construction className="w-16 h-16 text-amber-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3">
              LocaObra
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Aluguel de Máquinas Pesadas
            </p>
          </div>

          {/* Botões de Ação Principais - UX 35+ */}
          <div className="space-y-4 mb-8">
            {/* Botão Locatário */}
            <button
              onClick={() => handleStartRegister('locatario')}
              className="w-full py-5 px-6 bg-amber-600 text-white text-xl font-bold rounded-2xl hover:bg-amber-700 focus:ring-4 focus:ring-amber-300 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-4"
            >
              <HardHat className="w-8 h-8" />
              <span>Quero Alugar uma Máquina</span>
            </button>

            {/* Botão Locador */}
            <button
              onClick={() => handleStartRegister('locador')}
              className="w-full py-5 px-6 bg-slate-700 text-white text-xl font-bold rounded-2xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-300 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-4"
            >
              <Wrench className="w-8 h-8" />
              <span>Tenho Máquina para Alugar</span>
            </button>
          </div>

          {/* Link discreto para Login */}
          <button
            onClick={handleGoToLogin}
            className="text-gray-500 hover:text-amber-600 text-lg font-medium underline underline-offset-4 transition-colors"
          >
            Já tenho conta? Entrar
          </button>
        </div>
      </div>
    )
  }

  // ========== LOGIN PAGE ==========
  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-zinc-200 p-4">
        <div className="w-full max-w-md">
          {/* Voltar */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-6 text-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Construction className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-amber-600">LocaObra</h1>
            <p className="text-gray-600 mt-1 text-lg">Entrar na sua conta</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-base font-semibold text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {/* Senha */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-base font-semibold text-gray-700 mb-2"
                >
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              {/* Erro */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-base font-medium border border-red-200">
                  {error}
                </div>
              )}

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-600 text-white text-xl font-bold rounded-xl hover:bg-amber-700 focus:ring-4 focus:ring-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading && <Loader2 className="w-6 h-6 animate-spin" />}
                Entrar
              </button>
            </form>

            {/* Link Esqueci minha senha */}
            <div className="mt-4 text-center">
              <button
                onClick={handleGoToForgotPassword}
                className="text-gray-500 hover:text-amber-600 text-base font-medium transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== FORGOT PASSWORD PAGE ==========
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-zinc-200 p-4">
        <div className="w-full max-w-md">
          {/* Voltar */}
          <button
            onClick={handleGoToLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-6 text-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para Login</span>
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Construction className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-amber-600">LocaObra</h1>
            <p className="text-gray-600 mt-1 text-lg">Recuperar senha</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            {resetEmailSent ? (
              // Sucesso - Email enviado
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-100 rounded-full">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Solicitação enviada!
                </h2>
                <p className="text-gray-600 text-lg mb-6">
                  Sua solicitação foi registrada para <strong className="text-gray-800">{email}</strong>.
                </p>
                <p className="text-gray-500 text-base mb-6">
                  O administrador irá enviar um link de recuperação em breve.
                </p>
                <button
                  onClick={handleGoToLogin}
                  className="w-full py-4 bg-amber-600 text-white text-xl font-bold rounded-xl hover:bg-amber-700 transition-colors"
                >
                  Voltar para Login
                </button>
              </div>
            ) : (
              // Formulário de recuperação
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-amber-100 rounded-full">
                      <Mail className="w-8 h-8 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 text-base">
                    Digite seu email e enviaremos um link para você criar uma nova senha.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-base font-semibold text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    placeholder="seu@email.com"
                    required
                    autoFocus
                  />
                </div>

                {/* Erro */}
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-base font-medium border border-red-200">
                    {error}
                  </div>
                )}

                {/* Botão Enviar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-amber-600 text-white text-xl font-bold rounded-xl hover:bg-amber-700 focus:ring-4 focus:ring-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading && <Loader2 className="w-6 h-6 animate-spin" />}
                  Enviar Link de Recuperação
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ========== REGISTER PAGE ==========
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-zinc-200 p-4">
      <div className="w-full max-w-md">
        {/* Voltar */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-6 text-lg font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        {/* Logo e indicação do tipo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Construction className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-amber-600">LocaObra</h1>
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-base font-semibold">
            {tipoUsuario === 'locador' ? (
              <>
                <Wrench className="w-5 h-5" />
                <span>Cadastro de Locador</span>
              </>
            ) : (
              <>
                <HardHat className="w-5 h-5" />
                <span>Cadastro de Locatário</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nome */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-base font-semibold text-gray-700 mb-2"
              >
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                placeholder="Seu nome completo"
                required
              />
            </div>

            {/* Nome da Empresa (apenas para Locador) */}
            {tipoUsuario === 'locador' && (
              <div>
                <label
                  htmlFor="nomeEmpresa"
                  className="block text-base font-semibold text-gray-700 mb-2"
                >
                  Nome da Empresa (opcional)
                </label>
                <input
                  id="nomeEmpresa"
                  type="text"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  placeholder="Ex: Construções Silva Ltda"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-base font-semibold text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-base font-semibold text-gray-700 mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-base font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* Botão Criar Conta */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-600 text-white text-xl font-bold rounded-xl hover:bg-amber-700 focus:ring-4 focus:ring-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading && <Loader2 className="w-6 h-6 animate-spin" />}
              Criar Conta
            </button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center">
            <button
              onClick={handleGoToLogin}
              className="text-gray-500 hover:text-amber-600 text-base font-medium transition-colors"
            >
              Já tem conta? <span className="underline">Entrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
