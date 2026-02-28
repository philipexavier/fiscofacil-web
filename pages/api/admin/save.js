import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role para escrita server-side
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id, category, messages, meta } = req.body

  if (!messages || messages.length !== 3) {
    return res.status(400).json({ error: 'messages inválidas' })
  }

  // SafeGuard server-side: checar limite de palavras
  const assistantContent = messages.find(m => m.role === 'assistant')?.content || ''
  const wordCount = assistantContent.trim().split(/\s+/).length
  if (wordCount > 400) {
    return res.status(400).json({ error: `Resposta muito longa: ${wordCount} palavras (máx 400)` })
  }

  const { error } = await supabase
    .from('jurema_dataset')
    .insert({
      external_id:     String(id),
      category,
      system_prompt:   messages[0].content,
      user_message:    messages[1].content,
      assistant_message: messages[2].content,
      word_count:      meta.word_count,
      has_json:        meta.has_json,
      source_verified: meta.source_verified,
      within_limit:    meta.within_limit,
      created_at:      meta.created_at,
    })

  if (error) {
    console.error('Supabase insert error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}
