// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { mensagem, historico = [] } = req.body
  if (!mensagem) return res.status(400).json({ erro: 'Mensagem obrigatória.' })

  const JUREMA_URL =
    process.env.JUREMA_URL || 'https://fiscofacil-ollama-web.9pt9es.easypanel.host'
  const MODELO = process.env.JUREMA_MODEL || 'qwen2:1.5b'
  const API_KEY =
    process.env.OPENWEBUI_API_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ5MDhiZjU4LTc4N2EtNGMzMC04Mjc0LTg0NDI4ZTg5YzUzNSIsImV4cCI6MTc3NDczNDgzNywianRpIjoiYjcyMDBmNDktMjJiZi00YTNmLWJkYTAtMDQ3ZmFmNjg4MzBjIn0.Djm3PSj0zBTa0kHk7qwX3zHMQ5nxnJrOWTRGFjiL75g'

  if (!API_KEY) {
    return res.status(500).json({ erro: 'OPENWEBUI_API_KEY não configurada.' })
  }

  const sistema = `Você é a Jurema, assistente especialista em reforma tributária brasileira.
Seu foco é a transição do sistema antigo (ICMS, ISS, PIS, COFINS) para o novo (IBS, CBS, IS)
conforme a Lei Complementar 214/2025, com transição gradual de 2026 a 2033.
Responda sempre em português, de forma objetiva e técnica para contadores e empresários.
Limite suas respostas a no máximo 300 palavras.`

  const mensagens = [
    { role: 'system', content: sistema },
    ...historico,
    { role: 'user', content: mensagem },
  ]

  try {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const response = await fetch(`${JUREMA_URL}/api/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODELO,
        messages: mensagens,
        stream: true,
        options: { temperature: 0.3 },
      }),
    })

    if (!response.ok) {
      const txt = await response.text()
      throw new Error(`OpenWebUI ${response.status}: ${txt}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        const raw = line.startsWith('data: ') ? line.slice(6) : line

        if (raw === '[DONE]') {
          res.write('data: [DONE]\n\n')
          continue
        }

        try {
          const json = JSON.parse(raw)
          const token = json.choices?.[0]?.delta?.content
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`)
          }
        } catch {
          // ignora linhas que não são JSON
        }
      }
    }

    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ erro: err.message })}\n\n`)
    res.end()
  }
}
