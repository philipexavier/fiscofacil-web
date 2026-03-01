import { useState } from 'react'
import { Search, Upload, FileSearch } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { buscarProdutos } from '../lib/api'

const noticiasTributarias = [
  {
    id: 1,
    tag: 'Reforma 2026',
    titulo: 'Reforma tributária entra em fase de testes em 2026',
    resumo:
      'Empresas devem destacar CBS e IBS nas notas fiscais já em 2026, preparando a transição para extinção dos tributos atuais até 2033.',
    link: 'https://agenciabrasil.ebc.com.br/economia/noticia/2026-01/reforma-tributaria-entra-em-fase-de-testes-em-2026',
  },
  {
    id: 2,
    tag: 'Notas fiscais',
    titulo: 'Nota fiscal sem IBS e CBS exige cautela em 2026',
    resumo:
      'Especialistas alertam que a transição muda a dinâmica de emissão de documentos fiscais e exige atualização imediata dos sistemas.',
    link: 'https://www.contabeis.com.br/noticias/75347/nota-fiscal-sem-ibs-e-cbs-exige-cautela-em-2026/',
  },
  {
    id: 3,
    tag: 'APIs Fisco',
    titulo: 'APIs oficiais facilitam integração de tabelas IBS e CBS',
    resumo:
      'APIs públicas permitem sincronizar tabelas fiscais em JSON e reduzir divergências de alíquotas entre ERPs e o fisco.',
    link: 'https://guiatributario.net/2025/10/21/api-de-integracao-gratuita-tabelas-ibs-e-cbs/',
  },
]

function PainelNoticias() {
  return (
    <section className="mt-16 w-full max-w-5xl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-sm font-semibold text-slate-100">
            📊 Análises e notícias sobre a Reforma 2026–2033
          </h2>
          <span className="text-[11px] text-slate-500">
            Atualize sua estratégia tributária antes da transição completa
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {noticiasTributarias.map((n) => (
            <a
              key={n.id}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              className="group bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-sky-500/70 transition-colors"
            >
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-900/40 text-sky-300 mb-2">
                {n.tag}
              </span>
              <h3 className="text-xs font-semibold text-slate-100 mb-1 group-hover:text-sky-300">
                {n.titulo}
              </h3>
              <p className="text-[11px] text-slate-400 mb-2">
                {n.resumo}
              </p>
              <span className="text-[11px] text-sky-400 group-hover:text-sky-300 mt-auto">
                Ver detalhes ↗
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  async function handleBuscar(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await buscarProdutos(query)
      const hits = res.data.hits || []
      setResultados(hits)
      setTotal(res.data.total || 0)
      if (hits.length === 0) toast('Nenhum NCM encontrado para essa busca.')
    } catch (err) {
      toast.error('Erro na busca. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center px-4">
      <Toaster />

      {/* Header */}
      <div className="mt-16 mb-8 text-center">
        <h1 className="text-4xl font-bold text-sky-400">FiscoFácil</h1>
        <p className="text-slate-400 mt-2">
          Consulta inteligente de NCM + Guia tributário com IA
        </p>
      </div>

      {/* Barra de busca */}
      <form onSubmit={handleBuscar} className="w-full max-w-2xl">
        <div className="flex items-center border-2 border-sky-500 rounded-full px-4 py-3 bg-slate-900 shadow-md">
          <Search className="text-slate-400 mr-3 flex-shrink-0" size={20} />
          <input
            type="text"
            placeholder="Pesquise por descrição ou código NCM... ex: bovinos, 0101, parafuso"
            className="flex-1 outline-none text-slate-100 text-sm bg-transparent placeholder:text-slate-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="ml-3 bg-sky-500 text-slate-950 px-4 py-1.5 rounded-full text-sm hover:bg-sky-400 disabled:opacity-50 flex-shrink-0"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 mt-4 justify-center flex-wrap">
          <Link href="/busca-em-massa">
            <button
              type="button"
              className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-slate-100 hover:border-sky-500 hover:bg-slate-900/80"
            >
              <Upload size={16} /> Pesquisa em Massa
            </button>
          </Link>
          <Link href="/classificar">
            <button
              type="button"
              className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-slate-100 hover:border-sky-500 hover:bg-slate-900/80"
            >
              <FileSearch size={16} /> Classificar com IA
            </button>
          </Link>
          <Link href="/login">
            <button
              type="button"
              className="flex items-center gap-2 bg-sky-500 text-slate-950 px-4 py-2 rounded-lg text-sm hover:bg-sky-400"
            >
              Área do Contador
            </button>
          </Link>
        </div>
      </form>

      {/* Total de resultados */}
      {total > 0 && (
        <p className="text-sm text-slate-500 mt-6">
          {total.toLocaleString()} resultado(s) para <strong>"{query}"</strong>
        </p>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="w-full max-w-2xl mt-3 space-y-3 pb-12">
          {resultados.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800 hover:border-sky-500/60 transition"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-slate-100 text-sm leading-snug"
                    dangerouslySetInnerHTML={{
                      __html:
                        item._formatted?.descricao ||
                        item.descricao_limpa ||
                        item.descricao,
                    }}
                  />
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="font-mono text-sky-300 text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                      {item._formatted?.codigo || item.codigo}
                    </span>
                    {item.data_inicio && (
                      <span className="text-xs text-slate-500">
                        Vigente desde {item.data_inicio}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${
                    item.nivel === 'ncm'
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                      : item.nivel === 'posicao'
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40'
                      : item.nivel === 'capitulo'
                      ? 'bg-orange-500/15 text-orange-300 border border-orange-500/40'
                      : 'bg-slate-700 text-slate-200 border border-slate-600'
                  }`}
                >
                  {item.nivel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio inicial + Painel de notícias */}
      {resultados.length === 0 && !loading && query === '' && (
        <>
          <div className="mt-16 text-center text-slate-500">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">
              Digite uma descrição ou código NCM para começar
            </p>
            <p className="text-xs mt-1">
              Ex: &quot;bovinos reprodutores&quot;, &quot;8471&quot;, &quot;parafuso inox&quot;
            </p>
          </div>

          <PainelNoticias />
        </>
      )}
    </div>
  )
}
