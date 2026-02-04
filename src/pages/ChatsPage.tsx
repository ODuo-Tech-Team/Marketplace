import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Chat } from '../contexts/AppContext'
import { MessageCircle, Loader2, Package, ArrowLeft } from 'lucide-react'
import TraktoLogo from '../components/TraktoLogo'

export default function ChatsPage() {
  const { user, profile, signOut } = useAuth()
  const { fetchMeusChats } = useApp()
  const navigate = useNavigate()

  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  // Nome dinâmico do usuário: nome_empresa > full_name > email > 'Perfil'
  const nomeUsuario = profile?.nome_empresa || profile?.full_name || user?.email || 'Perfil'

  useEffect(() => {
    const carregar = async () => {
      if (!user) return
      const data = await fetchMeusChats(user.id)
      setChats(data)
      setLoading(false)
    }

    carregar()
  }, [user])

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-card shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <TraktoLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-foreground-secondary hidden sm:block font-medium">
              {nomeUsuario}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-surface-elevated text-foreground-secondary rounded-lg hover:bg-surface-inset transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-card hover:shadow rounded-lg transition-all"
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6 text-foreground-secondary" />
          </button>
          <h2 className="text-3xl font-bold text-foreground">
            Minhas Conversas
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-cta" />
          </div>
        ) : chats.length === 0 ? (
          <div className="bg-surface-card rounded-2xl shadow-lg p-8 text-center">
            <MessageCircle className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground-secondary mb-2">
              Nenhuma conversa ainda
            </h3>
            <p className="text-foreground-muted mb-4">
              Quando você solicitar um equipamento, suas conversas aparecerão aqui.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-cta text-white font-medium rounded-lg hover:bg-cta-hover transition-colors"
            >
              Ver Equipamentos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const equipamento = chat.equipamento
              const isLocador = chat.locador_id === user?.id
              // Nome da outra parte: se sou locador, mostro o locatário, e vice-versa
              const outraParte = isLocador ? chat.locatario_nome : chat.locador_nome
              // Verifica se a última mensagem é não lida E foi enviada por outra pessoa
              const temMensagemNaoLida = chat.ultima_mensagem &&
                !chat.ultima_mensagem_lida &&
                chat.ultima_mensagem_sender_id !== user?.id

              return (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className={`block bg-surface-card rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 ${
                    temMensagemNaoLida ? 'border-l-4 border-cta bg-blue-50 dark:bg-cta/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-cta/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-cta" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        {/* Nome da outra pessoa */}
                        <h3 className={`text-foreground truncate ${temMensagemNaoLida ? 'font-bold' : 'font-semibold'}`}>
                          {outraParte || 'Cliente'}
                        </h3>
                        {chat.ultima_mensagem_data && (
                          <span className="text-xs text-foreground-muted flex-shrink-0">
                            {new Date(chat.ultima_mensagem_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {/* Nome do equipamento */}
                      <p className="text-xs text-cta font-medium truncate">
                        {equipamento?.nome || 'Equipamento'}
                      </p>
                      {/* Última mensagem */}
                      {chat.ultima_mensagem ? (
                        <p className={`text-sm truncate mt-0.5 ${
                          temMensagemNaoLida ? 'text-foreground font-medium' : 'text-foreground-secondary'
                        }`}>
                          {chat.ultima_mensagem}
                        </p>
                      ) : (
                        <p className="text-sm text-foreground-muted mt-0.5 italic">
                          Nova conversa
                        </p>
                      )}
                    </div>
                    {temMensagemNaoLida && (
                      <div className="w-3 h-3 bg-cta rounded-full flex-shrink-0" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
