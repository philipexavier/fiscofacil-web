// pages/dashboard.jsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { MessageCircle, Database, Settings } from 'lucide-react'
import UserMenu from '../components/UserMenu'

export default function Dashboard() {
  const router = useRouter()
  const [sessionChecked, setSessionChecked] = useState(false)
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/login')
      } else {
        setUsuario(data.session.user)
        setSessionChecked(true)
      }
    }
    checkSession()
  }, [router])

  if (!sessionChecked) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center px-4">
      <header className="w-full max-w-3xl mt-10 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="FiscoFácil"
            width={180}
            height={54}
            className="object-contain"
            priority
          />
          <div className="border-l border-slate-700 pl-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Painel do Contador</p>
            <p className="text-xs font-semibold text-sky-400">Inteligência Tributária</p>
          </div>
        </div>
        {usuario && <UserMenu usuario={usuario} />}
      </header>

      <main className="w-full max-w-3xl grid gap-4 md:grid-cols-3">
        <Link href="/area-do-contador">
          <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={18} className="text-sky-400" />
              <h2 className="text-sm font-semibold text-slate-100">
                Área do Contador
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Chat tributário com foco em NCM, IBS, CBS, IS e transição 2026–2033.
            </p>
          </div>
        </Link>

        <Link href="/jurema-chat">
          <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={18} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-100">
                Jurema Chat livre
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Ambiente de experimentação com a Jurema para dúvidas gerais.
            </p>
          </div>
        </Link>

        <Link href="/admin/meilisearch">
          <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
            <div className="flex items-center gap-2 mb-2">
              <Database size={18} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100">
                Admin Meilisearch
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Upload da Tabela NCM e indexação no Meilisearch para busca avançada.
            </p>
          </div>
        </Link>
      </main>
    </div>
  )
}
