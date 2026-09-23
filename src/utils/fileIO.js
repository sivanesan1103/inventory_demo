import { FIELDS, normalizeProduct } from './fields'

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

export async function importJSON(file) {
  const data = JSON.parse(await file.text())
  if (!Array.isArray(data)) throw new Error('JSON file must contain an array of products.')
  return data.map(normalizeProduct)
}

// ---------- Excel ----------
// xlsx is large, so it's loaded only when an Excel action is used.
const loadXLSX = () => import('xlsx')

export async function exportExcel(products) {
  const XLSX = await loadXLSX()
  const rows = products.map((p) => Object.fromEntries(FIELDS.map((f) => [f.label, p[f.key]])))
  const sheet = XLSX.utils.json_to_sheet(rows, { header: FIELDS.map((f) => f.label) })
  sheet['!cols'] = FIELDS.map((f) => ({ wch: Math.max(12, f.label.length + 2) }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Inventory')
  XLSX.writeFile(book, `inventory-${stamp()}.xlsx`)
}

export async function importExcel(file) {
  const XLSX = await loadXLSX()
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheet = book.Sheets[book.SheetNames[0]]
  if (!sheet) throw new Error('Excel file has no sheets.')
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  return rows.map(normalizeProduct)
}
