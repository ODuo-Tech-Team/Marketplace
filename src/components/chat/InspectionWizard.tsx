import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Camera,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Image,
  FileText,
  ClipboardCheck,
  Loader2
} from 'lucide-react'
import {
  type InspectionPhotoPosition,
  INSPECTION_PHOTO_POSITIONS
} from '../../contexts/AppContext'

interface InspectionWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (
    photos: Map<InspectionPhotoPosition, File>,
    avarias: string,
    declaracaoAceita: boolean
  ) => Promise<void>
  loading: boolean
  equipamentoNome: string
}

interface PhotoPreview {
  file: File
  preview: string
}

export default function InspectionWizard({
  isOpen,
  onClose,
  onComplete,
  loading,
  equipamentoNome
}: InspectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [photos, setPhotos] = useState<Map<InspectionPhotoPosition, PhotoPreview>>(new Map())
  const [avarias, setAvarias] = useState('')
  const [declaracaoAceita, setDeclaracaoAceita] = useState(false)

  const fileInputRefs = useRef<Map<InspectionPhotoPosition, HTMLInputElement | null>>(new Map())

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
      setPhotos(new Map())
      setAvarias('')
      setDeclaracaoAceita(false)
    }
  }, [isOpen])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        URL.revokeObjectURL(photo.preview)
      })
    }
  }, [photos])

  const handleFileSelect = async (
    position: InspectionPhotoPosition,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create preview using FileReader
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      setPhotos((prev) => {
        const newMap = new Map(prev)
        // Revoke old preview URL if exists
        const oldPhoto = prev.get(position)
        if (oldPhoto) {
          URL.revokeObjectURL(oldPhoto.preview)
        }
        newMap.set(position, { file, preview })
        return newMap
      })
    }
    reader.readAsDataURL(file)

    // Clear input value to allow re-selecting same file
    event.target.value = ''
  }

  const handleRemovePhoto = (position: InspectionPhotoPosition) => {
    setPhotos((prev) => {
      const newMap = new Map(prev)
      const photo = prev.get(position)
      if (photo) {
        URL.revokeObjectURL(photo.preview)
      }
      newMap.delete(position)
      return newMap
    })
  }

  const triggerFileInput = (position: InspectionPhotoPosition) => {
    const input = fileInputRefs.current.get(position)
    if (input) {
      input.click()
    }
  }

  const photosCount = photos.size
  const allPhotosUploaded = photosCount === 4
  const canProceedStep1 = allPhotosUploaded
  const canProceedStep2 = true // Avarias is optional
  const canProceedStep3 = declaracaoAceita

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    // Convert PhotoPreview Map to File Map
    const fileMap = new Map<InspectionPhotoPosition, File>()
    photos.forEach((photoPreview, position) => {
      fileMap.set(position, photoPreview.file)
    })

    await onComplete(fileMap, avarias.trim(), declaracaoAceita)
  }

  if (!isOpen) return null

  const steps = [
    { number: 1, title: 'Fotos', icon: Camera },
    { number: 2, title: 'Avarias', icon: FileText },
    { number: 3, title: 'Confirmar', icon: ClipboardCheck }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl shadow-indigo-500/10 w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-100 dark:border-neutral-800 flex flex-col">
        {/* Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-3xl flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Vistoria Digital
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {equipamentoNome}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-neutral-800/50 flex-shrink-0">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number

            return (
              <React.Fragment key={step.number}>
                {index > 0 && (
                  <div
                    className={`w-8 h-0.5 ${
                      isCompleted
                        ? 'bg-indigo-600 dark:bg-indigo-400'
                        : 'bg-gray-300 dark:bg-neutral-600'
                    }`}
                  />
                )}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-200 dark:bg-neutral-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              </React.Fragment>
            )
          })}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Photo Upload */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Registro Fotografico
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Tire 4 fotos obrigatorias do equipamento
                </p>
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-full">
                  <Image className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    {photosCount}/4 fotos
                  </span>
                </div>
              </div>

              {/* 2x2 Photo Grid */}
              <div className="grid grid-cols-2 gap-3">
                {INSPECTION_PHOTO_POSITIONS.map((position) => {
                  const photo = photos.get(position.key)
                  const inputRef = (el: HTMLInputElement | null) => {
                    fileInputRefs.current.set(position.key, el)
                  }

                  return (
                    <div key={position.key} className="relative">
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleFileSelect(position.key, e)}
                        className="hidden"
                      />

                      {photo ? (
                        // Photo Preview
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-indigo-500 dark:border-indigo-400 group">
                          <img
                            src={photo.preview}
                            alt={position.label}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay with label */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span className="text-xs font-semibold text-white">
                              {position.label}
                            </span>
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={() => handleRemovePhoto(position.key)}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {/* Check indicator */}
                          <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        // Empty slot - Click to upload
                        <button
                          onClick={() => triggerFileInput(position.key)}
                          className="aspect-square w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-gray-50 dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all flex flex-col items-center justify-center gap-2 group"
                        >
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                            <Camera className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {position.label}
                          </span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  As fotos devem mostrar claramente o estado atual do equipamento.
                  Certifique-se de que a iluminacao esteja adequada.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Avarias (Damage Description) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Registro de Avarias
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Descreva qualquer dano pre-existente (opcional)
                </p>
              </div>

              <div className="relative">
                <textarea
                  value={avarias}
                  onChange={(e) => setAvarias(e.target.value.slice(0, 1000))}
                  placeholder="Descreva avarias ou danos pre-existentes no equipamento..."
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-neutral-800 text-slate-900 dark:text-white resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-400 dark:text-slate-500">
                  {avarias.length}/1000
                </div>
              </div>

              {/* Sumula 492 Info */}
              <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
                    Sumula 492 do STJ
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    A vistoria de saida e obrigatoria para comprovar o estado do
                    equipamento no momento do despacho. Danos pre-existentes nao
                    registrados podem ser responsabilidade do locador.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Confirmar Vistoria
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Revise as informacoes antes de confirmar
                </p>
              </div>

              {/* Photo Summary - 4 small thumbnails */}
              <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-xl">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Fotos Registradas ({photosCount})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {INSPECTION_PHOTO_POSITIONS.map((position) => {
                    const photo = photos.get(position.key)
                    return (
                      <div key={position.key} className="relative">
                        {photo ? (
                          <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700">
                            <img
                              src={photo.preview}
                              alt={position.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square rounded-lg bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
                            <Image className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {position.label}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Avarias Preview */}
              <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-xl">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Avarias Registradas
                </p>
                {avarias.trim() ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {avarias}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                    Nenhuma avaria registrada
                  </p>
                )}
              </div>

              {/* Declaration Checkbox */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaracaoAceita}
                    onChange={(e) => setDeclaracaoAceita(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                  />
                  <span className="text-sm text-emerald-800 dark:text-emerald-300">
                    Declaro que as fotos sao reais e representam o estado atual do
                    equipamento, conforme exigido pela{' '}
                    <strong>Sumula 492 do STJ</strong>.
                  </span>
                </label>
              </div>

              {/* Warning if checkbox not checked */}
              {!declaracaoAceita && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Aceite a declaracao para continuar
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Navigation Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 flex-shrink-0">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex-1 py-3 bg-gray-200 dark:bg-neutral-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-neutral-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canProceedStep2)
              }
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              Proximo
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={!canProceedStep3 || loading}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmar e Despachar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
