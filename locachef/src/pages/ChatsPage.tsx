import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp, type Chat } from '../contexts/AppContext'
import { HardHat, MessageCircle, Loader2, Package } from 'lucide-react'

export default function ChatsPage() {
  const { user, profile, signOut } = useAuth()
  const { fetchMeusChats } = useApp()

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-zinc-200">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <HardHat className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-600">LocaObra</h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 hidden sm:block font-medium">
              {nomeUsuario}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Minhas Conversas
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : chats.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhuma conversa ainda
            </h3>
            <p className="text-gray-400 mb-4">
              Quando você solicitar um equipamento, suas conversas aparecerão aqui.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Ver Equipamentos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const equipamento = chat.equipamento
              // Verifica se a última mensagem é não lida E foi enviada por outra pessoa
              const temMensagemNaoLida = chat.ultima_mensagem &&
                !chat.ultima_mensagem_lida &&
                chat.ultima_mensagem_sender_id !== user?.id

              return (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className={`block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 ${
                    temMensagemNaoLida ? 'border-l-4 border-amber-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-gray-800 truncate ${temMensagemNaoLida ? 'font-bold' : 'font-semibold'}`}>
                          {equipamento?.nome || 'Equipamento'}
                        </h3>
                        {chat.ultima_mensagem_data && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(chat.ultima_mensagem_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {chat.ultima_mensagem ? (
                        <p className={`text-sm truncate mt-1 ${
                          temMensagemNaoLida ? 'text-gray-800 font-semibold' : 'text-gray-500'
                        }`}>
                          {chat.ultima_mensagem}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-1 italic">
                          Nenhuma mensagem ainda
                        </p>
                      )}
                    </div>
                    {temMensagemNaoLida && (
                      <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0" />
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
