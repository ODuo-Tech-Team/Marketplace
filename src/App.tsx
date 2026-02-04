import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider, useApp } from './contexts/AppContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthPage from './pages/AuthPage'
import Home from './pages/Home'
import OwnerDashboard from './components/OwnerDashboard'
import MeusEquipamentos from './pages/MeusEquipamentos'
import ChatPage from './pages/ChatPage'
import ChatSplitPage from './pages/ChatSplitPage'
import Adm from './pages/Adm'
import AdminLogin from './pages/AdminLogin'
import ProductDetail from './pages/ProductDetail'
import MeusPedidos from './pages/MeusPedidos'
import Favoritos from './pages/Favoritos'
import BottomNav from './components/BottomNav'
import TraktoLogo from './components/TraktoLogo'
import { NotificationListener } from './components/NotificationListener'

// Emails autorizados para acesso administrativo
const ADMIN_EMAILS = [
  'mauricio.reis@oduo.com.br',
  'maumaureis0404@gmail.com' // mantém o antigo como backup
]

function SplashScreen({ onForceEntry }: { onForceEntry: () => void }) {
  const [showFailsafe, setShowFailsafe] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFailsafe(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="animate-pulse">
          <TraktoLogo size="lg" />
        </div>
        <p className="text-gray-500 mt-4">Carregando...</p>

        {showFailsafe && (
          <button
            onClick={onForceEntry}
            className="mt-6 px-4 py-2 text-sm text-cta hover:text-cta-hover underline"
          >
            Problemas ao carregar? Clique aqui para forçar a entrada
          </button>
        )}
      </div>
    </div>
  )
}

// Guard para rota administrativa - verifica se é o email autorizado
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cta animate-pulse">Verificando acesso...</h1>
        </div>
      </div>
    )
  }

  // Se não está logado, mostra tela de login admin
  if (!user) {
    return <AdminLogin />
  }

  // Se está logado mas não é um email autorizado, redireciona para Home
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/" replace />
  }

  // Acesso autorizado
  return <>{children}</>
}

// Wrapper que adiciona BottomNav nas rotas principais
function LayoutWithBottomNav({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { mensagensNaoLidas } = useApp()
  const { profile, signOut } = useAuth()

  // Verificar se é locador - eles têm seu próprio nav no OwnerDashboard
  const isLocador = profile?.tipo_usuario === 'locador'

  // Páginas que devem mostrar o BottomNav do CLIENTE (mobile only)
  // NÃO mostrar no dashboard do locador (ele tem seu próprio nav de 6 abas)
  const isLocadorPage = location.pathname === '/dashboard' || location.pathname === '/equipments'

  // Cliente BottomNav só aparece para clientes (não locadores) em rotas específicas
  const showBottomNav = !isLocador && !isLocadorPage && (
    ['/', '/meus-pedidos', '/favoritos'].includes(location.pathname) ||
    location.pathname.startsWith('/chats')
  )

  // Nome do usuário para exibir no menu de perfil
  const nomeUsuario = profile?.full_name || profile?.email?.split('@')[0] || 'Usuário'

  return (
    <>
      {children}
      {showBottomNav && (
        <BottomNav
          mensagensNaoLidas={mensagensNaoLidas}
          nomeUsuario={nomeUsuario}
          onSignOut={signOut}
        />
      )}
    </>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const [forceEntry, setForceEntry] = useState(false)

  if (loading && !forceEntry) {
    return <SplashScreen onForceEntry={() => setForceEntry(true)} />
  }

  // Rota /admLoca é especial - usa AdminGuard que mostra login próprio se não autenticado
  // Para usuários normais: logado = PrivateRoutes, deslogado = PublicRoutes
  return (
    <LayoutWithBottomNav>
      <Routes>
        {/* Rota admin com guard próprio - acessível sempre */}
        <Route path="/admLoca" element={<AdminGuard><Adm /></AdminGuard>} />

        {/* Demais rotas baseadas em autenticação */}
        {user ? (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/equipments" element={<OwnerDashboard />} />
            <Route path="/meus-equipamentos" element={<MeusEquipamentos />} />
            <Route path="/orders" element={<MeusPedidos />} />
            <Route path="/meus-pedidos" element={<MeusPedidos />} />
            <Route path="/favoritos" element={<Favoritos />} />
            {/* Chat estilo OLX: split-view desktop, tela cheia mobile */}
            <Route path="/chats" element={<ChatSplitPage />} />
            <Route path="/chats/:chatId" element={<ChatSplitPage />} />
            {/* Mantém rota antiga para compatibilidade */}
            <Route path="/chat/:chatId" element={<ChatPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        )}
      </Routes>
    </LayoutWithBottomNav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <NotificationListener />
            <AppRoutes />
            <Toaster
              position="top-center"
              expand={true}
              richColors
              closeButton
              duration={6000}
              theme="system"
              toastOptions={{
                classNames: {
                  toast: 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white',
                  title: 'text-slate-900 dark:text-white font-bold',
                  description: 'text-slate-600 dark:text-slate-300',
                  closeButton: 'bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700',
                },
              }}
            />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App
