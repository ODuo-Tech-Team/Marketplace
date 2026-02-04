import { forwardRef } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  enviando: boolean
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSubmit, enviando }, ref) => {
    return (
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-gray-100 dark:border-neutral-800 sticky bottom-0">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-full focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none bg-white dark:bg-neutral-800 text-slate-900 dark:text-white placeholder:text-slate-400"
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={enviando || !value.trim()}
            className="p-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-indigo-500/20"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Loader2
                className={`w-5 h-5 animate-spin transition-opacity duration-150 ${
                  enviando ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ position: enviando ? 'relative' : 'absolute' }}
              />
              <Send
                className={`w-5 h-5 transition-opacity duration-150 ${
                  enviando ? 'opacity-0 absolute' : 'opacity-100'
                }`}
              />
            </div>
          </button>
        </form>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
