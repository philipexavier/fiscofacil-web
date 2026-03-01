import { useState, useRef } from 'react'
import {
  Upload,
  Download,
  ArrowLeft,
  Loader,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react'
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
    const header = [
      'descricao',
      'ncm',
      'marca',
      'fabricante',
      'gtin',
      'risco_fiscal',
      'confianca',
    ]
    const linhas = resultados.map((r) =>
      header.map((h) => r[h] || '').join(';'),
    )
    const csv = [header.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resultado_fiscofacil.csv'
    a.click()
  }

  const badgeRisco = (valor) => {
    if (valor === 'ALTO')
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
    if (valor === 'MÉDIO')
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
    return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
  }

  const badgeConfianca = (valor) => {
    if (valor === 'ALTO')
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
    if (valor === 'MÉDIO')
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
    return 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Toaster />

      {/* Navbar */}
      <nav className="border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-sky-300 hover:border-sky-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              FiscoFácil · IA fiscal
            </p>
            <h1 className="text-lg font-semibold text-slate-100">
              Pesquisa em Massa com Jurema
            </h1>
          </div>
        </div>
        <span className="hidden md:inline-flex items-center gap-2 text-[11px] text-slate-400">
          <FileSpreadsheet size={14} className="text-sky-400" />
          Até 500 itens por planilha · CSV / XLSX
        </span>
      </nav>

      <main className="max-w-5xl mx-auto mt-10 px-4 pb-16 space-y-8">
        {/* Instruções / Jornada */}
        <section className="grid md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <p className="font-semibold text-slate-100 mb-1">
              1. Monte sua planilha
            </p>
            <p>
              Colunas: <code>descricao</code>, <code>ncm</code>, <code>gtin</code>,{' '}
              <code>marca</code>, <code>fabricante</code>. Mínimo: descrição.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <p className="font-semibold text-slate-100 mb-1">
              2. Jurema cruza e classifica
            </p>
            <p>
              A IA sugere NCM, mede risco fiscal e confiança para cada linha.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <p className="font-semibold text-slate-100 mb-1">
              3. Baixe o CSV auditável
            </p>
            <p>
              Exporte o resultado e integre no seu ERP, catálogo ou revisão de
              tributos.
            </p>
          </div>
        </section>

        {/* Upload */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-7">
          <h2 className="text-base md:text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Upload className="text-sky-400" size={20} />
            Enviar planilha para análise
          </h2>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-sky-500 hover:bg-slate-900/60 transition"
          >
            <Upload className="mx-auto text-sky-400 mb-3" size={36} />
            {arquivo ? (
              <>
                <p className="text-emerald-300 font-semibold text-sm">
                  {arquivo.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Clique para trocar o arquivo.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-100 font-medium">
                  Clique para selecionar ou arraste o arquivo aqui
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatos aceitos: .csv, .xlsx, .xls · até 500 linhas
                </p>
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
            className="mt-5 w-full bg-sky-500 text-slate-950 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-sky-400 disabled:opacity-40 text-sm"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Processando com Jurema...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Processar planilha com Jurema
              </>
            )}
          </button>
        </section>

        {/* Resultados */}
        {resultados.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-7 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-base md:text-lg font-semibold text-slate-100">
                ✅ {resultados.length} itens processados
              </h2>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 text-xs md:text-sm bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl hover:bg-emerald-400"
              >
                <Download size={16} />
                Baixar CSV com resultado
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-slate-950/70 text-slate-400 text-[11px] uppercase">
                  <tr>
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2">NCM</th>
                    <th className="px-3 py-2">Marca</th>
                    <th className="px-3 py-2">Risco fiscal</th>
                    <th className="px-3 py-2">Confiança</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((item, i) => (
                    <tr
                      key={i}
                      className="border-t border-slate-800 hover:bg-slate-900/70"
                    >
                      <td className="px-3 py-2 text-slate-100 max-w-xs truncate">
                        {item.descricao}
                      </td>
                      <td className="px-3 py-2 font-mono text-sky-300">
                        {item.ncm}
                      </td>
                      <td className="px-3 py-2 text-slate-400">
                        {item.marca || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            'px-2 py-0.5 rounded-full text-[11px] font-semibold ' +
                            badgeRisco(item.risco_fiscal || 'BAIXO')
                          }
                        >
                          {item.risco_fiscal || 'BAIXO'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            'px-2 py-0.5 rounded-full text-[11px] font-semibold ' +
                            badgeConfianca(item.confianca || '—')
                          }
                        >
                          {item.confianca || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-400">
              Use este CSV como base para revisão de catálogo, ajustes de NCM e
              planejamento da Reforma Tributária no seu ERP.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
