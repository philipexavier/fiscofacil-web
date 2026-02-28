'use client'
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import toast, { Toaster } from 'react-hot-toast'
import {
  Plus, Trash2, Download, Eye, Tag, Shield,
  FileJson, RefreshCw, CheckCircle, XCircle, ChevronDown
} from 'lucide-react'

const SYSTEM_PROMPT = `Você é a Jurema, assistente especialista em classificação NCM e reforma tributária brasileira.

REGRAS OBRIGATÓRIAS (SafeGuards):
1. Responda SEMPRE em português
2. Limite sua resposta a no máximo 300 palavras
3. Nunca invente códigos NCM - use apenas dados verificados da tabela oficial
4. Se não souber o NCM exato, diga claramente e oriente a consultar a Receita Federal
5. Nunca repita frases ou parágrafos
6. Não discuta temas fora de NCM, tributação, IBS, CBS, reforma tributária
7. Respostas de classificação NCM sempre em JSON quando solicitado
8. Temas jurídicos complexos: recomende especialista tributário`

const CATEGORIES = [
  { id: 'ncm',       label: 'NCM',              icon: '🏷️',  color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
  { id: 'reforma',   label: 'Reforma Tributária',icon: '📋',  color: 'bg-blue-900/50 text-blue-300 border-blue-700' },
  { id: 'safeguard', label: 'SafeGuard',         icon: '🛡️',  color: 'bg-purple-900/50 text-purple-300 border-purple-700' },
  { id: 'avancado',  label: 'Avançado',          icon: '⚡',  color: 'bg-orange-900/50 text-orange-300 border-orange-700' },
  { id: 'outro',     label: 'Outro',             icon: '📦',  color: 'bg-slate-800 text-slate-300 border-slate-600' },
]

const BADGE_COLORS = {
  ncm:       'bg-emerald-900/60 text-emerald-300',
  reforma:   'bg-blue-900/60 text-blue-300',
  safeguard: 'bg-purple-900/60 text-purple-300',
  avancado:  'bg-orange-900/60 text-orange-300',
  outro:     'bg-slate-800 text-slate-400',
}

export default function Treinamento() {
  const [dataset, setDataset]       = useState([])
  const [category, setCategory]     = useState('ncm')
  const [question, setQuestion]     = useState('')
  const [answer, setAnswer]         = useState('')
  const [chkLimit, setChkLimit]     = useState(true)
  const [chkJson, setChkJson]       = useState(false)
  const [chkSource, setChkSource]   = useState(false)
  const [preview, setPreview]       = useState(null)
  const [saving, setSaving]         = useState(false)
  const [filterCat, setFilterCat]   = useState('all')

  // Carregar do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jurema_dataset')
      if (saved) setDataset(JSON.parse(saved))
    } catch {}
  }, [])

  const persist = useCallback((data) => {
    localStorage.setItem('jurema_dataset', JSON.stringify(data))
  }, [])

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const wcColor = wordCount === 0 ? 'text-slate-500'
    : wordCount <= 250 ? 'text-emerald-400'
    : wordCount <= 300 ? 'text-yellow-400'
    : 'text-red-400'

  const addExample = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Preencha pergunta e resposta!')
      return
    }
    if (wordCount > 300) {
      const ok = window.confirm(`Resposta tem ${wordCount} palavras (acima de 300). Adicionar mesmo assim?`)
      if (!ok) return
    }

    const entry = {
      id: Date.now(),
      category,
      messages: [
        { role: 'system',    content: SYSTEM_PROMPT },
        { role: 'user',      content: question.trim() },
        { role: 'assistant', content: answer.trim() },
      ],
      meta: {
        word_count:      wordCount,
        has_json:        chkJson,
        source_verified: chkSource,
        within_limit:    chkLimit,
        created_at:      new Date().toISOString(),
      },
    }

    // Salvar no Supabase via API Route
    setSaving(true)
    try {
      const res = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error('Erro ao salvar no Supabase')
      toast.success('Salvo no Supabase! ✅')
    } catch (e) {
      toast('Supabase offline — salvo só no localStorage', { icon: '⚠️' })
    } finally {
      setSaving(false)
    }

    const updated = [...dataset, entry]
    setDataset(updated)
    persist(updated)
    clearForm()
    toast.success(`Exemplo adicionado! Total: ${updated.length}`)
  }

  const removeExample = (id) => {
    const updated = dataset.filter(e => e.id !== id)
    setDataset(updated)
    persist(updated)
    toast.success('Removido!')
  }

  const editExample = (ex) => {
    setQuestion(ex.messages[1].content)
    setAnswer(ex.messages[2].content)
    setCategory(ex.category)
    setChkJson(ex.meta.has_json)
    setChkSource(ex.meta.source_verified)
    removeExample(ex.id)
    toast('Carregado para edição', { icon: '✏️' })
  }

  const clearForm = () => {
    setQuestion('')
    setAnswer('')
    setChkJson(false)
    setChkSource(false)
  }

  const clearAll = () => {
    if (!window.confirm(`Apagar todos os ${dataset.length} exemplos?`)) return
    setDataset([])
    localStorage.removeItem('jurema_dataset')
    toast.success('Dataset limpo!')
  }

  const exportJSONL = async () => {
    if (dataset.length === 0) { toast.error('Dataset vazio!'); return }
    try {
      const res = await fetch('/api/admin/export?format=jsonl')
      if (res.ok) {
        const blob = await res.blob()
        downloadBlob(blob, 'jurema_dataset.jsonl')
        toast.success('JSONL exportado do Supabase!')
        return
      }
    } catch {}
    // fallback localStorage
    const content = dataset.map(ex =>
      JSON.stringify({ messages: ex.messages })
    ).join('\n')
    downloadBlob(new Blob([content], { type: 'text/plain' }), 'jurema_dataset.jsonl')
    toast.success('JSONL exportado (localStorage)!')
  }

  const exportJSON = () => {
    if (dataset.length === 0) { toast.error('Dataset vazio!'); return }
    downloadBlob(
      new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' }),
      'jurema_dataset.json'
    )
    toast.success('JSON exportado!')
  }

  const downloadBlob = (blob, filename) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
  }

  const filtered = filterCat === 'all' ? dataset
    : dataset.filter(e => e.category === filterCat)

  const stats = CATEGORIES.map(c => ({
    ...c,
    count: dataset.filter(e => e.category === c.id).length
  }))

  return (
    <>
      <Head>
        <title>Jurema — Painel de Treinamento</title>
      </Head>
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }
      }} />

      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">

        {/* HEADER */}
        <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h1 className="text-lg font-bold text-sky-400">Jurema — Painel de Treinamento</h1>
              <p className="text-xs text-slate-500">Fine-tune Dataset Builder · Next.js + Supabase</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {dataset.length} exemplos
            </span>
          </div>
        </header>

        {/* STATS BAR */}
        <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-3 flex gap-4 overflow-x-auto">
          {stats.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCat(filterCat === c.id ? 'all' : c.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap ${
                filterCat === c.id ? c.color : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full">{c.count}</span>
            </button>
          ))}
          {filterCat !== 'all' && (
            <button
              onClick={() => setFilterCat('all')}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              ver todos
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* FORMULÁRIO */}
          <div className="w-1/2 border-r border-slate-800 p-6 overflow-y-auto flex flex-col gap-5">

            {/* Categoria */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Tag size={12} /> Categoria
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      category === c.id ? c.color : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pergunta */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Pergunta do usuário</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={3}
                placeholder="Ex: Qual o NCM de parafuso de aço inoxidável?"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none transition-colors"
              />
            </div>

            {/* Resposta */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Resposta da Jurema</label>
                <span className={`text-xs font-mono ${wcColor}`}>{wordCount}/300 palavras</span>
              </div>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={8}
                placeholder='```json
{
  "ncm": "7318.15.00",
  ...
}
```'
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none transition-colors"
              />
              {wordCount > 300 && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <XCircle size={12} /> Acima do limite de 300 palavras
                </p>
              )}
            </div>

            {/* SafeGuards */}
            <div className="bg-purple-950/30 border border-purple-900/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield size={12} /> Checklist SafeGuard
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { id: 'limit',  val: chkLimit,  set: setChkLimit,  label: 'Resposta respeita limite de 300 palavras' },
                  { id: 'json',   val: chkJson,   set: setChkJson,   label: 'Usa formato JSON estruturado' },
                  { id: 'source', val: chkSource, set: setChkSource, label: 'NCM verificado na tabela Gecex 812/2025' },
                ].map(item => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => item.set(!item.val)}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        item.val
                          ? 'bg-purple-600 border-purple-500'
                          : 'bg-slate-800 border-slate-600 group-hover:border-purple-700'
                      }`}
                    >
                      {item.val && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={addExample}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? 'Salvando...' : 'Adicionar ao Dataset'}
              </button>
              <button
                onClick={clearForm}
                className="px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-xl transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* LISTA */}
          <div className="w-1/2 flex flex-col bg-slate-950">

            {/* Export bar */}
            <div className="border-b border-slate-800 px-4 py-3 flex gap-2 bg-slate-900/50">
              <button
                onClick={exportJSONL}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                <Download size={13} /> Exportar JSONL
              </button>
              <button
                onClick={exportJSON}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                <FileJson size={13} /> JSON
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Lista de exemplos */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                  <span className="text-4xl">📝</span>
                  <p className="text-sm">
                    {filterCat === 'all' ? 'Nenhum exemplo ainda.' : `Nenhum exemplo de "${filterCat}".`}
                  </p>
                </div>
              ) : (
                [...filtered].reverse().map(ex => (
                  <div
                    key={ex.id}
                    className="border-b border-slate-800/50 px-5 py-4 hover:bg-slate-900/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => editExample(ex)}>
                        <p className="text-sm font-medium text-sky-400 truncate mb-1">
                          {ex.messages[1].content}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {ex.messages[2].content.substring(0, 90)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLORS[ex.category]}`}>
                            {CATEGORIES.find(c => c.id === ex.category)?.icon} {ex.category}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {ex.meta.word_count}w
                          </span>
                          {ex.meta.has_json && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400">JSON</span>
                          )}
                          {ex.meta.source_verified && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400">✓ Verificado</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreview(ex)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => removeExample(ex.id)}
                          className="p-1.5 rounded-lg hover:bg-red-950 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sky-400 font-semibold flex items-center gap-2">
                <FileJson size={16} /> Preview — Formato Ollama JSONL
              </h3>
              <button onClick={() => setPreview(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
            <pre className="bg-slate-950 text-sky-300 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono">
              {JSON.stringify({ messages: preview.messages }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}
