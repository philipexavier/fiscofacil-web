export const config = { api: { responseLimit: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { descricao } = req.body
  if (!descricao) return res.status(400).json({ erro: 'Descrição obrigatória.' })

  const JUREMA_URL = process.env.JUREMA_URL        || 'https://fiscofacil-ollama-web.9pt9es.easypanel.host'
  const MODELO     = process.env.JUREMA_MODEL      || 'qwen2:1.5b'
  const API_KEY    = process.env.OPENWEBUI_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ5MDhiZjU4LTc4N2EtNGMzMC04Mjc0LTg0NDI4ZTg5YzUzNSIsImV4cCI6MTc3NDczNDgzNywianRpIjoiYjcyMDBmNDktMjJiZi00YTNmLWJkYTAtMDQ3ZmFmNjg4MzBjIn0.Djm3PSj0zBTa0kHk7qwX3zHMQ5nxnJrOWTRGFjiL75g'

  // Prompt com exemplo concreto para forçar preenchimento correto
  const prompt = `Classifique o produto fiscal brasileiro: "${descricao}"

Use a tabela NCM disponível nos documentos para encontrar o código correto.

Exemplo de resposta para "parafuso de aço inoxidável":
{"ncm_sugerido":"7318.15.00","descricao_ncm":"Parafusos de ferro ou aço","confianca":"ALTA","justificativa":"Parafusos de aço inoxidável se enquadram no capítulo 73 da NCM, posição 7318, que trata de parafusos, pinos, porcas e artigos semelhantes","ncms_alternativos":["7318.14.00","7318.16.00"]}

Responda SOMENTE com JSON preenchido com dados reais para o produto "${descricao}". Escolha confianca como ALTA, MEDIA ou BAIXA:`

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
    let   flushed = false  // garante que [DONE] seja processado só uma vez

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n').filter(Boolean)

      for (const line of lines) {
        const raw = line.startsWith('data: ') ? line.slice(6) : line

        if (raw === '[DONE]') {
          if (flushed) continue
          flushed = true

          // Tenta extrair JSON do buffer acumulado
          // Suporta resposta com markdown ```json ... ``` ou JSON puro
          const cleaned = buffer
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim()

          const match = cleaned.match(/\{[\s\S]*\}/)

          if (match) {
            try {
              const resultado = JSON.parse(match[0])

              // Normaliza campos obrigatórios caso o modelo omita algum
              const normalizado = {
                ncm_sugerido:      resultado.ncm_sugerido      || '0000.00.00',
                descricao_ncm:     resultado.descricao_ncm     || descricao,
                confianca:         ['ALTA','MEDIA','BAIXA'].includes(resultado.confianca)
                                     ? resultado.confianca : 'BAIXA',
                justificativa:     resultado.justificativa     || 'Classificação baseada na tabela NCM vigente',
                ncms_alternativos: Array.isArray(resultado.ncms_alternativos)
                                     ? resultado.ncms_alternativos : [],
              }

              res.write(`data: ${JSON.stringify({ done: true, resultado: normalizado })}\n\n`)
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
          const token = json.choices?.[0]?.delta?.content || ''
          if (token) {
            buffer += token
            res.write(`data: ${JSON.stringify({ token, buffer })}\n\n`)
          }
        } catch {}
      }
    }

    // Fallback: stream terminou sem [DONE] (alguns proxies cortam)
    if (!flushed && buffer) {
      const cleaned = buffer.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const match   = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          const resultado = JSON.parse(match[0])
          res.write(`data: ${JSON.stringify({ done: true, resultado })}\n\n`)
        } catch {
          res.write(`data: ${JSON.stringify({ done: true, erro: 'JSON inválido (fallback)', raw: buffer })}\n\n`)
        }
      } else {
        res.write(`data: ${JSON.stringify({ done: true, erro: 'Stream encerrado sem JSON', raw: buffer })}\n\n`)
      }
    }

    res.end()
  } catch (err) {
    console.error('JUREMA classificar ERROR:', err.message)
    res.write(`data: ${JSON.stringify({ erro: err.message })}\n\n`)
    res.end()
  }
}
