export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { descricao } = req.body
  if (!descricao) return res.status(400).json({ erro: 'Descrição obrigatória.' })

  const JUREMA_URL = process.env.JUREMA_URL || 'http://jurema-llm:11434'
  const MODELO     = process.env.JUREMA_MODEL || 'jurema'

  const prompt = `Você é um especialista em classificação fiscal brasileira.
O usuário descreveu o seguinte produto: "${descricao}"

Responda APENAS com JSON no formato abaixo, sem explicações adicionais:
{
  "ncm_sugerido": "0000.00.00",
  "descricao_ncm": "Descrição oficial do NCM",
  "confianca": "ALTA|MEDIA|BAIXA",
  "justificativa": "Breve justificativa da classificação",
  "ncms_alternativos": ["0000.00.00", "0000.00.00"]
}`

  try {
    const response = await fetch(`${JUREMA_URL}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:  MODELO,
        prompt,
        stream: false,
        options: { temperature: 0.1 },   // baixo para classificação precisa
      }),
    })

    if (!response.ok) throw new Error(`Jurema retornou ${response.status}`)

    const data = await response.json()

    // Extrai JSON da resposta da Jurema
    const texto = data.response || ''
    const match = texto.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Jurema não retornou JSON válido')

    const resultado = JSON.parse(match[0])
    return res.status(200).json(resultado)

  } catch (err) {
    return res.status(500).json({ erro: err.message })
  }
}
