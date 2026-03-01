// pages/api/admin/meili-search.js
// Consulta o índice NCM no Meilisearch: stats + busca de documentos
import { MeiliSearch } from 'meilisearch'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fiscofacil_admin_2026'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { authorization } = req.headers
  if (authorization !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ erro: 'Não autorizado.' })
  }

  try {
    const client = new MeiliSearch({
      host:   process.env.MEILISEARCH_URL  || 'http://meilisearch:7700',
      apiKey: process.env.MEILI_MASTER_KEY || '',
    })

    const index = client.index('ncm')

    const [stats, results] = await Promise.all([
      index.getStats().catch(() => null),
      index.search(req.query.q || '', {
        limit: parseInt(req.query.limit || '20', 10),
      }),
    ])

    return res.status(200).json({
      stats,
      hits: results.hits || [],
    })
  } catch (err) {
    return res.status(500).json({ erro: err.message })
  }
}
