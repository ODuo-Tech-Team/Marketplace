import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { type VerticalKey } from '../config/verticals'
import type {
  Equipamento,
  NovoEquipamento,
  InspectionPhoto,
  InspectionPhotoPosition,
  InspectionData,
  ArquivoChat,
  Consumivel,
  PropostaConsumivel,
} from '../types'

// Helper para verificar se equipamento esta disponivel
const isEquipamentoDisponivel = (eq: Equipamento): boolean => {
  if (!eq.status) return true
  return eq.status === 'DISPONIVEL' || eq.status === 'disponivel'
}

interface EquipamentoContextType {
  equipamentos: Equipamento[]
  loadingEquipamentos: boolean
  refetchEquipamentos: () => Promise<void>
  activeVertical: VerticalKey | 'todos'
  setActiveVertical: (v: VerticalKey | 'todos') => void
  addEquipamento: (dados: NovoEquipamento, locadorId: string) => Promise<{ success: boolean; error?: string }>
  fetchMeusEquipamentos: (locadorId: string) => Promise<Equipamento[]>
  uploadImagens: (files: File[], locadorId: string) => Promise<{ urls: string[]; error?: string }>
  deletarEquipamento: (equipamentoId: string, locadorId: string) => Promise<{ success: boolean; error?: string }>
  atualizarEquipamento: (equipamentoId: string, dados: NovoEquipamento, locadorId: string) => Promise<{ success: boolean; error?: string }>
  toggleDestaque: (equipamentoId: string, destaque: boolean) => Promise<{ success: boolean; error?: string }>
  fetchEquipamentoById: (id: string) => Promise<Equipamento | null>
  // Consumiveis
  fetchConsumiveis: (equipamentoId: string) => Promise<Consumivel[]>
  addConsumivel: (equipamentoId: string, nome: string, preco: number) => Promise<{ success: boolean; error?: string }>
  removeConsumivel: (consumivelId: string) => Promise<{ success: boolean; error?: string }>
  salvarConsumiveisProposta: (propostaId: string, items: { consumivel_id: string; quantidade: number; preco_unitario: number }[]) => Promise<{ success: boolean; error?: string }>
  fetchConsumiveisProposta: (propostaId: string) => Promise<PropostaConsumivel[]>
  // Inspection
  uploadInspectionPhotos: (files: Map<InspectionPhotoPosition, File>, locadorId: string, propostaId: string) => Promise<{ photos: InspectionPhoto[]; error?: string }>
  saveInspectionAndDispatch: (propostaId: string, equipamentoId: string, chatId: string, inspection: InspectionData) => Promise<{ success: boolean; error?: string }>
  // Chat file upload
  uploadArquivoChat: (file: File, chatId: string, senderId: string) => Promise<{ arquivo: ArquivoChat | null; error?: string }>
}

const EquipamentoContext = createContext<EquipamentoContextType | undefined>(undefined)

