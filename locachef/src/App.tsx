import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import AuthPage from './pages/AuthPage'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import MeusEquipamentos from './pages/MeusEquipamentos'
// import ChatsPage from './pages/ChatsPage'
import ChatPage from './pages/ChatPage'
import ChatSplitPage from './pages/ChatSplitPage'
import Adm from './pages/Adm'
import AdminLogin from './pages/AdminLogin'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-slate-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-amber-600 animate-pulse">
          LocaObra
        </h1>
        <p className="text-gray-500 mt-4">Carregando...</p>

        {showFailsafe && (
          <button
            onClick={onForceEntry}
            className="mt-6 px-4 py-2 text-sm text-amber-600 hover:text-amber-700 underline"
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-500 animate-pulse">Verificando acesso...</h1>
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

function AppRoutes() {
  const { user, loading } = useAuth()
  const [forceEntry, setForceEntry] = useState(false)

  if (loading && !forceEntry) {
    return <SplashScreen onForceEntry={() => setForceEntry(true)} />
  }

  // Rota /admLoca é especial - usa AdminGuard que mostra login próprio se não autenticado
  // Para usuários normais: logado = PrivateRoutes, deslogado = PublicRoutes
  return (
    <Routes>
      {/* Rota admin com guard próprio - acessível sempre */}
      <Route path="/admLoca" element={<AdminGuard><Adm /></AdminGuard>} />

      {/* Demais rotas baseadas em autenticação */}
      {user ? (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meus-equipamentos" element={<MeusEquipamentos />} />
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
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
