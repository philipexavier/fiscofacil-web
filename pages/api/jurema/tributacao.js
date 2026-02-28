export const config = {
  api: {
    responseLimit: false,
    bodyParser: true,
  },
}

// Aumenta timeout para 120s
export const maxDuration = 120

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { ncm, descricao_ncm, regime } = req.body
  if (!ncm) return res.status(400).json({ erro: 'NCM obrigatório.' })

  const JUREMA_URL = process.env.JUREMA_URL  || 'http://jurema-llm:11434'
  const MODELO     = process.env.JUREMA_MODEL || 'jurema'

  const prompt = `Você é um especialista em reforma tributária brasileira (Lei Complementar 214/2025).
Analise o NCM ${ncm} - "${descricao_ncm}" para uma empresa com regime: ${regime || 'Lucro Presumido'}.

Responda em JSON:
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
    const response = await fetch(`${JUREMA_URL}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:  MODELO,
        prompt,
        stream: false,
        options: { temperature: 0.2 },
      }),
    })

    if (!response.ok) throw new Error(`Jurema retornou ${response.status}`)

    const data  = await response.json()
    const texto = data.response || ''
    const match = texto.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Resposta inválida da Jurema')

    return res.status(200).json(JSON.parse(match[0]))
  } catch (err) {
    return res.status(500).json({ erro: err.message })
  }
}
