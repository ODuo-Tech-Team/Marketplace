import { useNavigate } from 'react-router-dom'
import { X, User, LogIn, UserPlus } from 'lucide-react'
import { useLoginModal } from '../contexts/LoginModalContext'

export default function LoginModal() {
  const navigate = useNavigate()
  const { isOpen, reason, closeLoginModal } = useLoginModal()

  if (!isOpen) return null

  const handleLogin = () => {
    closeLoginModal()
    navigate('/auth', { state: { mode: 'login' } })
  }

  const handleSignup = () => {
    closeLoginModal()
    navigate('/auth', { state: { mode: 'signup' } })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeLoginModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-gray-100 dark:border-neutral-800 overflow-hidden">

        {/* Glow Decorativo */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-slate-500 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-slate-700 dark:hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-indigo-600 dark:text-indigo-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            Entre na sua conta
          </h2>

          {/* Reason */}
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {reason || 'Faca login para continuar aproveitando todos os recursos'}
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full py-4 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
            >
              <LogIn size={20} />
              Entrar
            </button>
            <button
              onClick={handleSignup}
              className="w-full py-4 border-2 border-gray-200 dark:border-neutral-700 text-slate-700 dark:text-white rounded-xl font-bold text-lg hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center justify-center gap-3 transition-all"
            >
              <UserPlus size={20} />
              Criar Conta Gratuita
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
            Cadastre-se em segundos e comece a alugar equipamentos
          </p>
        </div>
      </div>
    </div>
  )
}
