import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

function parseContent(content, filename) {
  const ext = path.extname(filename).toLowerCase()
  const examples = []

  // ── JSON ──────────────────────────────────────────────────
  if (ext === '.json') {
    let data
    try { data = JSON.parse(content) } catch { return { error: 'JSON inválido' } }

    const items = Array.isArray(data) ? data : Object.values(data)
    for (const item of items) {
      if (!item || typeof item !== 'object') continue

      // Formato Ollama { messages: [...] }
      if (item.messages) {
        examples.push({ _raw: item, category: 'outro' })
        continue
      }
      // Formato NCM { Codigo, Descricao }
      if (item.Codigo && item.Descricao && String(item.Codigo).includes('.')) {
        examples.push({
          category: 'ncm',
          user: `Qual o NCM de "${item.Descricao}"?`,
          assistant: JSON.stringify({
            ncm: item.Codigo,
            descricao: item.Descricao,
            confianca: 'ALTA',
            justificativa: 'Código NCM oficial Gecex 812/2025.',
            ncms_alternativos: []
          }, null, 2)
        })
        continue
      }
      // Formato genérico { pergunta, resposta }
      const q = item.pergunta || item.question || item.user || item.input || null
      const a = item.resposta || item.answer || item.assistant || item.output || null
      if (q && a) {
        examples.push({ category: item.category || 'outro', user: String(q), assistant: String(a) })
      }
    }
  }

  // ── JSONL ─────────────────────────────────────────────────
  else if (ext === '.jsonl') {
    for (const line of content.split('\n').filter(Boolean)) {
      try {
        const obj = JSON.parse(line)
        if (obj.messages) {
          examples.push({ _raw: obj, category: 'outro' })
        } else {
          const q = obj.pergunta || obj.question || obj.user || obj.input
          const a = obj.resposta || obj.answer || obj.assistant || obj.output
          if (q && a) examples.push({ category: obj.category || 'outro', user: String(q), assistant: String(a) })
        }
      } catch {}
    }
  }

  // ── CSV ───────────────────────────────────────────────────
  else if (ext === '.csv') {
    const lines  = content.split('\n').filter(Boolean)
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const qIdx   = header.findIndex(h => ['pergunta','question','user','input','prompt'].includes(h))
    const aIdx   = header.findIndex(h => ['resposta','answer','assistant','output','completion'].includes(h))
    const cIdx   = header.findIndex(h => h === 'category' || h === 'categoria')

    if (qIdx === -1 || aIdx === -1) {
      return { error: `CSV precisa ter colunas pergunta+resposta. Encontrado: ${header.join(', ')}` }
    }

    for (const line of lines.slice(1)) {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      if (cols[qIdx] && cols[aIdx]) {
        examples.push({
          category:  (cIdx >= 0 ? cols[cIdx] : 'outro') || 'outro',
          user:      cols[qIdx],
          assistant: cols[aIdx]
        })
      }
    }
  }

  // ── MD / TXT / HTML / XML ─────────────────────────────────
  else if (['.md', '.txt', '.html', '.xml'].includes(ext)) {
    // Tenta padrão Q&A explícito: P: ... R: ...
    const qaRegex = /(?:^|\n)(?:P|Q|Pergunta|Question):\s*(.+?)(?:\n)(?:R|A|Resposta|Answer):\s*(.+?)(?=\n(?:P|Q|Pergunta|Question):|$)/gis
    let match
    while ((match = qaRegex.exec(content)) !== null) {
      examples.push({ category: 'outro', user: match[1].trim(), assistant: match[2].trim() })
    }

    // Fallback: divide em chunks
    if (examples.length === 0) {
      const chunks = ext === '.md'
        ? content.split(/\n#{1,3} /).filter(c => c.trim().length > 80)
        : content.split(/\n\n+/).filter(c => c.trim().length > 80)

      for (const chunk of chunks.slice(0, 150)) {
        const firstLine = chunk.split('\n')[0].replace(/[#*]/g, '').trim()
        if (!firstLine) continue
        examples.push({
          category:  'reforma',
          user:      `Explique sobre: "${firstLine.substring(0, 100)}"`,
          assistant: chunk.trim().substring(0, 1200)
        })
      }
    }
  }

  else {
    return { error: `Formato ${ext} não suportado. Use: json, jsonl, csv, md, txt, html, xml` }
  }

  return { examples, total: examples.length }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { content, filename } = req.body

  if (!content || !filename) {
    return res.status(400).json({ error: 'Envie content (string) e filename' })
  }

  const result = parseContent(content, filename)

  if (result.error) return res.status(400).json({ error: result.error })

  return res.status(200).json({
    examples: result.examples,
    total:    result.total,
    filename,
  })
}
