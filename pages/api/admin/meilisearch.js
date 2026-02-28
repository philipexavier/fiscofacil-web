import { useState, useRef } from 'react'
import { Upload, Database, CheckCircle, Loader, AlertCircle, Trash2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

// ── Detecta nível do código NCM ───────────────────────────────
function detectarNivel(codigo) {
  if (/^\d{2}$/.test(codigo))               return 'capitulo'
  if (/^\d{2}\.\d{2}$/.test(codigo))        return 'posicao'
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(codigo)) return 'ncm'
  return 'subposicao'
}

function limpar(texto) {
  return texto.replace(/<[^>]+>/g, '').trim().replace(/^[\s\-–]+/, '')
}

// ── Transforma o JSON da Receita Federal no formato do índice ─
function transformarNcm(nomenclaturas) {
  const docs = []
  let capituloAtual = '00'
  nomenclaturas.forEach((item, i) => {
    const codigo = (item.Codigo || '').trim()
    const nivel  = detectarNivel(codigo)
    if (nivel === 'capitulo') capituloAtual = codigo
    docs.push({
      id:              i,
      codigo,
      descricao:       item.Descricao || '',
      descricao_limpa: limpar(item.Descricao || ''),
      nivel,
      capitulo:        capituloAtual,
      ativo:           item.Data_Fim === '31/12/9999',
      data_inicio:     item.Data_Inicio || '',
    })
  })
  return docs
}

export default function AdminMeilisearch() {
  const [senha, setSenha]           = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [arquivo, setArquivo]       = useState(null)
  const [preview, setPreview]       = useState(null)
  const [documentos, setDocumentos] = useState(null)
  const [resetar, setResetar]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [resultado, setResultado]   = useState(null)
  const inputRef = useRef()

  // ── Login simples ───────────────────────────────────────────
  function handleLogin(e) {
    e.preventDefault()
    if (senha === (process.env.NEXT_PUBLIC_ADMIN_SECRET || 'fiscofacil_admin_2026')) {
      setAutenticado(true)
    } else {
      toast.error('Senha incorreta.')
    }
  }

  // ── Lê e processa o JSON ────────────────────────────────────
  function handleArquivo(e) {
    const file = e.target.files[0]
    if (!file) return
    setArquivo(file)
    setResultado(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result)

        // Aceita tanto array direto quanto { Nomenclaturas: [...] }
        const lista = Array.isArray(json)
          ? json
          : json.Nomenclaturas || json.produtos || json.data || []

        if (!lista.length) {
          toast.error('Nenhum item encontrado no JSON.')
          return
        }

        const docs  = transformarNcm(lista)
        const ncms  = docs.filter(d => d.nivel === 'ncm').length
        const ativos = docs.filter(d => d.ativo).length

        setDocumentos(docs)
        setPreview({ total: docs.length, ncms, ativos, arquivo: file.name })
        toast.success(`${docs.length} entradas carregadas!`)
      } catch {
        toast.error('JSON inválido. Verifique o arquivo.')
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  // ── Envia para a API ────────────────────────────────────────
  async function handleIndexar() {
    if (!documentos) return
    setLoading(true)
    setResultado(null)

    try {
      const res = await fetch('/api/admin/indexar-ncm', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'fiscofacil_admin_2026'}`,
        },
        body: JSON.stringify({ documentos, resetar }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.erro || 'Erro desconhecido')

      setResultado(data)
      toast.success(`${data.total} documentos indexados em ${data.lotes} lotes!`)
    } catch (err) {
      toast.error(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Tela de login ───────────────────────────────────────────
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Toaster />
        <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Database className="text-blue-400" size={28} />
            <h1 className="text-xl font-bold text-white">Admin Meilisearch</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Senha admin"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-4 py-3 outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Painel principal ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Toaster />

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Database className="text-blue-400" size={32} />
          <div>
            <h1 className="text-2xl font-bold">Alimentar Meilisearch</h1>
            <p className="text-gray-400 text-sm">Upload do JSON da Tabela NCM → índice de busca</p>
          </div>
        </div>

        {/* Upload */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Upload size={18} className="text-blue-400" /> Selecionar JSON
          </h2>

          <div
            onClick={() => inputRef.current.click()}
            className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-gray-700 transition"
          >
            <Upload className="mx-auto text-gray-400 mb-3" size={36} />
            {arquivo ? (
              <p className="text-green-400 font-semibold">{arquivo.name}</p>
            ) : (
              <>
                <p className="text-gray-300 font-medium">Clique ou arraste o JSON aqui</p>
                <p className="text-xs text-gray-500 mt-1">
                  Aceito: Tabela_NCM_Vigente_*.json
                </p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            onChange={handleArquivo}
            className="hidden"
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" /> Preview do arquivo
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{preview.total.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Total entradas</p>
              </div>
              <div className="bg-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{preview.ncms.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">NCMs válidos</p>
              </div>
              <div className="bg-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{preview.ativos.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Vigentes</p>
              </div>
            </div>

            {/* Opção resetar */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setResetar(!resetar)}
                className={`w-12 h-6 rounded-full transition ${resetar ? 'bg-red-500' : 'bg-gray-600'} relative`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${resetar ? 'left-7' : 'left-1'}`} />
              </div>
              <span className="text-sm text-gray-300">
                Apagar índice antes de indexar
                <span className="text-red-400 ml-1">{resetar ? '(⚠️ vai limpar tudo)' : ''}</span>
              </span>
            </label>
          </div>
        )}

        {/* Botão indexar */}
        {documentos && (
          <button
            onClick={handleIndexar}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <><Loader size={22} className="animate-spin" /> Indexando {documentos.length.toLocaleString()} documentos...</>
            ) : (
              <><Database size={22} /> Indexar no Meilisearch</>
            )}
          </button>
        )}

        {/* Resultado */}
        {resultado && (
          <div className="bg-green-900 border border-green-600 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="text-green-400" size={24} />
              <h2 className="font-bold text-green-300 text-lg">Indexação concluída!</h2>
            </div>
            <div className="space-y-1 text-sm text-green-200">
              <p>✅ <strong>{resultado.total.toLocaleString()}</strong> documentos indexados</p>
              <p>📦 <strong>{resultado.lotes}</strong> lotes enviados</p>
              <p>🔍 Índice: <code className="bg-green-800 px-2 py-0.5 rounded">ncm</code></p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
