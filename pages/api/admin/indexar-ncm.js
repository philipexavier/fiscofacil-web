import { MeiliSearch } from 'meilisearch'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fiscofacil_admin_2026'

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).end()

  const { authorization } = req.headers
  if (authorization !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ erro: 'Não autorizado.' })
  }

  const { documentos, resetar } = req.body
  if (!documentos || !Array.isArray(documentos)) {
    return res.status(400).json({ erro: 'Envie um array de documentos.' })
  }

  try {
    const client = new MeiliSearch({
      host:   process.env.MEILISEARCH_URL  || 'http://meilisearch:7700',
      apiKey: process.env.MEILI_MASTER_KEY || '',
    })

    try { await client.createIndex('ncm', { primaryKey: 'id' }) } catch {}
    const index = client.index('ncm')

    // DELETE: apaga tudo ou um documento
    if (req.method === 'DELETE') {
      const { id } = req.query
      if (id !== undefined) {
        await index.deleteDocument(parseInt(id, 10))
        return res.status(200).json({ sucesso: true, deletado: parseInt(id, 10) })
      }
      await index.deleteAllDocuments()
      return res.status(200).json({ sucesso: true, mensagem: 'Índice limpo.' })
    }

    // POST: indexar
    if (resetar) await index.deleteAllDocuments()

    await index.updateSearchableAttributes(['descricao', 'codigo', 'descricao_limpa'])
    await index.updateFilterableAttributes(['nivel', 'ativo', 'capitulo'])

    let lotes = 0
    for (let i = 0; i < documentos.length; i += 1000) {
      await index.addDocuments(documentos.slice(i, i + 1000))
      lotes++
    }

    return res.status(200).json({ sucesso: true, total: documentos.length, lotes })
  } catch (err) {
    return res.status(500).json({ erro: err.message })
  }
}
