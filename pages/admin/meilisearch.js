// pages/admin/meilisearch.js
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Upload,
  Database,
  CheckCircle,
  Loader,
  AlertCircle,
  ArrowLeft,
  Trash2,
  RefreshCw,
  FileJson,
  FileText,
  Search,
  X,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

/* ── helpers ── */
function detectarNivel(codigo) {
  if (/^\d{2}$/.test(codigo)) return 'capitulo'
  if (/^\d{2}\.\d{2}$/.test(codigo)) return 'posicao'
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(codigo)) return 'ncm'
  return 'subposicao'
}

function limpar(texto) {
  return texto.replace(/<[^>]+>/g, '').trim().replace(/^[\s\-–]+/, '')
}

function transformarNcm(nomenclaturas) {
  return nomenclaturas.map((item, i) => {
    const codigo = (item.Codigo || item.codigo || '').trim()
    return {
      id: i,
      codigo,
      descricao: item.Descricao || item.descricao || '',
      descricao_limpa: limpar(item.Descricao || item.descricao || ''),
      nivel: detectarNivel(codigo),
      ativo: item.Data_Fim === '31/12/9999' || item.ativo === true,
      data_inicio: item.Data_Inicio || item.data_inicio || '',
    }
  })
}

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(';').map((h) => h.trim().replace(/"/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(';').map((v) => v.trim().replace(/"/g, ''))
    const obj = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    return obj
  })
}

