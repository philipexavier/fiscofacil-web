'use client'
import { useState } from 'react'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { Loader2, Lock, Mail } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Informe e-mail e senha.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Redireciona para painel do contador
      window.location.href = '/jurema-chat'
    } catch (err) {
      setError(err.message || 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login do Contador — FiscoFácil</title>
      </Head>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-sky-400">Área do Contador</h1>
            <p className="text-xs text-slate-400 mt-1">
              Acesse a Jurema para classificar NCM e analisar a Reforma Tributária.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">E-mail</label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3">
                <Mail size={14} className="text-slate-500" />
                <input
                  type="email"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-100 py-2"
                  placeholder="contador@empresa.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Senha</label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3">
                <Lock size={14} className="text-slate-500" />
                <input
                  type="password"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-100 py-2"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold py-2.5 rounded-xl mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar na Jurema'}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-slate-500 text-center">
            Acesso exclusivo para contadores parceiros. Em caso de dúvidas, fale com o suporte FiscoFácil.
          </p>
        </div>
      </div>
    </>
  )
}