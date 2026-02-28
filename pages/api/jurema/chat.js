export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { mensagem, historico = [] } = req.body
  if (!mensagem) return res.status(400).json({ erro: 'Mensagem obrigatória.' })

  const JUREMA_URL = process.env.JUREMA_URL  || 'http://jurema-llm:11434'
  const MODELO     = process.env.JUREMA_MODEL || 'jurema'

  const sistema = `Você é a Jurema, assistente especialista em reforma tributária brasileira.
Seu foco é a transição do sistema antigo (ICMS, ISS, PIS, COFINS) para o novo (IBS, CBS, IS) 
conforme a Lei Complementar 214/2025, com transição gradual de 2026 a 2033.
Responda sempre em português, de forma objetiva e técnica para contadores e empresários.`

  // Monta histórico no formato Ollama
  const mensagens = [
    { role: 'system',    content: sistema },
    ...historico,
    { role: 'user', content: mensagem },
  ]

  try {
    // Streaming SSE
    res.setHeader('Content-Type',  'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection',    'keep-alive')

    const response = await fetch(`${JUREMA_URL}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    MODELO,
        messages: mensagens,
        stream:   true,
        options:  { temperature: 0.3 },
      }),
    })

    if (!response.ok) throw new Error(`Jurema retornou ${response.status}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.message?.content) {
            res.write(`data: ${JSON.stringify({ token: json.message.content })}\n\n`)
          }
          if (json.done) {
            res.write(`data: [DONE]\n\n`)
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
