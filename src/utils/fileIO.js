import { activeFields, normalizeProduct } from './fields'

const stamp = () => new Date().toISOString().slice(0, 10)

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------- JSON ----------
export function exportJSON(products) {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' })
  download(blob, `inventory-${stamp()}.json`)
}

export async function importJSON(file, schema) {
  const data = JSON.parse(await file.text())
  if (!Array.isArray(data)) throw new Error('JSON file must contain an array of products.')
  return data.map((p) => normalizeProduct(p, schema))
}

// ---------- Excel ----------
// xlsx is large, so it's loaded only when an Excel action is used.
const loadXLSX = () => import('xlsx')

export async function exportExcel(products, schema) {
  const XLSX = await loadXLSX()
  const fields = activeFields(schema)
  const rows = products.map((p) => Object.fromEntries(fields.map((f) => [f.label, p[f.key] ?? ''])))
  const sheet = XLSX.utils.json_to_sheet(rows, { header: fields.map((f) => f.label) })
  sheet['!cols'] = fields.map((f) => ({ wch: Math.max(12, f.label.length + 2) }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Inventory')
  XLSX.writeFile(book, `inventory-${stamp()}.xlsx`)
}

export async function importExcel(file, schema) {
  const XLSX = await loadXLSX()
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheet = book.Sheets[book.SheetNames[0]]
  if (!sheet) throw new Error('Excel file has no sheets.')
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  return rows.map((p) => normalizeProduct(p, schema))
}

// ---------- Custom form responses ----------
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'form'

// One row per response: "Submitted" + one column per field (duplicate labels get a suffix).
function responseTable(form, entries) {
  const seen = {}
  const headers = form.fields.map((f) => {
    seen[f.label] = (seen[f.label] || 0) + 1
    return seen[f.label] > 1 ? `${f.label} (${seen[f.label]})` : f.label
  })
  const rows = entries.map((e) => {
    const row = { Submitted: new Date(e.createdAt).toLocaleString() }
    form.fields.forEach((f, i) => {
      const v = e.data[f.id] ?? ''
      row[headers[i]] = f.type === 'number' && v !== '' ? Number(v) : v
    })
    return row
  })
  return { headers: ['Submitted', ...headers], rows }
}

export async function exportResponses(form, entries, format) {
  const name = `${slug(form.title)}-responses-${stamp()}`
  const { headers, rows } = responseTable(form, entries)

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    return download(blob, `${name}.json`)
  }

  const XLSX = await loadXLSX()
  const sheet = XLSX.utils.json_to_sheet(rows, { header: headers })
  if (format === 'csv') {
    // BOM so Excel opens non-English text (e.g. Tamil names) correctly.
    const blob = new Blob(['\ufeff' + XLSX.utils.sheet_to_csv(sheet)], { type: 'text/csv;charset=utf-8' })
    return download(blob, `${name}.csv`)
  }
  sheet['!cols'] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }))
  const book = XLSX.utils.book_new()
  // Sheet names: max 31 chars, no : \ / ? * [ ]
  XLSX.utils.book_append_sheet(book, sheet, form.title.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31) || 'Responses')
  XLSX.writeFile(book, `${name}.xlsx`)
}
