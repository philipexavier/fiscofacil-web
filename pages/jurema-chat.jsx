'use client'
import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import { Send, Loader2, Trash2, Sparkles } from 'lucide-react'

export default function JuremaChat() {
  const [mensagem, setMensagem]   = useState('')
  const [historico, setHistorico] = useState([]) // [{role:'user'|'assistant',content:''}]
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]             = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historico, carregando])

  const limpar = () => {
    setHistorico([])
    setErro(null)
  }

  const enviar = async (e) => {
    e?.preventDefault()
    if (!mensagem.trim() || carregando) return

    const novaMsg = mensagem.trim()
    setMensagem('')
    setErro(null)

    const novoHistorico = [
      ...historico,
      { role: 'user',      content: novaMsg },
      { role: 'assistant', content: '' },         // placeholder para stream
    ]
    setHistorico(novoHistorico)
    setCarregando(true)

    try {
      const res = await fetch('/api/jurema/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: novaMsg,
          historico: historico, // backend remonta com system prompt
        }),
      })

      if (!res.ok || !res.body) {
        const texto = await res.text()
        throw new Error(texto || `Erro HTTP ${res.status}`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const ev of events) {
          if (!ev.startsWith('data:')) continue
          const dataStr = ev.replace(/^data:\s*/, '').trim()
          if (!dataStr || dataStr === '[DONE]') continue

          try {
            const payload = JSON.parse(dataStr)
            if (payload.erro) {
              setErro(payload.erro)
              continue
            }
            if (payload.token) {
              setHistorico((prev) => {
                const copia = [...prev]
                const last  = copia[copia.length - 1]
                if (last?.role === 'assistant') {
                  last.content += payload.token
                }
                return copia
              })
            }
          } catch {
            // ignora linhas quebradas
          }
        }
      }
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <Head>
        <title>Jurema Chat — Reforma Tributária</title>
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧾</span>
            <div>
              <h1 className="text-lg font-bold text-sky-400">Jurema Chat — Reforma Tributária 2026–2033</h1>
              <p className="text-xs text-slate-500">
                Pergunte sobre IBS, CBS, IS, transição e impactos por NCM e regime tributário.
              </p>
            </div>
          </div>
          <button
            onClick={limpar}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg"
          >
            <Trash2 size={14} /> Limpar histórico
          </button>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {historico.length === 0 && (
              <div className="mt-10 text-center text-slate-500 text-sm space-y-2">
                <p>Comece perguntando, por exemplo:</p>
                <p className="font-mono text-xs text-slate-400">
                  • Como fica a tributação de café solúvel na transição para IBS/CBS?<br />
                  • Quais riscos tributários para NCM 2101.11 em 2027 no Lucro Presumido?<br />
                  • Explique a transição 2026–2033 para serviços de transporte interestadual.
                </p>
              </div>
            )}

            {historico.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white rounded-br-sm'
                      : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 mb-1 text-xs text-sky-300">
                      <Sparkles size={12} /> Jurema
                    </div>
                  )}
                  <div>{msg.content}</div>
                </div>
              </div>
            ))}

            {carregando && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-sm px-4 py-2 text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Jurema está pensando...
                </div>
              </div>
            )}

            {erro && (
              <div className="mt-3 text-xs text-red-400">
                Erro: {erro}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={enviar} className="border border-slate-800 rounded-2xl bg-slate-900 p-3 flex items-end gap-3">
            <textarea
              rows={2}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Faça uma pergunta sobre IBS, CBS, IS, NCM ou transição 2026–2033..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-100 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={carregando || !mensagem.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold hover:bg-sky-500 transition-colors"
            >
              {carregando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar
            </button>
          </form>
        </main>
      </div>
    </>
  )
}
