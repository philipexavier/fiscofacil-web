import { useState } from 'react'
import { Mail, Lock, LogIn, LogOut, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { supabase } from '../lib/supabase' // caminho que você mostrou

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [usuario, setUsuario] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !senha) {
      toast.error('Preencha e‑mail e senha.')
      return
    }
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      }) // [web:103][web:112]

      if (error) {
        // mensagem genérica (Supabase não diferencia usuário inexistente / senha errada)
        toast.error(error.message || 'Falha ao entrar. Verifique as credenciais.')
        return
      }

      setUsuario(data.user)
      toast.success('Login realizado com sucesso!')
    } catch (err) {
      toast.error('Erro inesperado ao autenticar.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut() // [web:108][web:111]
      if (error) {
        toast.error('Erro ao sair.')
        return
      }
      setUsuario(null)
      setEmail('')
      setSenha('')
      toast.success('Sessão encerrada.')
    } catch (err) {
      toast.error('Erro inesperado ao encerrar sessão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <Toaster />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {/* Topo */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
          <span className="text-[11px] text-slate-500">
            Área do Contador · Supabase Auth
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-sky-300 mb-1">
          Entrar na Área do Contador
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Use o e‑mail e senha cadastrados no Supabase Authentication.
        </p>

        {/* Se já estiver autenticado, mostra usuário + botão sair */}
        {usuario && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-100">
            <p className="font-semibold text-emerald-300">
              Sessão ativa
            </p>
            <p className="mt-1 break-all">{usuario.email}</p>
          </div>
        )}

        {/* Formulário de login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              E‑mail
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5">
              <Mail size={16} className="text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contador@fiscofacil.com"
                className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Senha
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5">
              <Lock size={16} className="text-slate-500" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-sky-500 text-slate-950 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-sky-400 disabled:opacity-50"
          >
            <LogIn size={16} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Rodapé com botão sair se logado */}
        {usuario && (
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full mt-3 bg-slate-800 text-slate-100 py-2 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-700 disabled:opacity-50"
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        )}

        <p className="mt-4 text-[11px] text-slate-500">
          Dica: para testar, crie um usuário em <span className="font-mono">Authentication → Users</span> no painel do Supabase e use o mesmo e‑mail/senha aqui. [web:84][web:85]
        </p>
      </div>
    </div>
  )
}
