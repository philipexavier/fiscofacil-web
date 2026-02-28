export const config = { api: { responseLimit: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { descricao } = req.body
  if (!descricao) return res.status(400).json({ erro: 'Descrição obrigatória.' })

  const JUREMA_URL = process.env.JUREMA_URL        || 'https://fiscofacil-ollama-web.9pt9es.easypanel.host'
  const MODELO     = process.env.JUREMA_MODEL      || 'qwen2:1.5b'
  const API_KEY    = process.env.OPENWEBUI_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ5MDhiZjU4LTc4N2EtNGMzMC04Mjc0LTg0NDI4ZTg5YzUzNSIsImV4cCI6MTc3NDczNDgzNywianRpIjoiYjcyMDBmNDktMjJiZi00YTNmLWJkYTAtMDQ3ZmFmNjg4MzBjIn0.Djm3PSj0zBTa0kHk7qwX3zHMQ5nxnJrOWTRGFjiL75g'

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
    res.setHeader('Content-Type',  'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection',    'keep-alive')

    const response = await fetch(`${JUREMA_URL}/api/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model:    MODELO,
        messages: [{ role: 'user', content: prompt }],
        stream:   true,
        options:  { temperature: 0.1 },
      }),
    })

    if (!response.ok) {
      const txt = await response.text()
      throw new Error(`OpenWebUI ${response.status}: ${txt}`)
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n').filter(Boolean)

      for (const line of lines) {
        // OpenWebUI envia "data: {...}" prefixado
        const raw = line.startsWith('data: ') ? line.slice(6) : line

        // Sinal de fim do stream
        if (raw === '[DONE]') {
          const match = buffer.match(/\{[\s\S]*\}/)
          if (match) {
            try {
              const resultado = JSON.parse(match[0])
              res.write(`data: ${JSON.stringify({ done: true, resultado })}\n\n`)
            } catch {
              res.write(`data: ${JSON.stringify({ done: true, erro: 'JSON inválido na resposta', raw: buffer })}\n\n`)
            }
          } else {
            res.write(`data: ${JSON.stringify({ done: true, erro: 'Sem JSON na resposta', raw: buffer })}\n\n`)
          }
          continue
        }

        try {
          const json  = JSON.parse(raw)
          // Formato OpenAI streaming: choices[0].delta.content
          const token = json.choices?.[0]?.delta?.content || ''
          if (token) {
            buffer += token
            res.write(`data: ${JSON.stringify({ token, buffer })}\n\n`)
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
