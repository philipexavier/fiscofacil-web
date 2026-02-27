import { useState } from 'react'
import { classificarNcm } from '../lib/api'
import toast, { Toaster } from 'react-hot-toast'
import { Package, Info, CheckCircle, ArrowLeft, ArrowRight, Loader } from 'lucide-react'
import Link from 'next/link'

// ── Componente Stepper (barra de progresso) ──────────────────
function Stepper({ etapaAtual }) {
  const etapas = ['Produto', 'Detalhes', 'Resultado']
  return (
    <div className="flex items-center justify-center mb-8">
      {etapas.map((nome, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold
            ${i < etapaAtual ? 'bg-green-500 text-white' :
              i === etapaAtual ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-400'}`}>
            {i < etapaAtual ? '✓' : i + 1}
          </div>
          <span className={`ml-2 text-sm font-medium
            ${i === etapaAtual ? 'text-blue-600' : 'text-gray-400'}`}>
            {nome}
          </span>
          {i < etapas.length - 1 && (
            <div className={`h-1 w-12 mx-3 rounded
              ${i < etapaAtual ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Componente Badge de Confiança ─────────────────────────────
function BadgeConfianca({ nivel }) {
  const cores = {
    ALTO: 'bg-green-100 text-green-700 border-green-300',
    MÉDIO: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    BAIXO: 'bg-red-100 text-red-700 border-red-300',
  }
  return (
    <span className={`border px-3 py-1 rounded-full text-xs font-semibold ${cores[nivel] || cores.BAIXO}`}>
      Confiança: {nivel}
    </span>
  )
}

// ── Componente Badge de Risco Fiscal ──────────────────────────
function BadgeRisco({ risco }) {
  const cores = {
    ALTO: 'bg-red-100 text-red-700',
    MÉDIO: 'bg-yellow-100 text-yellow-700',
    BAIXO: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cores[risco] || cores.BAIXO}`}>
      Risco Fiscal: {risco}
    </span>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function ClassificarNcm() {
  const [etapa, setEtapa] = useState(0)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)

  const [form, setForm] = useState({
    descricao: '',
    marca_fabricante: '',
    gtin: '',
    uso: '',
    composicao: '',
    ncm_atual: '',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Validação etapa 1
  function validarEtapa1() {
    if (!form.descricao.trim()) {
      toast.error('Descrição do produto é obrigatória.')
      return false
    }
    return true
  }

  async function handleClassificar() {
    setLoading(true)
    try {
      const res = await classificarNcm(form)
      setResultado(res.data.data)
      setEtapa(2)
    } catch (err) {
      toast.error('Erro ao classificar. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleNovo() {
    setForm({ descricao: '', marca_fabricante: '', gtin: '', uso: '', composicao: '', ncm_atual: '' })
    setResultado(null)
    setEtapa(0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard">
          <ArrowLeft size={20} className="cursor-pointer hover:opacity-70" />
        </Link>
        <h1 className="text-lg font-bold">Classificação NCM com Jurema IA</h1>
      </nav>

      <div className="max-w-2xl mx-auto mt-10 px-4">
        <Stepper etapaAtual={etapa} />

        {/* ── ETAPA 1: Dados básicos ─────────── */}
        {etapa === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <Package className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Dados do Produto</h2>
            </div>

            <div className="space-y-4">
              {/* Descrição (obrigatória) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição completa do produto <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ex: Parafuso de aço inoxidável cabeça sextavada, M8 x 30mm, para uso industrial..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Quanto mais detalhe, melhor a classificação da Jurema.</p>
              </div>

              {/* GTIN / EAN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Barras (GTIN/EAN)
                </label>
                <input
                  type="text"
                  name="gtin"
                  value={form.gtin}
                  onChange={handleChange}
                  placeholder="Ex: 7891234567890"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {/* Marca e Fabricante */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input
                    type="text"
                    name="marca_fabricante"
                    value={form.marca_fabricante}
                    onChange={handleChange}
                    placeholder="Ex: Tramontina"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NCM atual (se souber)</label>
                  <input
                    type="text"
                    name="ncm_atual"
                    value={form.ncm_atual}
                    onChange={handleChange}
                    placeholder="Ex: 7318.15.00"
                    maxLength={10}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => { if (validarEtapa1()) setEtapa(1) }}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              Próximo <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── ETAPA 2: Detalhes técnicos ──────── */}
        {etapa === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <Info className="text-purple-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Detalhes Técnicos</h2>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Quanto mais detalhe técnico, mais precisa será a Jurema. Campos opcionais.
            </p>

            <div className="space-y-4">
              {/* Uso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uso / Finalidade do produto
                </label>
                <input
                  type="text"
                  name="uso"
                  value={form.uso}
                  onChange={handleChange}
                  placeholder="Ex: Fixação industrial em estruturas metálicas"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {/* Composição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Composição / Material
                </label>
                <input
                  type="text"
                  name="composicao"
                  value={form.composicao}
                  onChange={handleChange}
                  placeholder="Ex: Aço inoxidável AISI 304, revestimento zinco"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {/* Resumo do que vai ser analisado */}
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 border border-blue-100">
                <p className="font-semibold mb-1">📋 Produto a classificar:</p>
                <p><strong>Descrição:</strong> {form.descricao}</p>
                {form.marca_fabricante && <p><strong>Marca:</strong> {form.marca_fabricante}</p>}
                {form.gtin && <p><strong>EAN:</strong> {form.gtin}</p>}
                {form.ncm_atual && <p><strong>NCM atual:</strong> {form.ncm_atual}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEtapa(0)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft size={18} /> Voltar
              </button>
              <button
                onClick={handleClassificar}
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader size={18} className="animate-spin" /> Jurema analisando...</>
                ) : (
                  <><CheckCircle size={18} /> Classificar com Jurema</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── ETAPA 3: Resultado ──────────────── */}
        {etapa === 2 && resultado && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={24} />
                Resultado da Classificação
              </h2>
              <BadgeConfianca nivel={resultado.nivel_confianca} />
            </div>

            {/* NCM Principal */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">NCM Sugerida pela Jurema</p>
              <p className="text-3xl font-bold text-blue-700">{resultado.ncm_sugerida}</p>
              <p className="text-sm text-gray-600 mt-1">{resultado.descricao_ncm}</p>
              <div className="flex gap-2 mt-3">
                <BadgeRisco risco={resultado.risco_fiscal} />
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  IPI: {resultado.aliquota_ipi}
                </span>
              </div>
            </div>

            {/* Justificativa */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">📖 Justificativa Jurema</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                {resultado.justificativa}
              </p>
            </div>

            {/* Regras aplicadas */}
            {resultado.regras_interpretacao_aplicadas?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">⚖️ Regras SH Aplicadas</p>
                <div className="flex flex-wrap gap-2">
                  {resultado.regras_interpretacao_aplicadas.map((r, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Alternativas */}
            {resultado.alternativas?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">🔄 NCMs Alternativos</p>
                <div className="space-y-2">
                  {resultado.alternativas.map((alt, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-3 flex justify-between items-start">
                      <div>
                        <span className="font-bold text-blue-600">{alt.ncm}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{alt.descricao}</p>
                        <p className="text-xs text-gray-400">{alt.motivo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informações faltantes */}
            {resultado.informacoes_necessarias?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-700 mb-2">⚠️ Para maior precisão, forneça:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {resultado.informacoes_necessarias.map((info, i) => (
                    <li key={i}>{info}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleNovo}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50"
              >
                Classificar outro produto
              </button>
              <Link href="/dashboard" className="flex-1">
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700">
                  Voltar ao painel
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
