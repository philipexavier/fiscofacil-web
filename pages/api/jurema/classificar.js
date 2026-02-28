export const config = { api: { responseLimit: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { descricao } = req.body
  if (!descricao) return res.status(400).json({ erro: 'Descrição obrigatória.' })

  const JUREMA_URL = process.env.JUREMA_URL  || 'http://jurema-llm:11434'
  const MODELO     = process.env.JUREMA_MODEL || 'jurema-tributaria'

  const prompt = `Você é um especialista em classificação fiscal brasileira.
O usuário descreveu o seguinte produto: "${descricao}"

Responda APENAS com JSON no formato abaixo, sem texto adicional:
{
  "ncm_sugerido": "0000.00.00",
  "descricao_ncm": "Descrição oficial do NCM",
  "confianca": "ALTA|MEDIA|BAIXA",
  "justificativa": "Breve justificativa",
  "ncms_alternativos": ["0000.00.00"]
}`

  try {
    const response = await fetch(`${JUREMA_URL}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    MODELO,
        messages: [{ role: 'user', content: prompt }],
        stream:   true,              // ← stream ativo
        options:  { temperature: 0.1 },
      }),
    })

    if (!response.ok) throw new Error(`Jurema retornou ${response.status}`)

    // SSE para o cliente
    res.setHeader('Content-Type',  'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection',    'keep-alive')

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          const token = json.message?.content || ''
          buffer += token

          // Envia progresso visual para o cliente
          res.write(`data: ${JSON.stringify({ token, buffer })}\n\n`)

          if (json.done) {
            // Extrai JSON final do buffer acumulado
            const match = buffer.match(/\{[\s\S]*\}/)
            if (match) {
              const resultado = JSON.parse(match[0])
              res.write(`data: ${JSON.stringify({ done: true, resultado })}\n\n`)
            } else {
              res.write(`data: ${JSON.stringify({ done: true, erro: 'JSON inválido na resposta' })}\n\n`)
            }
          }
        } catch {}
      }
    }

    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ erro: err.message })}\n\n`)
    res.end()
  }
}
