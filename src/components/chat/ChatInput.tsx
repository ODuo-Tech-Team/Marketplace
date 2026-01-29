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
      <div className="bg-white border-t sticky bottom-0">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={enviando || !value.trim()}
            className="p-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
