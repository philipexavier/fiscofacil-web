// components/UserMenu.jsx
// Componente reutilizável: exibe email do usuário + dropdown com Sair e Alterar Senha
import { useState } from 'react'
import { useRouter } from 'next/router'
import { LogOut, KeyRound, ChevronDown, X, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

export default function UserMenu({ usuario }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [modalSenha, setModalSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function handleAlterarSenha(e) {
    e.preventDefault()
    if (!novaSenha || novaSenha.length < 6) {
      toast.error('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      toast.error('As senhas não coincidem.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Erro ao alterar senha.')
      return
    }
    toast.success('Senha alterada com sucesso!')
    setModalSenha(false)
    setNovaSenha('')
    setConfirmar('')
  }

  if (!usuario) return null

  return (
    <>
      <Toaster />

      {/* Trigger */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 hover:border-sky-500 hover:text-sky-300 transition"
        >
          <span className="max-w-[160px] truncate">{usuario.email}</span>
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <button
              onClick={() => { setOpen(false); setModalSenha(true) }}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs text-slate-300 hover:bg-slate-800 hover:text-sky-300"
            >
              <KeyRound size={14} />
              Alterar senha
            </button>
            <div className="border-t border-slate-800" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut size={14} />
              Sair da conta
            </button>
          </div>
        )}
      </div>

      {/* Overlay para fechar dropdown clicando fora */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Modal — Alterar Senha */}
      {modalSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-sky-400" />
                <h2 className="font-semibold text-slate-100">Alterar senha</h2>
              </div>
              <button onClick={() => setModalSenha(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAlterarSenha} className="space-y-4">
              {/* Nova senha */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nova senha</label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 gap-2">
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
                  />
                  <button type="button" onClick={() => setMostrar((v) => !v)} className="text-slate-500 hover:text-slate-300">
                    {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirmar */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Confirmar senha</label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5">
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 text-slate-950 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-sky-400 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>

            <p className="mt-3 text-[11px] text-slate-500 text-center">
              A senha será atualizada no Supabase Authentication.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
