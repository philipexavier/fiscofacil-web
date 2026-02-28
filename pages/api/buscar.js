import { MeiliSearch } from 'meilisearch'

export default async function handler(req, res) {
  const { q, nivel, limit = 20 } = req.query

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ hits: [], total: 0 })
  }

  try {
    const client = new MeiliSearch({
      host:   process.env.MEILISEARCH_URL  || 'http://meilisearch:7700',
      apiKey: process.env.MEILI_MASTER_KEY || '',
    })

    const index = client.index('ncm')

    const filtros = ['ativo = true']
    if (nivel) filtros.push(`nivel = "${nivel}"`)

    const resultado = await index.search(q, {
      limit:       parseInt(limit),
      filter:      filtros.join(' AND '),
      attributesToHighlight: ['descricao', 'codigo'],
      highlightPreTag:  '<mark>',
      highlightPostTag: '</mark>',
    })

    return res.status(200).json({
      hits:  resultado.hits,
      total: resultado.estimatedTotalHits,
      query: q,
    })
  } catch (err) {
    return res.status(500).json({ erro: err.message, hits: [], total: 0 })
  }
}
