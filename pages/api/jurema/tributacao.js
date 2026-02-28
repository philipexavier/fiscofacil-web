export const config = {
  api: {
    responseLimit: false,
    bodyParser: true,
  },
}

export const maxDuration = 120

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { ncm, descricao_ncm, regime } = req.body
  if (!ncm) return res.status(400).json({ erro: 'NCM obrigatório.' })

  const JUREMA_URL = process.env.JUREMA_URL        || 'https://fiscofacil-ollama-web.9pt9es.easypanel.host'
  const MODELO     = process.env.JUREMA_MODEL      || 'qwen2:1.5b'
  const API_KEY    = process.env.OPENWEBUI_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ5MDhiZjU4LTc4N2EtNGMzMC04Mjc0LTg0NDI4ZTg5YzUzNSIsImV4cCI6MTc3NDczNDgzNywianRpIjoiYjcyMDBmNDktMjJiZi00YTNmLWJkYTAtMDQ3ZmFmNjg4MzBjIn0.Djm3PSj0zBTa0kHk7qwX3zHMQ5nxnJrOWTRGFjiL75g'

  const prompt = `Você é um especialista em reforma tributária brasileira (Lei Complementar 214/2025).
Analise o NCM ${ncm} - "${descricao_ncm}" para uma empresa com regime: ${regime || 'Lucro Presumido'}.

Responda APENAS com JSON, sem texto adicional:
{
  "ncm": "${ncm}",
  "descricao": "${descricao_ncm}",
  "sistema_atual": {
    "pis_cofins": "alíquota atual",
    "icms_medio": "alíquota média",
    "ipi": "alíquota se aplicável",
    "carga_estimada": "percentual total estimado"
  },
  "sistema_novo": {
    "cbs": "alíquota CBS",
    "ibs": "alíquota IBS",
    "is": "Imposto Seletivo se aplicável",
    "carga_estimada": "percentual total estimado"
  },
  "transicao": {
    "2026": "descrição do cenário em 2026",
    "2027_2028": "descrição do cenário",
    "2029_2032": "descrição do cenário",
    "2033": "sistema novo pleno"
  },
  "recomendacao": "recomendação objetiva para o contador",
  "riscos": ["risco 1", "risco 2"],
  "beneficios": ["benefício 1", "benefício 2"]
}`

  try {
    const response = await fetch(`${JUREMA_URL}/api/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model:    MODELO,
        messages: [{ role: 'user', content: prompt }],
        stream:   false,
        options:  { temperature: 0.2 },
      }),
    })

    if (!response.ok) {
      const txt = await response.text()
      throw new Error(`OpenWebUI ${response.status}: ${txt}`)
    }

    const data  = await response.json()
    // Formato OpenAI: choices[0].message.content
    const texto = data.choices?.[0]?.message?.content || ''

    console.log('JUREMA tributacao RAW:', texto)

    const match = texto.match(/\{[\s\S]*\}/)
    if (!match) throw new Error(`Resposta inválida: ${texto.substring(0, 200)}`)

    return res.status(200).json(JSON.parse(match[0]))
  } catch (err) {
    console.error('JUREMA tributacao ERROR:', err.message)
    return res.status(500).json({ erro: err.message })
  }
}
