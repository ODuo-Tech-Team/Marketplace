import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider, useApp } from './contexts/AppContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LoginModalProvider } from './contexts/LoginModalContext'
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
import Storefront from './pages/Storefront'
import StoreSettings from './pages/StoreSettings'
import BottomNav from './components/BottomNav'
import TraktoLogo from './components/TraktoLogo'
import { NotificationListener } from './components/NotificationListener'
import LoginModal from './components/LoginModal'

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

// Guard para rota administrativa - verifica role do perfil
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

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

  // Se está logado mas não tem role de admin, redireciona para Home
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Acesso autorizado
  return <>{children}</>
}

// Guard para rotas de locador - verifica tipo_usuario do perfil
function LocadorGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <TraktoLogo size="lg" />
          <p className="text-gray-500 mt-4">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não é locador, redireciona para Home (área do cliente)
  if (profile?.tipo_usuario !== 'locador') {
    return <Navigate to="/" replace />
  }

  // Acesso autorizado - é locador
  return <>{children}</>
}

// Wrapper que adiciona BottomNav nas rotas principais
function LayoutWithBottomNav({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { mensagensNaoLidas } = useApp()
  const { user, profile, signOut } = useAuth()

  // Verificar se é locador - eles têm seu próprio nav no OwnerDashboard
  const isLocador = profile?.tipo_usuario === 'locador'

  // Páginas que devem mostrar o BottomNav do CLIENTE (mobile only)
  // NÃO mostrar no dashboard do locador (ele tem seu próprio nav de 6 abas)
  const isLocadorPage = location.pathname === '/dashboard' || location.pathname === '/equipments'

  // Cliente BottomNav só aparece para clientes LOGADOS (não locadores) em rotas específicas
  // Usuários não logados não veem BottomNav - usam Header para entrar/cadastrar
  // NÃO mostrar em /chats - o chat tem seu próprio sistema de navegação e o BottomNav cobre o input
  const showBottomNav = user && !isLocador && !isLocadorPage &&
    !location.pathname.startsWith('/chats') &&
    !location.pathname.startsWith('/auth') &&
    !location.pathname.startsWith('/dashboard')

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
      {/* Login Modal - Disponível globalmente */}
      <LoginModal />
    </>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const [forceEntry, setForceEntry] = useState(false)

  if (loading && !forceEntry) {
    return <SplashScreen onForceEntry={() => setForceEntry(true)} />
  }

  // VITRINE PÚBLICA (Browse before Login):
  // - Home e ProductDetail são PÚBLICOS (acessíveis sem login)
  // - Outras rotas requerem autenticação
  return (
    <LayoutWithBottomNav>
      <Routes>
        {/* Rota admin com guard próprio - acessível sempre */}
        <Route path="/admLoca" element={<AdminGuard><Adm /></AdminGuard>} />

        {/* ROTAS PÚBLICAS - Acessíveis para todos (vitrine) */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/loja/:locadorId" element={<Storefront />} />
        <Route path="/store/:locadorId" element={<Storefront />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* ROTAS PROTEGIDAS - Requerem autenticação */}
        {user ? (
          <>
            {/* Rotas exclusivas do locador - protegidas por guard */}
            <Route path="/dashboard" element={<LocadorGuard><OwnerDashboard /></LocadorGuard>} />
            <Route path="/equipments" element={<LocadorGuard><OwnerDashboard /></LocadorGuard>} />
            <Route path="/meus-equipamentos" element={<LocadorGuard><MeusEquipamentos /></LocadorGuard>} />
            <Route path="/minha-loja" element={<LocadorGuard><StoreSettings /></LocadorGuard>} />
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
            {/* Redireciona rotas protegidas para Home (onde podem navegar livremente) */}
            <Route path="/chats/*" element={<Navigate to="/" replace />} />
            <Route path="/favoritos" element={<Navigate to="/" replace />} />
            <Route path="/meus-pedidos" element={<Navigate to="/" replace />} />
            <Route path="/orders" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
            <LoginModalProvider>
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
                  // Garante contraste em toasts de sucesso/erro/info
                  success: 'bg-green-600 dark:bg-green-700 text-white border-green-500 dark:border-green-600 [&>div]:text-white [&_svg]:text-white',
                  error: 'bg-red-600 dark:bg-red-700 text-white border-red-500 dark:border-red-600 [&>div]:text-white [&_svg]:text-white',
                  info: 'bg-blue-600 dark:bg-blue-700 text-white border-blue-500 dark:border-blue-600 [&>div]:text-white [&_svg]:text-white',
                  warning: 'bg-amber-500 dark:bg-amber-600 text-white border-amber-400 dark:border-amber-500 [&>div]:text-white [&_svg]:text-white',
                },
              }}
            />
            </LoginModalProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App
