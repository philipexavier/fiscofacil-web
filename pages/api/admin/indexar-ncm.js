import meilisearch from 'meilisearch'

// Só permite acesso com senha admin
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fiscofacil_admin_2026'

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } }  // JSON grande
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verifica senha
  const { authorization } = req.headers
  if (authorization !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ erro: 'Não autorizado.' })
  }

  const { documentos, resetar } = req.body

  if (!documentos || !Array.isArray(documentos)) {
    return res.status(400).json({ erro: 'Envie um array de documentos.' })
  }

  try {
    const client = new meilisearch.MeiliSearch({
      host:   process.env.MEILISEARCH_URL  || 'http://meilisearch:7700',
      apiKey: process.env.MEILI_MASTER_KEY || '',
    })

    // Cria ou limpa índice
    try { await client.createIndex('ncm', { primaryKey: 'id' }) } catch {}

    const index = client.index('ncm')

    if (resetar) {
      await index.deleteAllDocuments()
    }

    // Configura atributos
    await index.updateSearchableAttributes(['descricao', 'codigo', 'descricao_limpa'])
    await index.updateFilterableAttributes(['nivel', 'ativo', 'capitulo'])

    // Indexa em lotes de 1000
    const LOTE = 1000
    let tasks = []
    for (let i = 0; i < documentos.length; i += LOTE) {
      const lote = documentos.slice(i, i + LOTE)
      const task = await index.addDocuments(lote)
      tasks.push(task.taskUid)
    }

    return res.status(200).json({
      sucesso: true,
      total: documentos.length,
      lotes: tasks.length,
      tasks,
    })
  } catch (err) {
    return res.status(500).json({ erro: err.message })
  }
}
