// pages/dashboard.jsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { MessageCircle, Database, Settings } from 'lucide-react'

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
      <header className="w-full max-w-3xl mt-12 mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            FiscoFácil · Painel do Contador
          </p>
          <h1 className="text-2xl font-semibold text-sky-300">
            Escolha a área que deseja acessar
          </h1>
        </div>
        {usuario && (
          <span className="text-[11px] text-slate-500 max-w-xs truncate">
            Logado como {usuario.email}
          </span>
        )}
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
