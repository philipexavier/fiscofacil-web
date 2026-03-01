import { useState } from 'react'
import {
  Search,
  Zap,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

export default function Classificar() {
  const [descricao, setDescricao] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [loadingTrib, setLoadingTrib] = useState(false)
  const [classificacao, setClassificacao] = useState(null)
  const [tributacao, setTributacao] = useState(null)
  const [regime, setRegime] = useState('Lucro Presumido')

  async function handleClassificar(e) {
    e.preventDefault()
    if (!descricao.trim()) return
    setLoadingIA(true)
    setClassificacao(null)
    setTributacao(null)

    try {
      const res = await fetch('/api/jurema/classificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const json = JSON.parse(line.slice(6))

            if (json.erro) throw new Error(json.erro)

            if (json.done && json.resultado) {
              setClassificacao(json.resultado)
              toast.success('NCM classificado pela Jurema!')
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr
            }
          }
        }
      }
    } catch (err) {
      toast.error(`Erro: ${err.message}`)
    } finally {
      setLoadingIA(false)
    }
  }

  async function handleAnaliseTributaria() {
    if (!classificacao) return
    setLoadingTrib(true)
    setTributacao(null)
    try {
      const res = await fetch('/api/jurema/tributacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ncm: classificacao.ncm_sugerido,
          descricao_ncm: classificacao.descricao_ncm,
          regime,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro)
      setTributacao(data)
      toast.success('Análise tributária concluída!')
    } catch (err) {
      toast.error(`Erro: ${err.message}`)
    } finally {
      setLoadingTrib(false)
    }
  }

  const corConfianca = {
    ALTA: 'bg-green-100 text-green-700',
    MEDIA: 'bg-yellow-100 text-yellow-700',
    BAIXA: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10">
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300"
            >
              <ArrowLeft size={14} />
              Voltar para busca NCM
            </Link>
          </div>
          <div className="text-right md:text-left">
            <h1 className="text-3xl md:text-4xl font-semibold text-sky-300">
              Classificar com IA (Jurema)
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Descreva o produto. A IA sugere o NCM e simula a tributação na Reforma 2026–2033.
            </p>
          </div>
        </header>

        {/* Etapas */}
        <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-400">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-[11px]">
                1
              </span>
              Classificação fiscal com Jurema
            </p>
            <p>
              Texto livre ↦ NCM sugerido, justificativa e alternativas com nível de confiança.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px]">
                2
              </span>
              Simulação de carga tributária
            </p>
            <p>
              Comparativo sistema atual × CBS/IBS com cronograma 2026–2033 e riscos para o regime escolhido.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleClassificar} className="space-y-4">
            <textarea
              rows={4}
              placeholder="Ex: Parafuso de aço inoxidável com cabeça sextavada, rosca métrica M8, 30mm, uso industrial em estruturas metálicas."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
            />
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <select
                value={regime}
                onChange={(e) => setRegime(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option>Simples Nacional</option>
                <option>Lucro Presumido</option>
                <option>Lucro Real</option>
              </select>
              <button
                type="submit"
                disabled={loadingIA || !descricao.trim()}
                className="flex-1 bg-sky-500 text-slate-950 py-2.5 rounded-xl text-sm font-semibold 
                           flex items-center justify-center gap-2 hover:bg-sky-400 disabled:opacity-50"
              >
                {loadingIA ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Jurema analisando...
                  </span>
                ) : (
                  <>
                    <Zap size={16} />
                    Classificar com Jurema
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Resultado da classificação */}
        {classificacao && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="font-semibold text-slate-100 flex items-center gap-2 text-sm md:text-base">
                <CheckCircle className="text-emerald-400" size={20} />
                NCM sugerido pela Jurema
              </h2>
              <span
                className={`text-[11px] px-3 py-1 rounded-full font-semibold ${
                  corConfianca[classificacao.confianca] ||
                  corConfianca.MEDIA
                }`}
              >
                Confiança {classificacao.confianca || 'MÉDIA'}
              </span>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4">
              <p className="font-mono text-2xl font-semibold text-sky-300">
                {classificacao.ncm_sugerido}
              </p>
              <p className="text-sm text-slate-100 mt-1">
                {classificacao.descricao_ncm}
              </p>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
              <p className="text-[11px] text-slate-400 font-semibold uppercase mb-1">
                Justificativa da classificação
              </p>
              <p className="text-sm text-slate-100">
                {classificacao.justificativa}
              </p>
            </div>

            {classificacao.ncms_alternativos?.length > 0 && (
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mb-2">
                  NCMs alternativos avaliados
                </p>
                <div className="flex gap-2 flex-wrap">
                  {classificacao.ncms_alternativos.map((ncm, i) => (
                    <span
                      key={i}
                      className="font-mono text-xs bg-slate-950/60 border border-slate-700 text-slate-100 px-3 py-1 rounded-lg"
                    >
                      {ncm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAnaliseTributaria}
              disabled={loadingTrib}
              className="w-full bg-emerald-500 text-slate-950 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 disabled:opacity-50 text-sm"
            >
              <ChevronRight size={18} />
              {loadingTrib
                ? 'Calculando impactos da Reforma...'
                : `Ver análise tributária para ${regime}`}
            </button>
          </section>
        )}

        {/* Análise tributária */}
        {tributacao && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="font-semibold text-slate-100 text-lg">
              📊 Análise tributária — Sistema atual × CBS/IBS (2026–2033)
            </h2>

            {/* Comparativo */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/30">
                <p className="text-[11px] font-semibold text-rose-300 uppercase mb-2">
                  Sistema atual
                </p>
                <p className="text-sm text-slate-100">
                  PIS/COFINS:{' '}
                  <strong>{tributacao.sistema_atual?.pis_cofins}</strong>
                </p>
                <p className="text-sm text-slate-100">
                  ICMS médio:{' '}
                  <strong>{tributacao.sistema_atual?.icms_medio}</strong>
                </p>
                {tributacao.sistema_atual?.ipi !== 'N/A' && (
                  <p className="text-sm text-slate-100">
                    IPI: <strong>{tributacao.sistema_atual?.ipi}</strong>
                  </p>
                )}
                <p className="text-sm font-semibold text-rose-300 mt-2">
                  Carga estimada: {tributacao.sistema_atual?.carga_estimada}
                </p>
              </div>
              <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/30">
                <p className="text-[11px] font-semibold text-emerald-300 uppercase mb-2">
                  Novo sistema (CBS/IBS)
                </p>
                <p className="text-sm text-slate-100">
                  CBS: <strong>{tributacao.sistema_novo?.cbs}</strong>
                </p>
                <p className="text-sm text-slate-100">
                  IBS: <strong>{tributacao.sistema_novo?.ibs}</strong>
                </p>
                {tributacao.sistema_novo?.is !== 'N/A' && (
                  <p className="text-sm text-slate-100">
                    Imposto Seletivo:{' '}
                    <strong>{tributacao.sistema_novo?.is}</strong>
                  </p>
                )}
                <p className="text-sm font-semibold text-emerald-300 mt-2">
                  Carga estimada: {tributacao.sistema_novo?.carga_estimada}
                </p>
              </div>
            </div>

            {/* Linha do tempo */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase mb-3">
                Cronograma de transição 2026–2033
              </p>
              <div className="space-y-2">
                {Object.entries(tributacao.transicao || {}).map(
                  ([ano, desc]) => (
                    <div
                      key={ano}
                      className="flex gap-3 items-start text-xs text-slate-200"
                    >
                      <span className="font-mono bg-slate-950/80 border border-slate-700 px-2 py-1 rounded flex-shrink-0 mt-0.5">
                        {ano.replace('_', '–')}
                      </span>
                      <p className="text-xs md:text-sm">{desc}</p>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Recomendação */}
            <div className="bg-sky-500/10 rounded-xl p-4 border border-sky-500/30">
              <p className="text-[11px] font-semibold text-sky-300 uppercase mb-1">
                Recomendações para o escritório / empresa
              </p>
              <p className="text-sm text-slate-100">{tributacao.recomendacao}</p>
            </div>

            {/* Riscos e Benefícios */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold text-rose-300 uppercase mb-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Riscos se nada for feito
                </p>
                <ul className="space-y-1">
                  {tributacao.riscos?.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-200 flex gap-1.5"
                    >
                      <span className="text-rose-400 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-emerald-300 uppercase mb-2 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Oportunidades com a Reforma
                </p>
                <ul className="space-y-1">
                  {tributacao.beneficios?.map((b, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-200 flex gap-1.5"
                    >
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