/* ── component ── */
export default function AdminMeilisearch() {
  const [senha, setSenha] = useState('')
  const [autenticado, setAutenticado] = useState(false)

  // upload
  const [arquivo, setArquivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [documentos, setDocumentos] = useState(null)
  const [resetar, setResetar] = useState(false)
  const [loadingIndexar, setLoadingIndexar] = useState(false)
  const [resultado, setResultado] = useState(null)
  const inputRef = useRef()

  // índice atual
  const [stats, setStats] = useState(null)
  const [docsIndexados, setDocsIndexados] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [busca, setBusca] = useState('')
  const [loadingDelete, setLoadingDelete] = useState(false)

  /* ── auth ── */
  function handleLogin(e) {
    e.preventDefault()
    const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'fiscofacil_admin_2026'
    if (senha === secret) {
      setAutenticado(true)
      toast.success('Acesso liberado.')
    } else {
      toast.error('Senha incorreta.')
    }
  }

  /* ── buscar stats do índice ── */
  const buscarStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const q = busca.trim() || '*'
      const res = await fetch(`/api/admin/meili-search?q=${encodeURIComponent(q)}&limit=20`, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'fiscofacil_admin_2026'}`,
        },
      })
      if (!res.ok) throw new Error('Erro ao buscar dados do índice.')
      const data = await res.json()
      setStats(data.stats || null)
      setDocsIndexados(data.hits || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoadingStats(false)
    }
  }, [busca])

  useEffect(() => {
    if (autenticado) buscarStats()
  }, [autenticado, buscarStats])

  /* ── upload e parse ── */
  function handleArquivo(e) {
    const file = e.target.files[0]
    if (!file) return
    setArquivo(file)
    setResultado(null)

    const ext = file.name.split('.').pop().toLowerCase()
    const reader = new FileReader()

    reader.onload = (ev) => {
      try {
        let lista = []

        if (ext === 'json') {
          const json = JSON.parse(ev.target.result)
          lista = Array.isArray(json)
            ? json
            : json.Nomenclaturas || json.produtos || json.data || []
        } else if (ext === 'csv') {
          lista = parseCsv(ev.target.result)
        } else {
          toast.error('Formato não suportado. Use .json ou .csv')
          return
        }

        if (!lista.length) {
          toast.error('Nenhum item encontrado no arquivo.')
          return
        }

        const docs = transformarNcm(lista)
        setDocumentos(docs)
        setPreview({
          total: docs.length,
          ncms: docs.filter((d) => d.nivel === 'ncm').length,
          ativos: docs.filter((d) => d.ativo).length,
          arquivo: file.name,
          formato: ext.toUpperCase(),
        })
        toast.success(`${docs.length} entradas carregadas!`)
      } catch (err) {
        toast.error(`Erro ao processar arquivo: ${err.message}`)
      }
    }

    reader.readAsText(file, 'utf-8')
  }

  /* ── indexar ── */
  async function handleIndexar() {
    if (!documentos) return
    setLoadingIndexar(true)
    setResultado(null)
    try {
      const res = await fetch('/api/admin/indexar-ncm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'fiscofacil_admin_2026'}`,
        },
        body: JSON.stringify({ documentos, resetar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro || 'Erro desconhecido')
      setResultado(data)
      toast.success(`${data.total.toLocaleString()} documentos indexados!`)
      buscarStats()
    } catch (err) {
      toast.error(`Erro: ${err.message}`)
    } finally {
      setLoadingIndexar(false)
    }
  }

  /* ── deletar índice inteiro ── */
  async function handleDeletarTudo() {
    if (!confirm('Tem certeza? Isso apaga TODOS os documentos do índice NCM.')) return
    setLoadingDelete(true)
    try {
      const res = await fetch('/api/admin/indexar-ncm', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'fiscofacil_admin_2026'}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro || 'Erro ao deletar')
      toast.success('Índice limpo com sucesso.')
      setStats(null)
      setDocsIndexados([])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoadingDelete(false)
    }
  }

  /* ── deletar documento individual ── */
  async function handleDeletarDoc(id) {
    try {
      const res = await fetch(`/api/admin/indexar-ncm?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'fiscofacil_admin_2026'}`,
        },
      })
      if (!res.ok) throw new Error('Erro ao deletar documento')
      toast.success(`Documento #${id} removido.`)
      setDocsIndexados((prev) => prev.filter((d) => d.id !== id))
      setStats((prev) => prev ? { ...prev, numberOfDocuments: prev.numberOfDocuments - 1 } : prev)
    } catch (err) {
      toast.error(err.message)
    }
  }

  /* ── tela de login ── */
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Toaster />
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Database className="text-sky-400" size={28} />
            <h1 className="text-xl font-bold text-slate-50">Admin Meilisearch</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Senha admin"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="w-full bg-sky-500 text-slate-950 py-3 rounded-xl font-semibold hover:bg-sky-400"
            >
              Entrar
            </button>
          </form>
          <p className="mt-3 text-[11px] text-slate-500">
            Use a chave definida em <span className="font-mono">NEXT_PUBLIC_ADMIN_SECRET</span>.
          </p>
        </div>
      </div>
    )
  }

  /* ── painel principal ── */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300"
            >
              <ArrowLeft size={14} />
              Voltar
            </Link>
            <Database className="text-sky-400" size={28} />
            <div>
              <h1 className="text-2xl font-bold">Admin Meilisearch</h1>
              <p className="text-slate-400 text-sm">Gerencie o índice NCM</p>
            </div>
          </div>
          <button
            onClick={() => buscarStats()}
            className="flex items-center gap-2 text-xs text-slate-400 border border-slate-700 px-3 py-2 rounded-xl hover:border-sky-400 hover:text-sky-300"
          >
            <RefreshCw size={14} className={loadingStats ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {/* ── Stats do índice atual ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Database size={16} className="text-sky-400" />
              Índice atual — <code className="text-sky-300 text-xs">ncm</code>
            </h2>
            <button
              onClick={handleDeletarTudo}
              disabled={loadingDelete}
              className="flex items-center gap-1.5 text-xs text-rose-400 border border-rose-500/40 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 disabled:opacity-40"
            >
              <Trash2 size={13} />
              Limpar índice
            </button>
          </div>

          {loadingStats ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader size={16} className="animate-spin" /> Carregando...
            </div>
          ) : stats ? (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-slate-50">
                  {(stats.numberOfDocuments || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">Documentos</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {stats.isIndexing ? 'Sim' : 'Não'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Indexando</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-sky-400">
                  {Object.keys(stats.fieldDistribution || {}).length}
                </p>
                <p className="text-xs text-slate-400 mt-1">Campos</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mb-4">Nenhum dado disponível. O índice pode estar vazio ou a API inacessível.</p>
          )}

          {/* Busca nos docs indexados */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 mb-3">
            <Search size={14} className="text-slate-500" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarStats()}
              placeholder="Buscar no índice (ex: café, 2101, motores)..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
            />
            {busca && (
              <button onClick={() => { setBusca(''); buscarStats() }}>
                <X size={14} className="text-slate-500 hover:text-slate-300" />
              </button>
            )}
          </div>

          {docsIndexados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-3">Código</th>
                    <th className="py-2 pr-3">Descrição</th>
                    <th className="py-2 pr-3">Nível</th>
                    <th className="py-2 pr-3">Ativo</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {docsIndexados.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-900 hover:bg-slate-950/50">
                      <td className="py-2 pr-3 font-mono text-sky-300">{doc.codigo}</td>
                      <td className="py-2 pr-3 text-slate-200 max-w-xs truncate">{doc.descricao_limpa || doc.descricao}</td>
                      <td className="py-2 pr-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {doc.nivel}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`text-[10px] font-medium ${doc.ativo ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {doc.ativo ? '✓ Sim' : '✗ Não'}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleDeletarDoc(doc.id)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-500 mt-2">
                Exibindo {docsIndexados.length} resultado(s). Use a busca para filtrar.
              </p>
            </div>
          ) : (
            !loadingStats && (
              <p className="text-xs text-slate-500 text-center py-4">
                Nenhum documento encontrado. Faça um upload para popular o índice.
              </p>
            )
          )}
        </div>

        {/* ── Upload ── */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <Upload size={16} className="text-sky-400" />
            Importar arquivo
          </h2>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-sky-400 hover:bg-slate-900/70 transition"
          >
            {arquivo ? (
              <div className="flex items-center justify-center gap-2">
                {arquivo.name.endsWith('.csv') ? (
                  <FileText size={24} className="text-emerald-400" />
                ) : (
                  <FileJson size={24} className="text-sky-400" />
                )}
                <p className="text-emerald-300 font-semibold">{arquivo.name}</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto text-slate-500 mb-3" size={36} />
                <p className="text-slate-100 font-medium">Clique ou arraste o arquivo aqui</p>
                <p className="text-xs text-slate-500 mt-1">Aceito: .json · .csv</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleArquivo}
            className="hidden"
          />

          <div className="flex gap-3 mt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><FileJson size={12} className="text-sky-400" /> JSON: Tabela NCM oficial (Nomenclaturas[])</span>
            <span className="flex items-center gap-1"><FileText size={12} className="text-emerald-400" /> CSV: separado por ponto-e-vírgula com colunas Codigo;Descricao;Data_Inicio;Data_Fim</span>
          </div>
        </div>

        {/* ── Preview ── */}
        {preview && (
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-emerald-400" />
              Preview — {preview.arquivo}
              <span className="ml-auto text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                {preview.formato}
              </span>
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{preview.total.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">Total entradas</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-sky-400">{preview.ncms.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">NCMs válidos</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{preview.ativos.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">Vigentes</p>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setResetar(!resetar)}
                className={`w-12 h-6 rounded-full transition ${resetar ? 'bg-red-500' : 'bg-slate-700'} relative`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${resetar ? 'left-7' : 'left-1'}`} />
              </div>
              <span className="text-sm text-slate-300">Apagar índice antes de indexar</span>
            </label>
            {resetar && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={12} /> Essa opção limpa todo o índice antes de recarregar.
              </p>
            )}
          </div>
        )}

        {/* ── Botão indexar ── */}
        {documentos && (
          <button
            onClick={handleIndexar}
            disabled={loadingIndexar}
            className="w-full bg-sky-500 text-slate-950 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-sky-400 disabled:opacity-50"
          >
            {loadingIndexar ? (
              <>
                <Loader size={22} className="animate-spin" />
                Indexando {documentos.length.toLocaleString()} documentos...
              </>
            ) : (
              <>
                <Database size={22} />
                Indexar no Meilisearch
              </>
            )}
          </button>
        )}

        {/* ── Resultado ── */}
        {resultado && (
          <div className="bg-emerald-950 border border-emerald-600 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="text-emerald-400" size={24} />
              <h2 className="font-bold text-emerald-300 text-lg">Indexação concluída!</h2>
            </div>
            <div className="space-y-1 text-sm text-emerald-100">
              <p>✅ <strong>{resultado.total.toLocaleString()}</strong> documentos indexados</p>
              <p>📦 <strong>{resultado.lotes}</strong> lotes enviados</p>
              <p>🔍 Índice: <code className="bg-emerald-900 px-2 py-0.5 rounded">ncm</code></p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
