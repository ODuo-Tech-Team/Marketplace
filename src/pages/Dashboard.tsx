import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-600">LocaChef</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {profile?.full_name || 'Usuário'}
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

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Dashboard
          </h2>
          <p className="text-gray-600">
            Área administrativa do usuário.
          </p>
        </div>
      </main>
    </div>
  )
}
