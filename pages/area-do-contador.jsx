// pages/area-do-contador.jsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  AlertTriangle,
  Activity,
  FileText,
  MessageCircle,
  Database,
  ClipboardList,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import UserMenu from '../components/UserMenu'

export default function AreaDoContador() {
  const router = useRouter()
  const [sessionChecked, setSessionChecked] = useState(false)
  const [usuario, setUsuario] = useState(null)

  // mocks provisórios – depois você pode puxar isso de APIs/Meilisearch
  const itensRiscoMock = [
    { ncm: '2101.11.10', desc: 'Extratos de café', risco: 'ALTO', impacto: '+3,5 p.p.' },
    { ncm: '3004.90.99', desc: 'Medicamentos diversos', risco: 'MÉDIO', impacto: '-1,2 p.p.' },
    { ncm: '8501.10.29', desc: 'Motores elétricos', risco: 'ALTO', impacto: '+2,0 p.p.' },
  ]

  const cronogramaMock = [
    { ano: '2026', evento: 'Início da transição, testes de IBS/CBS em alíquota reduzida.' },
    { ano: '2027–2029', evento: 'Aumento gradual da participação do IBS/CBS e redução dos tributos atuais.' },
    { ano: '2030–2032', evento: 'Fase final de substituição dos tributos antigos.' },
    { ano: '2033', evento: 'Predomínio do IBS/CBS e extinção de PIS, COFINS, ICMS e ISS.' },
  ]

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/login')
      } else {
        setUsuario(data.session.user)
        setSessionChecked(true)
      }
    }
    checkSession()
  }, [router])

  if (!sessionChecked) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col px-4 pb-10">
      {/* Topo */}
      <header className="w-full max-w-6xl mx-auto mt-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-sky-300 hover:border-sky-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <Image
            src="/logo.png"
            alt="FiscoFácil"
            width={130}
            height={40}
            className="object-contain"
            priority
          />
          <div className="border-l border-slate-700 pl-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Painel do Contador</p>
            <p className="text-xs font-semibold text-sky-400">Inteligência Tributária</p>
          </div>
        </div>
        {usuario && <UserMenu usuario={usuario} />}
      </header>

      <main className="w-full max-w-6xl mx-auto space-y-6">
        {/* Atalhos principais */}
        <section className="grid md:grid-cols-3 gap-4">
          <Link href="/area-do-contador">
            <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={18} className="text-sky-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  Chat tributário (NCM → IBS/CBS)
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Converse com a Jurema sobre enquadramento, riscos e impactos da Reforma por NCM e regime.
              </p>
            </div>
          </Link>

          <Link href="/busca-em-massa">
            <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={18} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  Revisão de cadastro em lote
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Suba planilhas de produtos, receba NCM sugerido, risco fiscal e confiança para priorizar o retrabalho.
              </p>
            </div>
          </Link>

          <Link href="/admin/meilisearch">
            <div className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/70 transition">
              <div className="flex items-center gap-2 mb-2">
                <Database size={18} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  Índice NCM (Meilisearch)
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Atualize a Tabela NCM oficial no motor de busca para manter consultas rápidas e consistentes.
              </p>
            </div>
          </Link>
        </section>

        {/* Radar de risco por NCM */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100">
                Radar de NCMs críticos para a Reforma
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Use a busca em massa para atualizar esta lista com dados reais.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">NCM</th>
                  <th className="py-2 pr-3">Descrição</th>
                  <th className="py-2 pr-3">Risco</th>
                  <th className="py-2 pr-3">Impacto IBS/CBS</th>
                </tr>
              </thead>
              <tbody>
                {itensRiscoMock.map((item) => (
                  <tr key={item.ncm} className="border-b border-slate-900">
                    <td className="py-2 pr-3 font-mono text-sky-300">{item.ncm}</td>
                    <td className="py-2 pr-3 text-slate-100">{item.desc}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.risco === 'ALTO'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {item.risco}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-100">{item.impacto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cronograma de transição */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-100">
                Cronograma da Reforma 2026–2033
              </h2>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {cronogramaMock.map((etapa) => (
                <li key={etapa.ano} className="flex gap-3">
                  <span className="font-mono text-[11px] bg-slate-950 border border-slate-700 px-2 py-1 rounded flex-shrink-0">
                    {etapa.ano}
                  </span>
                  <p>{etapa.evento}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-sky-400" />
              <h2 className="text-sm font-semibold text-slate-100">
                Próximos passos para o escritório
              </h2>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              <li>• Rodar a <strong>busca em massa</strong> com os principais clientes e mapear NCMs de risco.</li>
              <li>• Usar o <strong>chat da Jurema</strong> para validar NCM e tributação em casos duvidosos.</li>
              <li>• Ajustar cadastros e regras fiscais no ERP à luz do cronograma de transição.</li>
              <li>• Manter o índice do <strong>Meilisearch</strong> atualizado com a Tabela NCM vigente.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
