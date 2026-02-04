import { useState, useRef } from 'react'
import { Camera, Clock, X } from 'lucide-react'

interface HorimetroInputProps {
  value: string
  foto: string | null
  onChange: (value: string) => void
  onFotoChange: (foto: string | null) => void
  label: string
  required?: boolean
}

export function HorimetroInput({ value, foto, onChange, onFotoChange, label, required }: HorimetroInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      onFotoChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && '*'}
      </label>

      <div className="flex gap-3">
        {/* Campo numérico */}
        <div className="flex-1">
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cta" />
            <input
              type="number"
              step="0.1"
              min="0"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ex: 1500"
              required={required}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-blue-300 rounded-xl text-base focus:border-cta focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Horas</p>
        </div>

        {/* Upload de foto */}
        <div className="flex flex-col items-center gap-1">
          {foto ? (
            <div className="relative">
              <img
                src={foto}
                alt="Horímetro"
                className="w-16 h-16 object-cover rounded-xl border-2 border-cta cursor-pointer"
                onClick={() => setPreviewOpen(true)}
              />
              <button
                type="button"
                onClick={() => onFotoChange(null)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 border-2 border-dashed border-cta rounded-xl flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"
            >
              <Camera className="w-5 h-5 text-cta" />
              <span className="text-[10px] text-cta font-medium">Foto</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFotoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && foto && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-w-lg w-full">
            <img src={foto} alt="Horímetro" className="w-full rounded-2xl" />
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
