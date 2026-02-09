import { useState } from 'react'
import { Home, MessageSquare, FileText, Heart, User, Package, Clock, LogOut, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface BottomNavProps {
  mensagensNaoLidas?: number
  nomeUsuario?: string
  onSignOut?: () => void
}

export default function BottomNav({ mensagensNaoLidas = 0, nomeUsuario = 'Usuário', onSignOut }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const tabs = [
    { id: 'home', path: '/', icon: Home, label: 'Início' },
    { id: 'favorites', path: '/favoritos', icon: Heart, label: 'Favoritos' },
    { id: 'messages', path: '/chats', icon: MessageSquare, label: 'Chat', badge: mensagensNaoLidas },
    { id: 'orders', path: '/meus-pedidos', icon: FileText, label: 'Pedidos' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleSignOut = () => {
    setIsProfileMenuOpen(false)
    onSignOut?.()
  }

  const handleMenuItemClick = (path: string) => {
    setIsProfileMenuOpen(false)
    navigate(path)
  }

  return (
    <>
      {/* Overlay */}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}

      {/* Profile Menu Sheet */}
      {isProfileMenuOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1e] rounded-t-3xl z-50 lg:hidden animate-in slide-in-from-bottom duration-300"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold">{nomeUsuario}</p>
                <p className="text-xs text-gray-400">Minha conta</p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileMenuOpen(false)}
              className="p-3 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Meus Aluguéis (histórico do cliente) */}
            <button
              onClick={() => handleMenuItemClick('/meus-pedidos')}
              className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Meus Aluguéis</p>
                <p className="text-xs text-gray-400">Histórico de aluguéis</p>
              </div>
            </button>

            {/* Meus Pedidos */}
            <button
              onClick={() => handleMenuItemClick('/chats')}
              className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 bg-amber-600/20 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-amber-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Meus Pedidos</p>
                <p className="text-xs text-gray-400">Negociações em andamento</p>
              </div>
            </button>

            {/* Documentos (vai para pedidos com foco em contratos) */}
            <button
              onClick={() => handleMenuItemClick('/meus-pedidos')}
              className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Documentos</p>
                <p className="text-xs text-gray-400">Contratos e comprovantes</p>
              </div>
            </button>
          </div>

          {/* Sair */}
          <div className="px-5 pt-2 pb-4 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={18} />
              Sair da conta
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0a0a0a] backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-30 lg:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="h-16 flex justify-around items-center px-2">
          {tabs.map((tab) => {
            const active = isActive(tab.path)
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 relative active:scale-95"
              >
                {active && (
                  <div className="absolute top-0 w-10 h-1 bg-indigo-600 dark:bg-purple-500 rounded-b-full" />
                )}
                <div className={`relative p-2 rounded-xl transition-all ${active ? 'text-indigo-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <tab.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white dark:border-[#0a0a0a]">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}

          {/* Profile Button */}
          <button
            onClick={() => setIsProfileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 relative active:scale-95"
          >
            {isProfileMenuOpen && (
              <div className="absolute top-0 w-10 h-1 bg-indigo-600 dark:bg-purple-500 rounded-b-full" />
            )}
            <div className={`relative p-2 rounded-xl transition-all ${isProfileMenuOpen ? 'text-indigo-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
              <User size={22} strokeWidth={isProfileMenuOpen ? 2.5 : 1.5} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${isProfileMenuOpen ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              Perfil
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
