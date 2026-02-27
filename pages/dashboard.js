import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { MessageSquare, BarChart2, FileSearch, LogOut } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return <p className="text-center mt-20">Carregando...</p>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">FiscoFácil</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-80">{user.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm hover:opacity-70">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </nav>

      {/* Cards de módulos */}
      <div className="max-w-4xl mx-auto mt-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/chat">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer">
            <MessageSquare className="text-blue-600 mb-3" size={32} />
            <h3 className="font-bold text-gray-800">Guia Tributário</h3>
            <p className="text-sm text-gray-500 mt-1">Consulte Jurema sobre a melhor estratégia na reforma</p>
          </div>
        </Link>

        <Link href="/simulador">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer">
            <BarChart2 className="text-green-600 mb-3" size={32} />
            <h3 className="font-bold text-gray-800">Simulador de Regimes</h3>
            <p className="text-sm text-gray-500 mt-1">Compare carga efetiva 2026→2033</p>
          </div>
        </Link>

        <Link href="/classificar">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer">
            <FileSearch className="text-purple-600 mb-3" size={32} />
            <h3 className="font-bold text-gray-800">Classificar NCM</h3>
            <p className="text-sm text-gray-500 mt-1">Jurema classifica seu produto com IA</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
