import { ArrowLeft, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Perfil() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const nomeUsuario = profile?.nome_empresa || profile?.full_name || 'Usuário'
  const emailUsuario = profile?.email || ''

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Mobile */}
      <div className="sticky top-0 z-40 bg-[#0f0f11]/90 dark:bg-[#0f0f11]/90 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide">Perfil</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-[1600px] mx-auto px-6 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil</h1>
        </div>
      </div>

      <div className="px-4 lg:max-w-[1600px] lg:mx-auto lg:px-6 pt-6">
        {/* User Card */}
        <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 dark:from-purple-900 dark:via-purple-800 dark:to-pink-900 rounded-2xl p-6 mb-6 shadow-xl shadow-purple-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg mb-1">{nomeUsuario}</h2>
              <p className="text-white/70 text-sm">{emailUsuario}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            signOut()
            navigate('/')
          }}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-red-500/20"
        >
          <LogOut size={20} />
          <span>Sair da Conta</span>
        </button>

        {/* App Info */}
        <p className="text-center text-slate-400 dark:text-gray-500 text-xs mt-8">
          Trakto Marketplace v1.0.0
        </p>
      </div>
    </div>
  )
}
