import fs from 'fs'
import path from 'path'
import { IncomingForm } from 'formidable'

export const config = {
  api: { bodyParser: false }  // necessário para upload de arquivo
}

// Parse do arquivo conforme extensão
function parseFile(filepath, filename) {
  const ext  = path.extname(filename).toLowerCase()
  const raw  = fs.readFileSync(filepath, 'utf-8')
  const examples = []

  // ── JSON ──────────────────────────────────────────────────
  if (ext === '.json') {
    let data
    try { data = JSON.parse(raw) } catch { return { error: 'JSON inválido' } }

    const items = Array.isArray(data) ? data : Object.values(data)
    for (const item of items) {
      // Formato já no padrão Ollama { messages: [...] }
      if (item.messages) {
        examples.push({ _raw: item, category: 'outro' })
        continue
      }
      // Formato NCM: { Codigo, Descricao }
      if (item.Codigo && item.Descricao && item.Codigo.includes('.')) {
        examples.push({
          category: 'ncm',
          user: `Qual o NCM de "${item.Descricao}"?`,
          assistant: JSON.stringify({
            ncm: item.Codigo,
            descricao: item.Descricao,
            confianca: 'ALTA',
            justificativa: `Código NCM oficial Gecex 812/2025.`,
            ncms_alternativos: []
          }, null, 2)
        })
        continue
      }
      // Formato genérico { pergunta/question/user, resposta/answer/assistant }
      const q = item.pergunta || item.question || item.user || item.input || null
      const a = item.resposta || item.answer || item.assistant || item.output || null
      if (q && a) {
        examples.push({ category: item.category || 'outro', user: String(q), assistant: String(a) })
      }
    }
  }

  // ── CSV ───────────────────────────────────────────────────
  else if (ext === '.csv') {
    const lines  = raw.split('\n').filter(Boolean)
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g,''))
    const qIdx   = header.findIndex(h => ['pergunta','question','user','input','prompt'].includes(h))
    const aIdx   = header.findIndex(h => ['resposta','answer','assistant','output','completion'].includes(h))
    const cIdx   = header.findIndex(h => h === 'category' || h === 'categoria')

    if (qIdx === -1 || aIdx === -1) return { error: `CSV precisa ter colunas: pergunta,resposta (encontrado: ${header.join(',')})` }

    for (const line of lines.slice(1)) {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g,''))
      if (cols[qIdx] && cols[aIdx]) {
        examples.push({
          category: (cIdx >= 0 ? cols[cIdx] : 'outro') || 'outro',
          user:      cols[qIdx],
          assistant: cols[aIdx]
        })
      }
    }
  }

  // ── JSONL ─────────────────────────────────────────────────
  else if (ext === '.jsonl') {
    for (const line of raw.split('\n').filter(Boolean)) {
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

  // ── MD / TXT / HTML / XML ─────────────────────────────────
  else if (['.md', '.txt', '.html', '.xml'].includes(ext)) {
    // Padrão Q&A explícito: linhas com "P:" ou "R:" ou "Q:" ou "A:"
    const qaRegex = /(?:^|\n)(?:P|Q|Pergunta|Question):\s*(.+?)(?:\n)(?:R|A|Resposta|Answer):\s*(.+?)(?=\n(?:P|Q|Pergunta|Question):|$)/gis
    let match
    while ((match = qaRegex.exec(raw)) !== null) {
      examples.push({
        category: 'outro',
        user:      match[1].trim(),
        assistant: match[2].trim()
      })
    }

    // Se não achou Q&A explícito, divide em chunks por artigo/seção
    if (examples.length === 0) {
      const chunks = ext === '.md'
        ? raw.split(/\n#{1,3} /).filter(c => c.trim().length > 80)
        : raw.split(/\n\n+/).filter(c => c.trim().length > 80)

      for (const chunk of chunks.slice(0, 150)) {
        const firstLine = chunk.split('\n')[0].replace(/[#*]/g,'').trim()
        if (!firstLine) continue
        examples.push({
          category: 'reforma',
          user:      `Explique sobre: "${firstLine.substring(0, 100)}"`,
          assistant: chunk.trim().substring(0, 1200)
        })
      }
    }
  }

  else {
    return { error: `Formato .${ext} não suportado. Use: json, jsonl, csv, md, txt, html, xml` }
  }

  return { examples, total: examples.length }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const form = new IncomingForm({ keepExtensions: true, maxFileSize: 50 * 1024 * 1024 })

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Erro ao processar upload: ' + err.message })

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' })

    const result = parseFile(file.filepath, file.originalFilename || file.newFilename)

    if (result.error) return res.status(400).json({ error: result.error })

    return res.status(200).json({
      examples: result.examples,
      total:    result.total,
      filename: file.originalFilename
    })
  })
}
