import { useState } from 'react'
import { Search, Zap, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

export default function Classificar() {
  const [descricao, setDescricao]     = useState('')
  const [loadingIA, setLoadingIA]     = useState(false)
  const [loadingTrib, setLoadingTrib] = useState(false)
  const [classificacao, setClassificacao] = useState(null)
  const [tributacao, setTributacao]   = useState(null)
  const [regime, setRegime]           = useState('Lucro Presumido')

  async function handleClassificar(e) {
  e.preventDefault()
  if (!descricao.trim()) return
  setLoadingIA(true)
  setClassificacao(null)
  setTributacao(null)

    try {
      const res = await fetch('/api/jurema/classificar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ descricao }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader  = res.body.getReader()
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
      const res  = await fetch('/api/jurema/tributacao', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ncm:          classificacao.ncm_sugerido,
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
    ALTA:  'bg-green-100 text-green-700',
    MEDIA: 'bg-yellow-100 text-yellow-700',
    BAIXA: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <Toaster />
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-blue-500 text-sm">← Voltar</Link>
          <h1 className="text-3xl font-bold text-blue-700 mt-2">Classificar com IA</h1>
          <p className="text-gray-500 text-sm mt-1">
            Descreva o produto e a Jurema sugere o NCM + análise tributária
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleClassificar} className="space-y-4">
            <textarea
              rows={3}
              placeholder="Ex: Parafuso de aço inoxidável com cabeça sextavada, rosca métrica M8, comprimento 30mm, uso industrial"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex gap-3 items-center">
              <select
                value={regime}
                onChange={e => setRegime(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400"
              >
                <option>Chat</option>
                <option>Simples Nacional</option>
                <option>Lucro Presumido</option>
                <option>Lucro Real</option>
              </select>
              <button
                type="submit"
                disabled={loadingIA || !descricao.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold 
                           flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingIA ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" 
                              stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" 
                            d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Jurema analisando... pode levar 30s
                  </span>
                ) : (
                  <><Zap size={16} /> Classificar com Jurema</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Resultado da classificação */}
        {classificacao && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} /> NCM Sugerido
              </h2>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${corConfianca[classificacao.confianca] || corConfianca.MEDIA}`}>
                Confiança {classificacao.confianca}
              </span>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="font-mono text-2xl font-bold text-blue-700">{classificacao.ncm_sugerido}</p>
              <p className="text-gray-700 text-sm mt-1">{classificacao.descricao_ncm}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Justificativa</p>
              <p className="text-sm text-gray-700">{classificacao.justificativa}</p>
            </div>

            {classificacao.ncms_alternativos?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">NCMs Alternativos</p>
                <div className="flex gap-2 flex-wrap">
                  {classificacao.ncms_alternativos.map((ncm, i) => (
                    <span key={i} className="font-mono text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg">
                      {ncm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Botão análise tributária */}
            <button
              onClick={handleAnaliseTributaria}
              disabled={loadingTrib}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
            >
              <ChevronRight size={18} />
              {loadingTrib ? 'Analisando tributação...' : `Ver análise tributária para ${regime}`}
            </button>
          </div>
        )}

        {/* Análise tributária */}
        {tributacao && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
            <h2 className="font-bold text-gray-800 text-lg">📊 Análise Tributária — Reforma 2026–2033</h2>

            {/* Comparativo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-xs font-semibold text-red-600 uppercase mb-2">Sistema Atual</p>
                <p className="text-sm text-gray-700">PIS/COFINS: <strong>{tributacao.sistema_atual?.pis_cofins}</strong></p>
                <p className="text-sm text-gray-700">ICMS médio: <strong>{tributacao.sistema_atual?.icms_medio}</strong></p>
                {tributacao.sistema_atual?.ipi !== 'N/A' &&
                  <p className="text-sm text-gray-700">IPI: <strong>{tributacao.sistema_atual?.ipi}</strong></p>}
                <p className="text-sm font-bold text-red-700 mt-2">
                  Carga: {tributacao.sistema_atual?.carga_estimada}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs font-semibold text-green-600 uppercase mb-2">Sistema Novo (2033)</p>
                <p className="text-sm text-gray-700">CBS: <strong>{tributacao.sistema_novo?.cbs}</strong></p>
                <p className="text-sm text-gray-700">IBS: <strong>{tributacao.sistema_novo?.ibs}</strong></p>
                {tributacao.sistema_novo?.is !== 'N/A' &&
                  <p className="text-sm text-gray-700">IS: <strong>{tributacao.sistema_novo?.is}</strong></p>}
                <p className="text-sm font-bold text-green-700 mt-2">
                  Carga: {tributacao.sistema_novo?.carga_estimada}
                </p>
              </div>
            </div>

            {/* Linha do tempo */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Cronograma de Transição</p>
              <div className="space-y-2">
                {Object.entries(tributacao.transicao || {}).map(([ano, desc]) => (
                  <div key={ano} className="flex gap-3 items-start">
                    <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex-shrink-0 mt-0.5">
                      {ano.replace('_', '–')}
                    </span>
                    <p className="text-sm text-gray-700">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendação */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Recomendação</p>
              <p className="text-sm text-gray-700">{tributacao.recomendacao}</p>
            </div>

            {/* Riscos e Benefícios */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase mb-2 flex items-center gap-1">
                  <AlertCircle size={12} /> Riscos
                </p>
                <ul className="space-y-1">
                  {tributacao.riscos?.map((r, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-green-500 uppercase mb-2 flex items-center gap-1">
                  <CheckCircle size={12} /> Benefícios
                </p>
                <ul className="space-y-1">
                  {tributacao.beneficios?.map((b, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
