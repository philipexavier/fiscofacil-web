// pages/chat.jsx
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function ChatPage() {
  const router = useRouter()
  const [sessionChecked, setSessionChecked] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [historico, setHistorico] = useState([]) // {role, content}
  const [loading, setLoading] = useState(false)
  const eventSourceRef = useRef(null)

  // guarda usuário logado
  const [usuario, setUsuario] = useState(null)

  // Protege a rota: se não tiver sessão, manda para /login
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

  async function handleEnviar(e) {
    e?.preventDefault()
    if (!mensagem.trim() || loading) return

    const novaPergunta = { role: 'user', content: mensagem.trim() }
    const novoHistorico = [...historico, novaPergunta]

    setHistorico(novoHistorico)
    setMensagem('')
    setLoading(true)

    // adiciona mensagem vazia do assistente para ir preenchendo
    setHistorico((prev) => [...prev, { role: 'assistant', content: '' }])

    const idxResposta = novoHistorico.length // posição da resposta

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagem: novaPergunta.content,
        historico: historico, // sem a resposta ainda
      }),
    })

    if (!res.ok) {
      setLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    let respostaAcumulada = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const linhas = chunk.split('\n').filter(Boolean)

      for (const linha of linhas) {
        if (!linha.startsWith('data: ')) continue
        const raw = linha.slice(6)
        if (raw === '[DONE]') continue

        try {
          const json = JSON.parse(raw)
          if (json.erro) {
            setLoading(false)
            return
          }
          if (json.token) {
            respostaAcumulada += json.token
            setHistorico((prev) => {
              const copia = [...prev]
              copia[idxResposta] = {
                role: 'assistant',
                content: respostaAcumulada,
              }
              return copia
            })
          }
        } catch {
          // ignora
        }
      }
    }

    setLoading(false)
  }

  if (!sessionChecked) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Topo */}
      <header className="border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-sky-300 hover:border-sky-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              FiscoFácil · Jurema IA
            </p>
            <h1 className="text-sm md:text-base font-semibold text-slate-100">
              Chat tributário sobre Reforma 2026–2033
            </h1>
          </div>
        </div>
        {usuario && (
          <span className="text-[11px] text-slate-500 max-w-xs truncate">
            Logado como {usuario.email}
          </span>
        )}
      </header>

      {/* Corpo do chat */}
      <main className="flex-1 flex flex-col px-4 md:px-8 py-4">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {historico.length === 0 && (
            <div className="text-center text-slate-500 text-xs mt-10">
              Faça perguntas sobre NCM, IBS, CBS, IS e transição 2026–2033.
            </div>
          )}

          {historico.map((msg, i) => (
            <div
              key={i}
              className={`max-w-2xl ${
                msg.role === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-sky-500 text-slate-950 rounded-br-sm'
                    : 'bg-slate-900 text-slate-100 rounded-bl-sm border border-slate-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleEnviar} className="max-w-3xl mx-auto w-full">
          <div className="flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2">
            <textarea
              rows={1}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Pergunte algo como: 'Como muda a tributação de serviços de TI no IBS/CBS em 2027?'"
              className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 resize-none"
            />
            <button
              type="submit"
              disabled={loading || !mensagem.trim()}
              className="inline-flex items-center justify-center bg-sky-500 text-slate-950 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-sky-400 disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            A Jurema responde com foco na Reforma Tributária do consumo (LC 214/2025).
          </p>
        </form>
      </main>
    </div>
  )
}
