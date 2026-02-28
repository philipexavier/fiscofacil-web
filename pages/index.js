import { useState } from 'react'
import { Search, Upload, FileSearch } from 'lucide-react'
import { buscarProdutos } from '../lib/api'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

export default function Home() {
  const [query, setQuery]       = useState('')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading]   = useState(false)
  const [total, setTotal]       = useState(0)

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4">
      <Toaster />

      {/* Header */}
      <div className="mt-16 mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-700">FiscoFácil</h1>
        <p className="text-gray-500 mt-2">
          Consulta inteligente de NCM + Guia tributário com IA
        </p>
      </div>

      {/* Barra de busca */}
      <form onSubmit={handleBuscar} className="w-full max-w-2xl">
        <div className="flex items-center border-2 border-blue-400 rounded-full px-4 py-3 bg-white shadow-md">
          <Search className="text-gray-400 mr-3 flex-shrink-0" size={20} />
          <input
            type="text"
            placeholder="Pesquise por descrição ou código NCM... ex: bovinos, 0101, parafuso"
            className="flex-1 outline-none text-gray-700 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="ml-3 bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 mt-4 justify-center flex-wrap">
          <Link href="/busca-em-massa">
            <button type="button" className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              <Upload size={16} /> Pesquisa em Massa
            </button>
          </Link>
          <Link href="/classificar">
            <button type="button" className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              <FileSearch size={16} /> Classificar com IA
            </button>
          </Link>
          <Link href="/login">
            <button type="button" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              Área do Contador
            </button>
          </Link>
        </div>
      </form>

      {/* Total de resultados */}
      {total > 0 && (
        <p className="text-sm text-gray-400 mt-6">
          {total.toLocaleString()} resultado(s) para <strong>"{query}"</strong>
        </p>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="w-full max-w-2xl mt-3 space-y-3 pb-12">
          {resultados.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">

                  {/* Descrição com highlight do Meilisearch */}
                  <p
                    className="font-semibold text-gray-800 text-sm leading-snug"
                    dangerouslySetInnerHTML={{
                      __html: item._formatted?.descricao || item.descricao_limpa || item.descricao
                    }}
                  />

                  {/* Código NCM */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="font-mono text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded">
                      {item._formatted?.codigo || item.codigo}
                    </span>
                    {item.data_inicio && (
                      <span className="text-xs text-gray-400">
                        Vigente desde {item.data_inicio}
                      </span>
                    )}
                  </div>

                </div>

                {/* Badge nível */}
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${
                  item.nivel === 'ncm'        ? 'bg-blue-100 text-blue-700' :
                  item.nivel === 'posicao'    ? 'bg-purple-100 text-purple-700' :
                  item.nivel === 'capitulo'   ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {item.nivel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio inicial */}
      {resultados.length === 0 && !loading && query === '' && (
        <div className="mt-16 text-center text-gray-400">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Digite uma descrição ou código NCM para começar</p>
          <p className="text-xs mt-1">Ex: "bovinos reprodutores", "8471", "parafuso inox"</p>
        </div>
      )}
    </div>
  )
}
