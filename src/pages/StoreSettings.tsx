import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Store, Upload, Palette, Link2, FileText, Save, ExternalLink,
  Loader2, Check, X, AlertCircle, ImagePlus, Trash2, Eye
} from 'lucide-react'

// Tipos
interface StoreFormData {
  banner_url: string | null
  avatar_url: string | null
  cor_marca: string | null
  loja_slug: string | null
  bio: string | null
  nome_empresa: string | null
}

interface SlugValidation {
  checking: boolean
  available: boolean | null
  reason: string | null
}

// Componente de Upload com Drag & Drop
function ImageUploader({
  currentUrl,
  onUpload,
  onRemove,
  type,
  label,
  recommendedSize,
  uploading
}: {
  currentUrl: string | null
  onUpload: (file: File) => void
  onRemove: () => void
  type: 'banner' | 'logo'
  label: string
  recommendedSize: string
  uploading: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        onUpload(file)
      } else {
        toast.error('Por favor, selecione uma imagem (jpg, png, webp)')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
    e.target.value = ''
  }

  const isBanner = type === 'banner'

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-gray-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700'
        } ${isBanner ? 'h-40' : 'h-32 w-32'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {currentUrl ? (
          <div className="relative w-full h-full group">
            <img
              src={currentUrl}
              alt={label}
              className={`w-full h-full object-cover ${isBanner ? '' : 'rounded-full'}`}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current?.click()
                }}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Upload size={18} className="text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
              >
                <Trash2 size={18} className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            ) : (
              <>
                <ImagePlus size={24} className="mb-2" />
                <span className="text-xs font-medium text-center px-2">
                  {isDragging ? 'Solte aqui' : 'Arraste ou clique'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">{recommendedSize}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de Preview da Loja
function StorePreview({
  data,
  nomeEmpresa
}: {
  data: StoreFormData
  nomeEmpresa: string
}) {
  const brandColor = data.cor_marca || '#4f46e5'

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      {/* Banner */}
      <div
        className="h-32 sm:h-40 relative"
        style={{
          background: data.banner_url
            ? `url(${data.banner_url}) center/cover`
            : `linear-gradient(135deg, ${brandColor}40, ${brandColor}80)`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
      </div>

      {/* Avatar sobreposto */}
      <div className="relative px-4 sm:px-6 -mt-10 sm:-mt-12">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white dark:border-neutral-900 shadow-lg overflow-hidden"
          style={{ backgroundColor: brandColor }}
        >
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 sm:p-6 pt-3 sm:pt-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
          {nomeEmpresa || 'Nome da Loja'}
        </h3>

        {data.loja_slug && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
            trakto.com/loja/{data.loja_slug}
          </p>
        )}

        {data.bio && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
            {data.bio}
          </p>
        )}

        {/* Accent color sample */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Cor da marca:</span>
          <div
            className="w-6 h-6 rounded-lg shadow-inner"
            style={{ backgroundColor: brandColor }}
          />
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
            {brandColor}
          </span>
        </div>

        {/* Sample button with brand color */}
        <button
          className="mt-4 w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: brandColor }}
        >
          Botao de Exemplo
        </button>
      </div>
    </div>
  )
}

// Componente Principal
export default function StoreSettings() {
  const navigate = useNavigate()
  const { user, profile, recarregarProfile } = useAuth()

  // Estados do formulario
  const [formData, setFormData] = useState<StoreFormData>({
    banner_url: null,
    avatar_url: null,
    cor_marca: '#4f46e5',
    loja_slug: null,
    bio: null,
    nome_empresa: null
  })

  const [slugInput, setSlugInput] = useState('')
  const [slugValidation, setSlugValidation] = useState<SlugValidation>({
    checking: false,
    available: null,
    reason: null
  })

  const [saving, setSaving] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carregar dados iniciais do profile
  useEffect(() => {
    if (profile) {
      setFormData({
        banner_url: profile.banner_url || null,
        avatar_url: profile.avatar_url || null,
        cor_marca: profile.cor_marca || '#4f46e5',
        loja_slug: profile.loja_slug || null,
        bio: profile.bio || null,
        nome_empresa: profile.nome_empresa || profile.full_name || null
      })
      setSlugInput(profile.loja_slug || '')
    }
  }, [profile])

  // Validacao do slug com debounce
  const validateSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugValidation({
        checking: false,
        available: null,
        reason: slug ? 'Minimo 3 caracteres' : null
      })
      return
    }

    setSlugValidation({ checking: true, available: null, reason: null })

    try {
      const { data, error } = await supabase.rpc('check_slug_availability', {
        p_slug: slug,
        p_user_id: user?.id || null
      })

      if (error) throw error

      setSlugValidation({
        checking: false,
        available: data.available,
        reason: data.available ? null : data.reason
      })
    } catch {
      setSlugValidation({
        checking: false,
        available: null,
        reason: 'Erro ao verificar disponibilidade'
      })
    }
  }, [user?.id])

  // Handler para mudanca do slug
  const handleSlugChange = (value: string) => {
    // Normaliza: minusculas, sem espacos, apenas caracteres validos
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
    setSlugInput(normalized)

    // Cancela debounce anterior
    if (slugDebounceRef.current) {
      clearTimeout(slugDebounceRef.current)
    }

    // Novo debounce
    slugDebounceRef.current = setTimeout(() => {
      validateSlug(normalized)
    }, 500)
  }

  // Upload de imagem para Storage
  const uploadStoreImage = async (
    file: File,
    type: 'banner' | 'logo'
  ): Promise<string | null> => {
    if (!user) return null

    try {
      // Gera nome unico
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `lojas/${user.id}/${type}-${Date.now()}.${fileExt}`

      // Deleta imagem antiga se existir
      const oldUrl = type === 'banner' ? formData.banner_url : formData.avatar_url
      if (oldUrl) {
        const oldPath = oldUrl.split('/equipamentos/')[1]
        if (oldPath) {
          await supabase.storage.from('equipamentos').remove([oldPath])
        }
      }

      // Upload nova imagem
      const { error: uploadError } = await supabase.storage
        .from('equipamentos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Retorna URL publica
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      return `${supabaseUrl}/storage/v1/object/public/equipamentos/${fileName}`
    } catch (err) {
      console.error('Erro no upload:', err)
      toast.error('Erro ao fazer upload da imagem')
      return null
    }
  }

  // Handlers de upload
  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true)
    const url = await uploadStoreImage(file, 'banner')
    if (url) {
      setFormData(prev => ({ ...prev, banner_url: url }))
    }
    setUploadingBanner(false)
  }

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true)
    const url = await uploadStoreImage(file, 'logo')
    if (url) {
      setFormData(prev => ({ ...prev, avatar_url: url }))
    }
    setUploadingLogo(false)
  }

  const handleRemoveBanner = () => {
    setFormData(prev => ({ ...prev, banner_url: null }))
  }

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, avatar_url: null }))
  }

  // Salvar alteracoes
  const handleSave = async () => {
    if (!user) return

    // Valida slug se preenchido
    if (slugInput && !slugValidation.available && slugInput !== profile?.loja_slug) {
      toast.error('O slug da loja nao esta disponivel')
      return
    }

    setSaving(true)

    try {
      const updateData: Record<string, unknown> = {
        banner_url: formData.banner_url,
        avatar_url: formData.avatar_url,
        bio: formData.bio
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      // Atualiza o contexto
      await recarregarProfile()

      toast.success('Loja atualizada com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar:', err)
      toast.error('Erro ao salvar alteracoes')
    } finally {
      setSaving(false)
    }
  }

  // Verificacao de acesso
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!profile.tem_loja) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Acesso Restrito
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Voce precisa ter uma loja ativa para acessar esta funcionalidade.
            Entre em contato com o suporte para ativar sua vitrine personalizada.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  const nomeExibicao = formData.nome_empresa || profile.full_name || 'Minha Loja'

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-14 md:top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Personalizar Minha Loja
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {profile.loja_slug && (
              <a
                href={`/loja/${profile.loja_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">Visualizar Loja</span>
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving || uploadingBanner || uploadingLogo}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span className="hidden sm:inline">Salvar Alteracoes</span>
              <span className="sm:hidden">Salvar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Form - Left Side */}
          <div className="space-y-6">
            {/* Banner Upload */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Upload size={18} className="text-indigo-600 dark:text-indigo-400" />
                Imagens da Loja
              </h2>

              <div className="space-y-5">
                <ImageUploader
                  currentUrl={formData.banner_url}
                  onUpload={handleBannerUpload}
                  onRemove={handleRemoveBanner}
                  type="banner"
                  label="Banner de Capa"
                  recommendedSize="1200x300 px"
                  uploading={uploadingBanner}
                />

                <ImageUploader
                  currentUrl={formData.avatar_url}
                  onUpload={handleLogoUpload}
                  onRemove={handleRemoveLogo}
                  type="logo"
                  label="Logo da Empresa"
                  recommendedSize="200x200 px"
                  uploading={uploadingLogo}
                />
              </div>
            </div>

            {/* Brand Color */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Palette size={18} className="text-indigo-600 dark:text-indigo-400" />
                Cor da Marca
              </h2>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="color"
                    value={formData.cor_marca || '#4f46e5'}
                    onChange={(e) => setFormData(prev => ({ ...prev, cor_marca: e.target.value }))}
                    className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-neutral-700 overflow-hidden"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Codigo Hex
                  </label>
                  <input
                    type="text"
                    value={formData.cor_marca || '#4f46e5'}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setFormData(prev => ({ ...prev, cor_marca: value }))
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="#4f46e5"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Esta cor sera usada como cor de destaque nos botoes e elementos da sua loja.
              </p>
            </div>

            {/* Custom URL */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Link2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                URL Personalizada
              </h2>

              <div className="relative">
                <div className="flex items-center">
                  <span className="px-2 sm:px-4 py-2.5 bg-gray-100 dark:bg-neutral-800 border border-r-0 border-gray-200 dark:border-neutral-700 rounded-l-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
                    <span className="hidden sm:inline">trakto.com/loja/</span>
                    <span className="sm:hidden">loja/</span>
                  </span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-r-xl text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="minha-empresa"
                    maxLength={30}
                  />
                </div>

                {/* Validation feedback */}
                {slugInput && (
                  <div className="mt-2 flex items-center gap-2">
                    {slugValidation.checking ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-slate-400" />
                        <span className="text-xs text-slate-400">Verificando...</span>
                      </>
                    ) : slugValidation.available === true ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Disponivel
                        </span>
                      </>
                    ) : slugValidation.available === false ? (
                      <>
                        <X size={14} className="text-red-500" />
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                          {slugValidation.reason || 'Indisponivel'}
                        </span>
                      </>
                    ) : slugValidation.reason ? (
                      <>
                        <AlertCircle size={14} className="text-amber-500" />
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          {slugValidation.reason}
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Use letras minusculas, numeros e hifens. Minimo 3, maximo 30 caracteres.
              </p>
            </div>

            {/* Bio/Slogan */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                Slogan / Bio
              </h2>

              <div className="relative">
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 200)
                    setFormData(prev => ({ ...prev, bio: value }))
                  }}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                  placeholder="Descreva sua empresa em poucas palavras..."
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                  {(formData.bio || '').length}/200
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Uma breve descricao que aparecera no cabecalho da sua loja.
              </p>
            </div>
          </div>

          {/* Preview - Right Side */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye size={18} className="text-indigo-600 dark:text-indigo-400" />
                Preview da Loja
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                Ao vivo
              </span>
            </div>

            <StorePreview
              data={formData}
              nomeEmpresa={nomeExibicao}
            />

            {/* Action buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saving || uploadingBanner || uploadingLogo}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Salvar Alteracoes
              </button>

              {(profile.loja_slug || slugInput) && (
                <a
                  href={`/loja/${profile.loja_slug || slugInput}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  <ExternalLink size={18} />
                  Visualizar Loja
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