export function EquipamentoProvider({ children }: { children: ReactNode }) {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(true)
  const [activeVertical, setActiveVertical] = useState<VerticalKey | 'todos'>('todos')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const profilesChannelRef = useRef<RealtimeChannel | null>(null)

  const fetchEquipamentos = useCallback(async () => {
    setLoadingEquipamentos(true)

    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          locador:profiles!locador_id(
            full_name,
            nome_empresa,
            verificado,
            destacado,
            rating_average,
            reviews_count,
            tem_loja
          )
        `)
        .in('status', ['DISPONIVEL', 'disponivel'])
        .order('created_at', { ascending: false })

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('equipamentos')
          .select('*')
          .in('status', ['DISPONIVEL', 'disponivel'])
          .order('created_at', { ascending: false })

        if (fallbackError) {
          setEquipamentos([])
        } else {
          setEquipamentos(fallbackData || [])
        }
      } else {
        const equipamentosComLocador = (data || []).map(eq => {
          const locador = eq.locador as { full_name?: string; nome_empresa?: string; verificado?: boolean; destacado?: boolean; rating_average?: number; reviews_count?: number; tem_loja?: boolean } | null
          return {
            ...eq,
            locador_nome_empresa: locador?.nome_empresa || null,
            locador_full_name: locador?.full_name || null,
            locador_verificado: locador?.verificado || false,
            locador_destacado: locador?.destacado || false,
            locador_rating_average: locador?.rating_average ?? null,
            locador_reviews_count: locador?.reviews_count ?? null,
            locador_tem_loja: locador?.tem_loja || false,
            locador: undefined
          }
        })
        setEquipamentos(equipamentosComLocador)
      }
    } catch {
      setEquipamentos([])
    }

    setLoadingEquipamentos(false)
  }, [])

  const fetchEquipamentoById = useCallback(async (id: string): Promise<Equipamento | null> => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          locador:profiles!locador_id(
            full_name,
            nome_empresa,
            verificado,
            destacado,
            rating_average,
            reviews_count,
            tem_loja
          )
        `)
        .eq('id', id)
        .single()

      if (error || !data) return null

      const locador = data.locador as { full_name?: string; nome_empresa?: string; verificado?: boolean; destacado?: boolean; rating_average?: number; reviews_count?: number; tem_loja?: boolean } | null
      return {
        ...data,
        locador_nome_empresa: locador?.nome_empresa || null,
        locador_full_name: locador?.full_name || null,
        locador_verificado: locador?.verificado || false,
        locador_destacado: locador?.destacado || false,
        locador_rating_average: locador?.rating_average ?? null,
        locador_reviews_count: locador?.reviews_count ?? null,
        locador_tem_loja: locador?.tem_loja || false,
        locador: undefined
      }
    } catch {
      return null
    }
  }, [])

  const handleRealtimeEvent = useCallback((payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: Equipamento | null
    old: { id: string } | null
  }) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    if (eventType === 'INSERT' && newRecord) {
      if (isEquipamentoDisponivel(newRecord)) {
        setEquipamentos(prev => [newRecord, ...prev])
      }
    } else if (eventType === 'UPDATE' && newRecord) {
      if (isEquipamentoDisponivel(newRecord)) {
        setEquipamentos(prev => {
          const exists = prev.some(eq => eq.id === newRecord.id)
          if (exists) {
            return prev.map(eq => eq.id === newRecord.id ? newRecord : eq)
          } else {
            return [newRecord, ...prev]
          }
        })
      } else {
        setEquipamentos(prev => prev.filter(eq => eq.id !== newRecord.id))
      }
    } else if (eventType === 'DELETE' && oldRecord) {
      setEquipamentos(prev => prev.filter(eq => eq.id !== oldRecord.id))
    }
  }, [])

  const fetchMeusEquipamentos = async (locadorId: string): Promise<Equipamento[]> => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          locador:profiles!locador_id(
            full_name,
            nome_empresa,
            verificado,
            destacado,
            rating_average,
            reviews_count
          )
        `)
        .eq('locador_id', locadorId)
        .order('created_at', { ascending: false })

      if (error) {
        const { data: fallbackData } = await supabase
          .from('equipamentos')
          .select('*')
          .eq('locador_id', locadorId)
          .order('created_at', { ascending: false })
        return fallbackData || []
      }

      return (data || []).map(eq => {
        const locador = eq.locador as { full_name?: string; nome_empresa?: string; verificado?: boolean } | null
        return {
          ...eq,
          locador_nome_empresa: locador?.nome_empresa || null,
          locador_full_name: locador?.full_name || null,
          locador_verificado: locador?.verificado || false,
          locador: undefined
        }
      })
    } catch {
      return []
    }
  }

  const addEquipamento = async (
    dados: NovoEquipamento,
    locadorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('equipamentos').insert({
        nome: dados.nome,
        descricao: dados.descricao || null,
        preco_diaria: dados.preco_diaria,
        categoria: dados.categoria,
        cidade: dados.cidade,
        uf: dados.uf,
        locador_id: locadorId,
        fotos: dados.fotos || null,
        status: 'DISPONIVEL',
        ano: dados.ano || null,
        horimetro_atual: dados.horimetro_atual || null,
        peso_operacional: dados.peso_operacional || null,
        selo_verificado: false,
        voltagem: dados.voltagem || null,
        oferece_operador: dados.oferece_operador || false,
        vertical: dados.vertical || 'construcao',
        specs: dados.specs || null
      })

      if (error) {
        return { success: false, error: error.message }
      }

      await fetchEquipamentos()
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao cadastrar equipamento' }
    }
  }

  const uploadImagens = async (
    files: File[],
    locadorId: string
  ): Promise<{ urls: string[]; error?: string }> => {
    try {
      const urls: string[] = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${locadorId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

        const { data, error: uploadError } = await supabase.storage
          .from('equipamentos')
          .upload(fileName, file, { cacheControl: '3600', upsert: false })

        if (uploadError) {
          const altFileName = `${locadorId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          const { data: altData, error: altError } = await supabase.storage
            .from('equipamentos')
            .upload(altFileName, file, { cacheControl: '3600', upsert: false })

          if (altError) {
            continue
          }
          urls.push(altData.path)
        } else {
          urls.push(data.path)
        }
      }

      if (urls.length === 0 && files.length > 0) {
        return { urls: [], error: 'Nao foi possivel fazer upload das imagens. Verifique sua conexao.' }
      }

      return { urls }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro no upload de imagens:', err)
      return { urls: [], error: 'Erro inesperado ao fazer upload das imagens' }
    }
  }

  const deletarEquipamento = async (
    equipamentoId: string,
    locadorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const equipamento = equipamentos.find(eq => eq.id === equipamentoId)
      if (!equipamento || equipamento.locador_id !== locadorId) {
        return { success: false, error: 'Voce nao tem permissao para deletar este equipamento' }
      }

      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', equipamentoId)
        .eq('locador_id', locadorId)

      if (error) {
        return { success: false, error: error.message }
      }

      setEquipamentos(prev => prev.filter(eq => eq.id !== equipamentoId))
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao deletar equipamento' }
    }
  }

  const atualizarEquipamento = async (
    equipamentoId: string,
    dados: NovoEquipamento,
    locadorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update({
          nome: dados.nome,
          descricao: dados.descricao,
          preco_diaria: dados.preco_diaria,
          categoria: dados.categoria,
          cidade: dados.cidade,
          uf: dados.uf,
          fotos: dados.fotos,
          ano: dados.ano || null,
          horimetro_atual: dados.horimetro_atual || null,
          peso_operacional: dados.peso_operacional || null,
          voltagem: dados.voltagem || null,
          oferece_operador: dados.oferece_operador || false,
          vertical: dados.vertical || 'construcao',
          specs: dados.specs || null
        })
        .eq('id', equipamentoId)
        .eq('locador_id', locadorId)

      if (error) {
        return { success: false, error: error.message }
      }

      await fetchEquipamentos()
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao atualizar equipamento' }
    }
  }

  const toggleDestaque = async (
    equipamentoId: string,
    destaque: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update({ destaque })
        .eq('id', equipamentoId)

      if (error) {
        return { success: false, error: error.message }
      }

      await fetchEquipamentos()
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao atualizar destaque' }
    }
  }

  // ===== Consumiveis =====

  const fetchConsumiveis = async (equipamentoId: string): Promise<Consumivel[]> => {
    try {
      const { data, error } = await supabase
        .from('consumiveis')
        .select('*')
        .eq('equipamento_id', equipamentoId)
        .eq('ativo', true)
        .order('created_at', { ascending: true })

      if (error) return []
      return (data || []) as Consumivel[]
    } catch {
      return []
    }
  }

  const addConsumivel = async (
    equipamentoId: string,
    nome: string,
    preco: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('consumiveis')
        .insert({ equipamento_id: equipamentoId, nome, preco, ativo: true })

      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao adicionar consumivel' }
    }
  }

  const removeConsumivel = async (consumivelId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('consumiveis')
        .update({ ativo: false })
        .eq('id', consumivelId)

      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao remover consumivel' }
    }
  }

  const salvarConsumiveisProposta = async (
    propostaId: string,
    items: { consumivel_id: string; quantidade: number; preco_unitario: number }[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await supabase.from('proposta_consumiveis').delete().eq('proposta_id', propostaId)
      if (items.length === 0) return { success: true }

      const inserts = items.map(item => ({
        proposta_id: propostaId,
        consumivel_id: item.consumivel_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario
      }))

      const { error } = await supabase.from('proposta_consumiveis').insert(inserts)
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao salvar consumiveis da proposta' }
    }
  }

  const fetchConsumiveisProposta = async (propostaId: string): Promise<PropostaConsumivel[]> => {
    try {
      const { data, error } = await supabase
        .from('proposta_consumiveis')
        .select('*, consumivel:consumiveis(nome)')
        .eq('proposta_id', propostaId)

      if (error) return []

      return (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        proposta_id: item.proposta_id as string,
        consumivel_id: item.consumivel_id as string,
        quantidade: item.quantidade as number,
        preco_unitario: item.preco_unitario as number,
        nome: (item.consumivel as { nome?: string } | null)?.nome || 'Item'
      }))
    } catch {
      return []
    }
  }

  // ===== Inspection =====

  const uploadInspectionPhotos = async (
    files: Map<InspectionPhotoPosition, File>,
    locadorId: string,
    propostaId: string
  ): Promise<{ photos: InspectionPhoto[]; error?: string }> => {
    const photos: InspectionPhoto[] = []

    for (const [position, file] of files) {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${locadorId}/inspection/${propostaId}/${position}-${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('equipamentos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (error) {
        for (const photo of photos) {
          await supabase.storage.from('equipamentos').remove([photo.url])
        }
        return { photos: [], error: `Erro ao fazer upload da foto ${position}: ${error.message}` }
      }

      photos.push({ position, url: fileName, uploaded_at: new Date().toISOString() })
    }

    return { photos }
  }

  const saveInspectionAndDispatch = async (
    propostaId: string,
    equipamentoId: string,
    chatId: string,
    inspection: InspectionData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: inspectionError } = await supabase
        .from('propostas')
        .update({
          inspection_photos: inspection.photos,
          inspection_avarias: inspection.avarias || null,
          inspection_declaracao_aceita: inspection.declaracaoAceita,
          inspection_completed_at: new Date().toISOString(),
          status_entrega: 'ENTREGUE'
        })
        .eq('id', propostaId)

      if (inspectionError) {
        return { success: false, error: `Erro ao salvar inspecao: ${inspectionError.message}` }
      }

      const { error: eqError } = await supabase
        .from('equipamentos')
        .update({ status: 'OCUPADO' })
        .eq('id', equipamentoId)

      if (eqError) {
        return { success: false, error: `Erro ao atualizar equipamento: ${eqError.message}` }
      }

      await supabase.from('mensagens').insert({
        chat_id: chatId,
        sender_id: '00000000-0000-0000-0000-000000000000',
        texto: '📋 Vistoria de saida registrada!\n🚛 Equipamento despachado com sucesso.',
        lida: false
      })

      await fetchEquipamentos()
      return { success: true }
    } catch {
      return { success: false, error: 'Erro inesperado ao salvar inspecao e despachar' }
    }
  }

  // ===== Chat file upload =====

  const uploadArquivoChat = async (
    file: File,
    chatId: string,
    senderId: string
  ): Promise<{ arquivo: ArquivoChat | null; error?: string }> => {
    try {
      const tiposPermitidos = [
        'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      if (!tiposPermitidos.includes(file.type)) {
        return { arquivo: null, error: 'Tipo de arquivo nao permitido. Use PDF, imagens ou documentos Word.' }
      }
      if (file.size > 10 * 1024 * 1024) {
        return { arquivo: null, error: 'Arquivo muito grande. Maximo permitido: 10MB' }
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 9)
      const fileName = `chat-files/${chatId}/${senderId}/${timestamp}-${randomStr}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('equipamentos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        if (import.meta.env.DEV) console.error('Erro no upload de arquivo do chat:', uploadError)
        return { arquivo: null, error: 'Erro ao fazer upload do arquivo. Tente novamente.' }
      }

      return {
        arquivo: { url: data.path, nome: file.name, tipo: file.type, tamanho: file.size }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro inesperado no upload:', err)
      return { arquivo: null, error: 'Erro inesperado ao fazer upload do arquivo' }
    }
  }

  // ===== Realtime & Effects =====

  useEffect(() => {
    fetchEquipamentos()

    const channel = supabase
      .channel('equipamentos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipamentos' },
        (payload) => {
          handleRealtimeEvent(payload as unknown as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE'
            new: Equipamento | null
            old: { id: string } | null
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const newRecord = payload.new as { id?: string; destacado?: boolean; verificado?: boolean }
          if (newRecord && (newRecord.destacado !== undefined || newRecord.verificado !== undefined)) {
            fetchEquipamentos()
          }
        }
      )
      .subscribe()

    profilesChannelRef.current = profilesChannel

    const reconnectChannels = async () => {
      if (channelRef.current) {
        const state = channelRef.current.state
        if (state === 'closed' || state === 'errored') {
          supabase.removeChannel(channelRef.current)
          const newChannel = supabase
            .channel('equipamentos-changes-reconnect')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'equipamentos' },
              (payload) => {
                handleRealtimeEvent(payload as unknown as {
                  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
                  new: Equipamento | null
                  old: { id: string } | null
                })
              }
            )
            .subscribe()
          channelRef.current = newChannel
        }
      }
      if (profilesChannelRef.current) {
        const state = profilesChannelRef.current.state
        if (state === 'closed' || state === 'errored') {
          supabase.removeChannel(profilesChannelRef.current)
          const newProfilesChannel = supabase
            .channel('profiles-changes-reconnect')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' },
              (payload) => {
                const newRecord = payload.new as { id?: string; destacado?: boolean; verificado?: boolean }
                if (newRecord && (newRecord.destacado !== undefined || newRecord.verificado !== undefined)) {
                  fetchEquipamentos()
                }
              }
            )
            .subscribe()
          profilesChannelRef.current = newProfilesChannel
        }
      }
    }

    const handleFocus = () => { reconnectChannels(); fetchEquipamentos() }
    window.addEventListener('focus', handleFocus)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') { reconnectChannels(); fetchEquipamentos() }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (profilesChannelRef.current) supabase.removeChannel(profilesChannelRef.current)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchEquipamentos, handleRealtimeEvent])

  return (
    <EquipamentoContext.Provider
      value={{
        equipamentos,
        loadingEquipamentos,
        refetchEquipamentos: fetchEquipamentos,
        activeVertical,
        setActiveVertical,
        addEquipamento,
        fetchMeusEquipamentos,
        uploadImagens,
        deletarEquipamento,
        atualizarEquipamento,
        toggleDestaque,
        fetchEquipamentoById,
        fetchConsumiveis,
        addConsumivel,
        removeConsumivel,
        salvarConsumiveisProposta,
        fetchConsumiveisProposta,
        uploadInspectionPhotos,
        saveInspectionAndDispatch,
        uploadArquivoChat,
      }}
    >
      {children}
    </EquipamentoContext.Provider>
  )
}

export function useEquipamento() {
  const context = useContext(EquipamentoContext)
  if (context === undefined) {
    throw new Error('useEquipamento must be used within an EquipamentoProvider')
  }
  return context
}
