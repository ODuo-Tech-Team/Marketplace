import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Building2, User, Phone, MapPin, Mail, Lock, Globe,
  CheckCircle2, ChevronRight, ArrowLeft, Loader2,
  Search, Store, Truck, Plus
} from 'lucide-react'
import { NICHES, getColorClasses } from '../config/niches'
import TraktoLogo from '../components/TraktoLogo'

// ===== TYPES =====

type FlowType = 'renter' | 'owner' | null

type ViewState =
  | 'decision'
  | 'login'
  | 'forgot-password'
  | 'renter-form'
  | 'renter-success'
  | 'owner-step1'
  | 'owner-step2'
  | 'owner-success'

// ===== COMPONENT =====

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { recarregarProfile } = useAuth()

  // Navigation
  const [view, setView] = useState<ViewState>('decision')

  // Handle mode from navigation state (from LoginModal/Header)
  useEffect(() => {
    const state = location.state as { mode?: 'login' | 'signup' } | null
    if (state?.mode === 'login') {
      setView('login')
    } else if (state?.mode === 'signup') {
      setView('decision')
    }
    // Clear the state to prevent re-triggering on refresh
    if (state?.mode) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])
  const [flowType, setFlowType] = useState<FlowType>(null)

  // Shared fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cidade, setCidade] = useState('')

  // Owner-only fields
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [websiteInstagram, setWebsiteInstagram] = useState('')
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  // ===== HANDLERS =====

  const handleRoleSelection = (role: FlowType) => {
    setFlowType(role)
    setError(null)
    setView(role === 'renter' ? 'renter-form' : 'owner-step1')
  }

  const goToDecision = () => {
    setFlowType(null)
    setError(null)
    setView('decision')
  }

  const goToLogin = () => {
    setError(null)
    setView('login')
  }

  const goToForgotPassword = () => {
    setError(null)
    setResetEmailSent(false)
    setView('forgot-password')
  }

  const toggleNiche = (id: string) => {
    setSelectedNiches(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    )
  }

  // ===== RENTER SIGNUP =====

  const handleRenterSignup = async () => {
    setLoading(true)
    setError(null)

    if (!fullName.trim() || !email.trim() || !password || !documentId.trim() || !whatsapp.trim() || !cidade.trim()) {
      setError('Preencha todos os campos obrigatórios (Nome, CPF/CNPJ, WhatsApp, Cidade, E-mail e Senha)')
      setLoading(false)
      return
    }
    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
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
            tipo_usuario: 'locatario'
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
          tipo_usuario: 'locatario',
          document_id: documentId.trim() || null,
          whatsapp: whatsapp.trim() || null,
          cidade: cidade.trim() || null,
          verificado: false
        })

        if (profileError) {
          console.error('[AuthPage] Erro ao criar perfil:', profileError)
        }
      }

      setView('renter-success')
      setLoading(false)
    } catch {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  // ===== OWNER SIGNUP =====

  const handleOwnerSignup = async () => {
    setLoading(true)
    setError(null)

    if (!fullName.trim() || !email.trim() || !password || !whatsapp.trim() || !nomeEmpresa.trim() || !cidade.trim()) {
      setError('Preencha todos os campos obrigatórios (Nome, WhatsApp, Locadora, Cidade, E-mail e Senha)')
      setLoading(false)
      return
    }
    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      setLoading(false)
      return
    }
    if (selectedNiches.length === 0) {
      setError('Selecione pelo menos uma área de atuação')
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
            tipo_usuario: 'locador'
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
        // Upsert profile
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          nome_empresa: nomeEmpresa.trim() || null,
          tipo_usuario: 'locador',
          document_id: documentId.trim() || null,
          whatsapp: whatsapp.trim() || null,
          cidade: cidade.trim() || null,
          website_instagram: websiteInstagram.trim() || null,
          verificado: false
        })

        if (profileError) {
          console.error('[AuthPage] Erro ao criar perfil:', profileError)
        }

        // Insert partner_verticals
        if (selectedNiches.length > 0) {
          const rows = selectedNiches.map(nicheId => ({
            partner_id: data.user!.id,
            vertical_id: nicheId
          }))
          const { error: vertError } = await supabase
            .from('partner_verticals')
            .insert(rows)

          if (vertError) {
            console.error('[AuthPage] Erro ao salvar nichos:', vertError)
          }
        }
      }

      setView('owner-success')
      setLoading(false)
    } catch {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  // ===== LOGIN =====

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

      // Verifica se o usuário é admin para redirecionar corretamente
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          // Aguarda o AuthContext atualizar o profile antes de navegar
          // Isso evita que o AdminGuard redirecione de volta para Home
          await recarregarProfile()
          navigate('/admLoca')
          return
        }
      }

      // Para usuários não-admin, também recarrega o profile para garantir sincronização
      await recarregarProfile()
      navigate('/')
    } catch {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  // ===== FORGOT PASSWORD =====

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

      await supabase
        .from('profiles')
        .update({ solicitou_reset: true })
        .eq('id', profile.id)

      setResetEmailSent(true)
      setLoading(false)
    } catch {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  // ===== SIDEBAR HELPERS =====

  const sidebarStepLabel = () => {
    if (view === 'decision') return 'Bem-vindo'
    if (view === 'login' || view === 'forgot-password') return 'Acesso'
    if (flowType === 'renter') return 'Para Clientes'
    return 'Para Parceiros'
  }

  const renderSidebarSteps = () => {
    if (view === 'decision' || view === 'login' || view === 'forgot-password') {
      return (
        <div className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          <p>A maior plataforma de locação de equipamentos do Brasil.</p>
          <br />
          <p>Conectamos quem precisa alugar com quem tem o equipamento certo.</p>
        </div>
      )
    }

    if (flowType === 'renter') {
      const currentStep = view === 'renter-form' ? 1 : 2
      return (
        <>
          <StepIndicator step={1} label="Cadastro Rápido" currentStep={currentStep} color="blue" />
          <StepIndicator step={2} label="Explorar Ofertas" currentStep={currentStep} color="blue" />
        </>
      )
    }

    // Owner
    const currentStep = view === 'owner-step1' ? 1 : view === 'owner-step2' ? 2 : 3
    return (
      <>
        <StepIndicator step={1} label="Dados da Empresa" currentStep={currentStep} color="blue" />
        <StepIndicator step={2} label="Suas Áreas" currentStep={currentStep} color="blue" />
      </>
    )
  }

  const glowColor = 'bg-indigo-500'
  const logoIconBg = 'bg-indigo-500'

  // ===== RENDER =====

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] flex items-center justify-center p-4 font-sans text-foreground">
      <div className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl shadow-indigo-500/5 overflow-hidden flex flex-col md:flex-row min-h-[500px] sm:min-h-[650px] border border-gray-100 dark:border-neutral-800">

        {/* ========== SIDEBAR ========== */}
        <div className="hidden md:flex w-1/3 bg-gray-50 dark:bg-neutral-800 p-10 flex-col justify-between relative overflow-hidden transition-all duration-500">
          {/* Glow */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[90px] opacity-20 -translate-y-1/2 translate-x-1/2 transition-colors duration-500 ${glowColor}`} />

          {/* Logo */}
          <div className="relative z-10">
            <div className="mb-2 cursor-pointer" onClick={goToDecision}>
              <TraktoLogo size="sm" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-widest uppercase ml-1">
              {sidebarStepLabel()}
            </p>
          </div>

          {/* Steps */}
          <div className="relative z-10 space-y-8">
            {renderSidebarSteps()}
          </div>

          <p className="text-slate-400 dark:text-slate-500 text-xs relative z-10">&copy; 2026 Trakto Inc.</p>
        </div>

        {/* ========== FORM AREA ========== */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white dark:bg-neutral-900 relative">

          {/* Botão Voltar */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 p-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 transition-colors z-10"
          >
            <ArrowLeft size={20} />
          </button>

          {/* ========== STEP 0: DECISION ========== */}
          {view === 'decision' && (
            <div className="h-full flex flex-col justify-center animate-in">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 text-center">
                Como você quer usar o TRAKTO?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-10">
                Escolha o seu perfil para continuar.
              </p>

              <div className="grid gap-6">
                {/* Quero Alugar */}
                <button
                  onClick={() => handleRoleSelection('renter')}
                  className="group relative p-6 rounded-2xl border-2 border-gray-100 dark:border-neutral-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left flex items-start gap-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-4 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Search size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                      Quero Alugar
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      Busco equipamentos para minha obra, evento, clínica ou empresa.
                    </p>
                  </div>
                  <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Tenho algo para Alugar */}
                <button
                  onClick={() => handleRoleSelection('owner')}
                  className="group relative p-6 rounded-2xl border-2 border-gray-100 dark:border-neutral-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left flex items-start gap-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-4 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Store size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                      Tenho algo para Alugar
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      Quero cadastrar minha locadora e meus equipamentos para receber pedidos.
                    </p>
                  </div>
                  <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <div className="mt-12 text-center text-sm text-slate-500">
                Já tem conta?{' '}
                <button onClick={goToLogin} className="text-slate-900 dark:text-white font-bold hover:text-indigo-600 dark:hover:text-indigo-400">
                  Fazer Login
                </button>
              </div>
            </div>
          )}

          {/* ========== LOGIN ========== */}
          {view === 'login' && (
            <div className="max-w-md mx-auto space-y-6 slide-in-right pt-8">
              <div>
                <button
                  onClick={goToDecision}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-4 flex items-center gap-1 text-sm font-bold"
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Entrar na sua conta</h2>
                <p className="text-slate-500 dark:text-slate-400">Use seu email e senha para acessar.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <InputField
                  icon={<Mail size={18} className="text-foreground-muted" />}
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={setEmail}
                  ringColor="focus-within:ring-indigo-500"
                  name="email"
                  autoComplete="email"
                />
                <InputField
                  icon={<Lock size={18} className="text-foreground-muted" />}
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  ringColor="focus-within:ring-indigo-500"
                  name="password"
                  autoComplete="current-password"
                />

                {error && <ErrorBanner message={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                  Entrar
                </button>
              </form>

              <div className="text-center text-sm">
                <button onClick={goToForgotPassword} className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Esqueceu sua senha?
                </button>
              </div>

              <div className="text-center text-sm text-slate-500 pt-4 border-t border-gray-100 dark:border-neutral-700">
                Não tem conta?{' '}
                <button onClick={goToDecision} className="text-slate-900 dark:text-white font-bold hover:text-indigo-600 dark:hover:text-indigo-400">
                  Cadastre-se
                </button>
              </div>
            </div>
          )}

          {/* ========== FORGOT PASSWORD ========== */}
          {view === 'forgot-password' && (
            <div className="max-w-md mx-auto space-y-6 slide-in-right pt-8">
              <div>
                <button
                  onClick={goToLogin}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-4 flex items-center gap-1 text-sm font-bold"
                >
                  <ArrowLeft size={16} /> Voltar ao login
                </button>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Recuperar senha</h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Digite seu email para solicitar a recuperação.
                </p>
              </div>

              {resetEmailSent ? (
                <div className="text-center py-8 zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Solicitação enviada!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.
                  </p>
                  <button
                    onClick={goToLogin}
                    className="w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors"
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <InputField
                    icon={<Mail size={18} className="text-foreground-muted" />}
                    label="E-mail"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={setEmail}
                    ringColor="focus-within:ring-indigo-500"
                  />

                  {error && <ErrorBanner message={error} />}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                    Enviar solicitação
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========== FLOW A: RENTER FORM ========== */}
          {view === 'renter-form' && (
            <div className="max-w-md mx-auto space-y-6 slide-in-right pt-8">
              <div>
                <button
                  onClick={goToDecision}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-4 flex items-center gap-1 text-sm font-bold"
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  Criar conta para alugar
                </h2>
                <p className="text-slate-500 dark:text-slate-400">Dados rápidos para você acessar as ofertas.</p>
              </div>

              <div className="space-y-4">
                <InputField
                  icon={<User size={18} className="text-foreground-muted" />}
                  label="Seu Nome *"
                  placeholder="Nome Completo"
                  value={fullName}
                  onChange={setFullName}
                  ringColor="focus-within:ring-indigo-500"
                />
                <InputField
                  icon={<Mail size={18} className="text-foreground-muted" />}
                  label="CPF ou CNPJ *"
                  placeholder="Apenas números"
                  value={documentId}
                  onChange={setDocumentId}
                  ringColor="focus-within:ring-indigo-500"
                />
                <InputField
                  icon={<Phone size={18} className="text-foreground-muted" />}
                  label="WhatsApp *"
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={setWhatsapp}
                  ringColor="focus-within:ring-indigo-500"
                />
                <InputField
                  icon={<MapPin size={18} className="text-foreground-muted" />}
                  label="Sua Cidade *"
                  placeholder="Ex: Campinas, SP"
                  value={cidade}
                  onChange={setCidade}
                  ringColor="focus-within:ring-indigo-500"
                />

                {/* Credenciais */}
                <div className="pt-4 border-t border-gray-100 dark:border-neutral-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-3">Login</p>
                  <div className="space-y-3">
                    <InputField
                      icon={<Mail size={18} className="text-foreground-muted" />}
                      type="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={setEmail}
                      ringColor="focus-within:ring-indigo-500"
                    />
                    <InputField
                      icon={<Lock size={18} className="text-foreground-muted" />}
                      type="password"
                      placeholder="Senha (mín. 8 caracteres)"
                      value={password}
                      onChange={setPassword}
                      ringColor="focus-within:ring-indigo-500"
                    />
                    <PasswordStrengthIndicator password={password} />
                  </div>
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button
                onClick={handleRenterSignup}
                disabled={loading}
                className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 mt-4 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                Ver Equipamentos Disponíveis <ChevronRight size={18} />
              </button>

              <div className="text-center text-sm text-slate-500">
                Já tem conta?{' '}
                <button onClick={goToLogin} className="text-slate-900 dark:text-white font-bold hover:text-indigo-600 dark:hover:text-indigo-400">
                  Fazer Login
                </button>
              </div>
            </div>
          )}

          {/* ========== FLOW A: RENTER SUCCESS ========== */}
          {view === 'renter-success' && (
            <div className="h-full flex flex-col items-center justify-center text-center zoom-in-95">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 mx-auto shadow-sm">
                <Search size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Tudo pronto!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                Vamos te mostrar os melhores equipamentos disponíveis em{' '}
                <strong className="text-slate-900 dark:text-white">{cidade || 'sua região'}</strong>.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:scale-105 transition-all"
              >
                Ir para o Marketplace
              </button>
            </div>
          )}

          {/* ========== FLOW B: OWNER STEP 1 ========== */}
          {view === 'owner-step1' && (
            <div className="max-w-xl mx-auto space-y-6 slide-in-right pt-4">
              <div>
                <button
                  onClick={goToDecision}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-4 flex items-center gap-1 text-sm font-bold"
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Cadastro de Parceiro</h2>
                <p className="text-slate-500 dark:text-slate-400">Cadastre sua locadora e expanda seu negócio.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    icon={<User size={18} className="text-slate-400" />}
                    label="Seu Nome *"
                    placeholder="Nome Completo"
                    value={fullName}
                    onChange={setFullName}
                    bgClass="bg-gray-50 dark:bg-neutral-800"
                    ringColor="focus-within:ring-indigo-500"
                  />
                  <InputField
                    icon={<Phone size={18} className="text-slate-400" />}
                    label="WhatsApp *"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={setWhatsapp}
                    bgClass="bg-gray-50 dark:bg-neutral-800"
                    ringColor="focus-within:ring-indigo-500"
                  />
                </div>

                <InputField
                  icon={<Building2 size={18} className="text-slate-400" />}
                  label="Nome da Locadora *"
                  placeholder="Ex: Silva Locações"
                  value={nomeEmpresa}
                  onChange={setNomeEmpresa}
                  bgClass="bg-gray-50 dark:bg-neutral-800"
                  ringColor="focus-within:ring-indigo-500"
                />

                <InputField
                  icon={<MapPin size={18} className="text-slate-400" />}
                  label="Cidade Base *"
                  placeholder="Ex: Campinas, SP"
                  value={cidade}
                  onChange={setCidade}
                  bgClass="bg-gray-50 dark:bg-neutral-800"
                  ringColor="focus-within:ring-indigo-500"
                />

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 flex justify-between">
                    <span>Site ou Instagram</span>
                    <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">Opcional</span>
                  </label>
                  <div className="flex items-center gap-3 border border-gray-200 dark:border-neutral-700 rounded-xl p-3 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-neutral-900 mt-1">
                    <Globe size={18} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="@sua.locadora"
                      className="w-full bg-transparent outline-none font-medium text-slate-900 dark:text-white text-sm placeholder:text-slate-400"
                      value={websiteInstagram}
                      onChange={(e) => setWebsiteInstagram(e.target.value)}
                    />
                  </div>
                </div>

                {/* Credenciais */}
                <div className="pt-4 border-t border-gray-100 dark:border-neutral-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-3">Login</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 border border-gray-200 dark:border-neutral-700 rounded-xl p-3 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-neutral-900">
                      <Mail size={18} className="text-slate-400" />
                      <input
                        type="email"
                        placeholder="E-mail"
                        className="w-full bg-transparent outline-none font-medium text-slate-900 dark:text-white text-sm placeholder:text-slate-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-3 border border-gray-200 dark:border-neutral-700 rounded-xl p-3 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-neutral-900">
                      <Lock size={18} className="text-slate-400" />
                      <input
                        type="password"
                        placeholder="Senha (mín. 8 caracteres)"
                        className="w-full bg-transparent outline-none font-medium text-slate-900 dark:text-white text-sm placeholder:text-slate-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button
                onClick={() => {
                  if (!fullName.trim() || !whatsapp.trim() || !nomeEmpresa.trim() || !cidade.trim() || !email.trim() || !password) {
                    setError('Preencha todos os campos obrigatórios antes de continuar')
                    return
                  }
                  const pwErr = validatePassword(password)
                  if (pwErr) {
                    setError(pwErr)
                    return
                  }
                  setError(null)
                  setView('owner-step2')
                }}
                className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:-translate-y-1"
              >
                Próximo: Escolher Áreas <ChevronRight size={18} />
              </button>

              <div className="text-center text-sm text-slate-500">
                Já tem conta?{' '}
                <button onClick={goToLogin} className="text-slate-900 dark:text-white font-bold hover:text-indigo-600 dark:hover:text-indigo-400">
                  Fazer Login
                </button>
              </div>
            </div>
          )}

          {/* ========== FLOW B: OWNER STEP 2 (NICHES) ========== */}
          {view === 'owner-step2' && !loading && (
            <div className="max-w-4xl mx-auto h-full flex flex-col slide-in-right">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setView('owner-step1')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <ArrowLeft className="text-slate-400" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">O que compõe sua frota?</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Selecione todas as categorias que você atende.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {NICHES.map((niche) => {
                    const isSelected = selectedNiches.includes(niche.id)
                    const Icon = niche.icon
                    return (
                      <button
                        key={niche.id}
                        onClick={() => toggleNiche(niche.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] flex items-center gap-3 group ${getColorClasses(niche.color, isSelected)}`}
                      >
                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-neutral-800 group-hover:bg-gray-200 dark:group-hover:bg-neutral-700'}`}>
                          <Icon size={24} />
                        </div>
                        <span className="font-bold text-sm leading-tight">{niche.label}</span>
                        {isSelected && <CheckCircle2 size={18} className="ml-auto opacity-50" />}
                      </button>
                    )
                  })}
                  <button className="p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-500 flex items-center justify-center gap-2 font-bold text-sm transition-colors">
                    <Plus size={18} /> Outra Categoria
                  </button>
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <div className="pt-6 border-t border-gray-100 dark:border-neutral-700 mt-auto flex justify-between items-center">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {selectedNiches.length} {selectedNiches.length === 1 ? 'área selecionada' : 'áreas selecionadas'}
                </p>
                <button
                  onClick={handleOwnerSignup}
                  disabled={selectedNiches.length === 0}
                  className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                    selectedNiches.length === 0
                      ? 'bg-gray-100 dark:bg-neutral-800 text-slate-400 dark:text-slate-500'
                      : 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 dark:hover:bg-indigo-500'
                  }`}
                >
                  Finalizar Cadastro <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ========== FLOW B: OWNER LOADING ========== */}
          {view === 'owner-step2' && loading && (
            <div className="h-full flex flex-col items-center justify-center fade-in text-center">
              <Loader2 size={48} className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Criando seu perfil...</h3>
            </div>
          )}

          {/* ========== FLOW B: OWNER SUCCESS ========== */}
          {view === 'owner-success' && (
            <div className="h-full flex flex-col items-center justify-center zoom-in-95 text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 mx-auto shadow-sm">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Bem-vindo ao TRAKTO!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                Conta criada com sucesso. Seu painel de gestão para{' '}
                <strong className="text-slate-900 dark:text-white">{selectedNiches.length} {selectedNiches.length === 1 ? 'área' : 'áreas'}</strong> está pronto.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:scale-105 transition-all"
              >
                Acessar Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ===== SUB-COMPONENTS =====

function StepIndicator({ step, label, currentStep, color }: {
  step: number
  label: string
  currentStep: number
  color: 'blue'
}) {
  const isActive = currentStep === step
  const isDone = currentStep > step
  const bgActive = 'bg-indigo-500 border-indigo-500'

  return (
    <div className={`flex items-center gap-4 transition-opacity ${isActive || isDone ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
        isActive || isDone ? `${bgActive} text-white` : 'border-gray-200 dark:border-neutral-600 text-slate-500'
      }`}>
        {isDone ? <CheckCircle2 size={16} /> : step}
      </div>
      <div className="text-slate-900 dark:text-white">
        <p className="font-bold text-sm">{label}</p>
      </div>
    </div>
  )
}

function InputField({ icon, label, type = 'text', placeholder, value, onChange, bgClass = 'bg-white dark:bg-neutral-900', ringColor = 'focus-within:ring-indigo-500', name, autoComplete }: {
  icon: React.ReactNode
  label?: string
  type?: string
  placeholder: string
  value: string
  onChange: (val: string) => void
  bgClass?: string
  ringColor?: string
  name?: string
  autoComplete?: string
}) {
  const inputId = name || label?.toLowerCase().replace(/[^a-z0-9]/g, '-') || undefined
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">{label}</label>
      )}
      <div className={`flex items-center gap-3 border border-gray-200 dark:border-neutral-700 rounded-xl p-3 focus-within:ring-2 ${ringColor} ${bgClass} ${label ? 'mt-1' : ''}`}>
        {icon}
        <input
          id={inputId}
          name={name || inputId}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={label || placeholder}
          className="w-full bg-transparent outline-none font-bold text-slate-900 dark:text-white text-sm placeholder:text-slate-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
      {message}
    </div>
  )
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'A senha deve ter no mínimo 8 caracteres'
  if (!/[A-Z]/.test(pw)) return 'A senha deve conter pelo menos 1 letra maiúscula'
  if (!/[0-9]/.test(pw)) return 'A senha deve conter pelo menos 1 número'
  return null
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null

  const checks = [
    { label: '8+ caracteres', met: password.length >= 8 },
    { label: '1 maiúscula', met: /[A-Z]/.test(password) },
    { label: '1 número', met: /[0-9]/.test(password) },
  ]

  const metCount = checks.filter(c => c.met).length
  const barColor = metCount === 3 ? 'bg-emerald-500' : metCount >= 2 ? 'bg-amber-500' : 'bg-red-400'
  const barWidth = `${(metCount / 3) * 100}%`

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: barWidth }} />
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(({ label, met }) => (
          <span key={label} className={`text-xs font-medium ${met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {met ? '\u2713' : '\u25CB'} {label}
          </span>
        ))}
      </div>
    </div>
  )
}
