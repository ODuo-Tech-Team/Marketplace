import { Check, X, XCircle } from 'lucide-react'

interface ToastProps {
  message: string | null
  type: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  if (!message) return null

  if (type === 'success') {
    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
        <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-start gap-3 animate-pulse">
          <Check className="w-7 h-7 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-lg font-bold">Sucesso!</p>
            <p className="text-base mt-1">{message}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-in fade-in slide-in-from-top-2">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">Erro</p>
          <p className="text-sm mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-red-400 hover:text-red-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
