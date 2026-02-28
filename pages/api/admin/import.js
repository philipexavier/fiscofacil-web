import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { source } = req.body
  // source: 'ncm' | 'ec132' | 'lc214' | 'lc227'

  const dataDir = path.join(process.cwd(), 'public', 'data')
  let examples = []

  if (source === 'ncm') {
    const raw = fs.readFileSync(path.join(dataDir, 'Tabela_NCM_Vigente_20260227.json'), 'utf-8')
    const tabela = JSON.parse(raw)

    // Gera pares: "Qual o NCM de X?" → JSON com código
    examples = tabela
      .filter(item => item.Codigo && item.Descricao && item.Codigo.includes('.'))
      .slice(0, 200) // primeiros 200
      .map(item => ({
        category: 'ncm',
        user: `Qual o NCM de "${item.Descricao.toLowerCase()}"?`,
        assistant: JSON.stringify({
          ncm: item.Codigo,
          descricao: item.Descricao,
          confianca: 'ALTA',
          justificativa: `Código NCM oficial conforme Resolução Gecex nº 812/2025, vigente desde ${item.DataInicio || '01/04/2022'}.`,
          ncms_alternativos: []
        }, null, 2)
      }))
  }

  if (source === 'lc214' || source === 'ec132' || source === 'lc227') {
    const fileMap = {
      lc214: 'LC214.md',
      ec132: 'EC132.md',
      lc227: 'LC227.md',
    }
    const content = fs.readFileSync(path.join(dataDir, fileMap[source]), 'utf-8')

    // Divide em chunks de artigos e gera Q&A
    const artigos = content.match(/Art\.\s*\d+[^]*?(?=Art\.\s*\d+|$)/g) || []

    examples = artigos
      .slice(0, 100)
      .filter(a => a.trim().length > 100)
      .map(artigo => {
        const num = artigo.match(/Art\.\s*(\d+)/)?.[1] || '?'
        return {
          category: 'reforma',
          user: `O que diz o artigo ${num} da ${source.toUpperCase().replace('LC', 'LC ')}?`,
          assistant: artigo.trim().substring(0, 800)
        }
      })
  }

  return res.status(200).json({ examples, total: examples.length })
}
