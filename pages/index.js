import { useState } from 'react'
import { Search, Upload } from 'lucide-react'
import { buscarProdutos } from '../lib/api'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

export default function Home() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleBuscar(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await buscarProdutos(query)
      setResultados(res.data.hits || [])
      if (res.data.hits.length === 0) toast('Nenhum produto encontrado.')
    } catch (err) {
      toast.error('Erro na busca. Tente novamente.')
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
        <p className="text-gray-500 mt-2">Catálogo inteligente de produtos + Guia tributário com IA</p>
      </div>

      {/* Barra de busca */}
      <form onSubmit={handleBuscar} className="w-full max-w-2xl">
        <div className="flex items-center border-2 border-blue-400 rounded-full px-4 py-3 bg-white shadow-md">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            type="text"
            placeholder="Pesquise por descrição, NCM, marca, fabricante ou código de barras..."
            className="flex-1 outline-none text-gray-700"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="ml-3 bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm hover:bg-blue-700"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 mt-4 justify-center">
          <Link href="/busca-em-massa">
            <button type="button" className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              <Upload size={16} /> Pesquisa em Massa
            </button>
          </Link>
          <Link href="/login">
            <button type="button" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              Área do Contador
            </button>
          </Link>
        </div>
      </form>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="w-full max-w-2xl mt-8 space-y-3">
          {resultados.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{item.descricao}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    NCM: <span className="text-blue-600">{item.ncm}</span> |
                    Marca: {item.marca} |
                    Fabricante: {item.fabricante}
                  </p>
                  {item.gtin && <p className="text-xs text-gray-400">EAN: {item.gtin}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.risco_fiscal === 'ALTO' ? 'bg-red-100 text-red-600' :
                  item.risco_fiscal === 'MÉDIO' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {item.risco_fiscal || 'BAIXO'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
