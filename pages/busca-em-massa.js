import { useState, useRef } from 'react'
import { Upload, Download, ArrowLeft, Loader, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import api from '../lib/api'

export default function BuscaEmMassa() {
  const [arquivo, setArquivo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState([])
  const inputRef = useRef()

  function handleArquivo(e) {
    const file = e.target.files[0]
    if (!file) return
    const extensao = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(extensao)) {
      toast.error('Use arquivo .csv ou .xlsx')
      return
    }
    setArquivo(file)
    toast.success(`Arquivo "${file.name}" carregado!`)
  }

  async function handleEnviar() {
    if (!arquivo) {
      toast.error('Selecione um arquivo primeiro.')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', arquivo)
      const res = await api.post('/catalogo/busca-em-massa', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResultados(res.data.resultados || [])
      toast.success(`${res.data.resultados.length} itens processados!`)
    } catch (err) {
      toast.error('Erro ao processar. Verifique o formato do arquivo.')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!resultados.length) return
    const header = ['descricao', 'ncm', 'marca', 'fabricante', 'gtin', 'risco_fiscal', 'confianca']
    const linhas = resultados.map(r =>
      header.map(h => r[h] || '').join(';')
    )
    const csv = [header.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resultado_fiscofacil.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <ArrowLeft size={20} className="cursor-pointer hover:opacity-70" />
        </Link>
        <h1 className="text-lg font-bold">Pesquisa em Massa</h1>
      </nav>

      <div className="max-w-2xl mx-auto mt-10 px-4 space-y-6">

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="font-semibold text-blue-700 mb-2">📋 Como usar</p>
          <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
            <li>Prepare uma planilha <strong>.csv ou .xlsx</strong></li>
            <li>Colunas aceitas: <code>descricao</code>, <code>ncm</code>, <code>gtin</code>, <code>marca</code>, <code>fabricante</code></li>
            <li>Mínimo: coluna <code>descricao</code> preenchida</li>
            <li>Limite: até 500 itens por envio</li>
          </ul>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="text-blue-600" size={22} />
            Enviar Planilha
          </h2>

          {/* Área drag-and-drop visual */}
          <div
            onClick={() => inputRef.current.click()}
            className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition"
          >
            <Upload className="mx-auto text-blue-400 mb-3" size={36} />
            {arquivo ? (
              <p className="text-green-600 font-semibold">{arquivo.name}</p>
            ) : (
              <>
                <p className="text-gray-600 font-medium">Clique para selecionar ou arraste aqui</p>
                <p className="text-xs text-gray-400 mt-1">Aceito: .csv, .xlsx, .xls</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleArquivo}
            className="hidden"
          />

          <button
            onClick={handleEnviar}
            disabled={loading || !arquivo}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-40"
          >
            {loading
              ? <><Loader size={18} className="animate-spin" /> Processando...</>
              : <><CheckCircle size={18} /> Processar com Jurema</>
            }
          </button>
        </div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                ✅ {resultados.length} itens processados
              </h2>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
              >
                <Download size={16} /> Baixar CSV
              </button>
            </div>

            {/* Tabela de resultados */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2">NCM</th>
                    <th className="px-3 py-2">Marca</th>
                    <th className="px-3 py-2">Risco</th>
                    <th className="px-3 py-2">Confiança</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{item.descricao}</td>
                      <td className="px-3 py-2 font-mono text-blue-600">{item.ncm}</td>
                      <td className="px-3 py-2 text-gray-500">{item.marca || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.risco_fiscal === 'ALTO' ? 'bg-red-100 text-red-600' :
                          item.risco_fiscal === 'MÉDIO' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'}`}>
                          {item.risco_fiscal || 'BAIXO'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.confianca === 'ALTO' ? 'bg-green-100 text-green-600' :
                          item.confianca === 'MÉDIO' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'}`}>
                          {item.confianca || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
