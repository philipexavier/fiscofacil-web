import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const format = req.query.format || 'jsonl'
  const category = req.query.category || null

  let query = supabase
    .from('jurema_dataset')
    .select('*')
    .order('created_at', { ascending: true })

  if (category) query = query.eq('category', category)

  const { data, error } = await query

  if (error) return res.status(500).json({ error: error.message })

  // Montar no formato Ollama
  const entries = data.map(row => ({
    messages: [
      { role: 'system',    content: row.system_prompt },
      { role: 'user',      content: row.user_message },
      { role: 'assistant', content: row.assistant_message },
    ]
  }))

  if (format === 'jsonl') {
    const content = entries.map(e => JSON.stringify(e)).join('\n')
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Disposition', 'attachment; filename="jurema_dataset.jsonl"')
    return res.status(200).send(content)
  }

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="jurema_dataset.json"')
    return res.status(200).json(entries)
  }

  return res.status(400).json({ error: 'format deve ser jsonl ou json' })
}
