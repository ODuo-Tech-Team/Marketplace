import { FileText, Image, Download, File, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useState } from 'react'

interface FileAttachmentProps {
  arquivoUrl: string
  arquivoNome: string
  arquivoTipo: string
  arquivoTamanho?: number
  isOwn: boolean  // Se a mensagem e do proprio usuario
}

// Formata tamanho do arquivo para exibicao
function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Retorna icone baseado no tipo de arquivo
function getFileIcon(tipo: string) {
  if (tipo.startsWith('image/')) {
    return <Image className="w-5 h-5" />
  }
  if (tipo === 'application/pdf') {
    return <FileText className="w-5 h-5" />
  }
  return <File className="w-5 h-5" />
}

// Gera URL publica para o arquivo
function getPublicUrl(path: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
}

export function FileAttachment({
  arquivoUrl,
  arquivoNome,
  arquivoTipo,
  arquivoTamanho,
  isOwn
}: FileAttachmentProps) {
  const [downloading, setDownloading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isImage = arquivoTipo.startsWith('image/')
  const isPdf = arquivoTipo === 'application/pdf'
  const publicUrl = getPublicUrl(arquivoUrl)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      // Faz download do arquivo via Supabase Storage
      const { data, error } = await supabase.storage
        .from('equipamentos')
        .download(arquivoUrl)

      if (error) {
        console.error('Erro ao baixar arquivo:', error)
        // Fallback: abre URL direta
        window.open(publicUrl, '_blank')
        return
      }

      // Cria blob URL e faz download
      const blob = new Blob([data], { type: arquivoTipo })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = arquivoNome
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro inesperado ao baixar:', err)
      window.open(publicUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  // Preview de imagem
  if (isImage && !imageError) {
    return (
      <div className="mt-2">
        <div className="relative rounded-xl overflow-hidden max-w-xs">
          <img
            src={publicUrl}
            alt={arquivoNome}
            className="max-h-48 w-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(publicUrl, '_blank')}
            onError={() => setImageError(true)}
          />
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`absolute bottom-2 right-2 p-2 rounded-lg transition-all ${
              isOwn
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-black/20 hover:bg-black/30 text-white'
            }`}
            title="Baixar imagem"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] mt-1 opacity-70">{arquivoNome}</p>
      </div>
    )
  }

  // Card de arquivo (PDF, DOC, etc)
  return (
    <div
      className={`mt-2 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
        isOwn
          ? 'bg-white/10 hover:bg-white/20'
          : 'bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10'
      }`}
      onClick={handleDownload}
    >
      <div className={`p-2.5 rounded-lg ${
        isPdf
          ? 'bg-red-500/20 text-red-500'
          : 'bg-blue-500/20 text-blue-500'
      }`}>
        {getFileIcon(arquivoTipo)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-foreground'}`}>
          {arquivoNome}
        </p>
        <p className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-foreground-muted'}`}>
          {isPdf ? 'PDF' : arquivoTipo.split('/')[1]?.toUpperCase() || 'Arquivo'}
          {arquivoTamanho && ` - ${formatFileSize(arquivoTamanho)}`}
        </p>
      </div>
      <button
        disabled={downloading}
        className={`p-2 rounded-lg transition-all ${
          isOwn
            ? 'hover:bg-white/20 text-white'
            : 'hover:bg-black/10 text-foreground-secondary dark:hover:bg-white/10'
        }`}
        title="Baixar arquivo"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

export default FileAttachment
