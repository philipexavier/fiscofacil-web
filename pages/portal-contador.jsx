// pages/portal-contador.jsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { ArrowLeft, MessageCircle, Bot, Database } from 'lucide-react'
import Link from 'next/link'

export default function PortalContador() {
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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col px-4">
      <header className="border-b border-slate-800 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-sky-300 hover:border-sky-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              FiscoFácil · Painel do Contador
            </p>
            <h1 className="text-lg font-semibold text-slate-100">
              Escolha a ferramenta
            </h1>
          </div>
        </div>
        {usuario && (
          <span className="text-[11px] text-slate-500 max-w-xs truncate">
            Logado como {usuario.email}
          </span>
        )}
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto py-10 space-y-6">
        <p className="text-sm text-slate-400">
          Acesse a área de chat tributário, o laboratório da Jurema ou a interface de busca em massa
          do Meilisearch.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Área do Contador (chat tributário) */}
          <Link href="/area-do-contador">
            <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="text-sky-400" size={18} />
                <h2 className="text-sm font-semibold text-slate-100">
                  Chat Tributário (Área do Contador)
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Converse com a Jurema sobre IBS, CBS, IS e transição 2026–2033 com foco em NCM.
              </p>
            </div>
          </Link>

          {/* Jurema Chat avançado */}
          <Link href="/jurema-chat">
            <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="text-emerald-400" size={18} />
                <h2 className="text-sm font-semibold text-slate-100">
                  Laboratório Jurema Chat
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Interface completa para testar prompts, cenários e respostas longas da Jurema.
              </p>
            </div>
          </Link>

          {/* Meilisearch / Admin catálogo */}
          <Link href="/meilisearch">
            <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
              <div className="flex items-center gap-2 mb-2">
                <Database className="text-amber-400" size={18} />
                <h2 className="text-sm font-semibold text-slate-100">
                  Catálogo / Meilisearch
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Acesse o painel interno ligado ao índice do Meilisearch (busca em massa / ajustes).
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
