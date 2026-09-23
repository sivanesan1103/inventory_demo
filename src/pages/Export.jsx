import { useState } from 'react'
import { exportExcel, exportJSON, importExcel, importJSON } from '../utils/fileIO'
import { activeFields } from '../utils/fields'

// Merge imported products into existing ones: same Product ID = update, new ID = add.
function merge(existing, incoming) {
  const map = new Map(existing.map((p) => [p.id, p]))
  for (const p of incoming) if (p.id) map.set(p.id, p)
  return [...map.values()]
}

export default function Export({ schema, products, setProducts }) {
  const [replace, setReplace] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }

  const handleImport = (reader) => async (e) => {
    const file = e.target.files[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    try {
      const incoming = (await reader(file, schema)).filter((p) => p.id)
      if (incoming.length === 0) throw new Error('No products with a Product ID were found.')
      setProducts(replace ? incoming : merge(products, incoming))
      setMessage({ type: 'ok', text: `Imported ${incoming.length} products from ${file.name}.` })
    } catch (err) {
      setMessage({ type: 'error', text: `Import failed: ${err.message}` })
    }
  }

  return (
    <section>
      <div className="export-grid">
        <div className="card">
          <h2>JSON</h2>
          <p className="muted">Full backup of your inventory data.</p>
          <button className="btn primary" onClick={() => exportJSON(products)}>Export JSON</button>
          <label className="btn file-btn">
            Import JSON
            <input type="file" accept=".json,application/json" onChange={handleImport(importJSON)} hidden />
          </label>
        </div>

        <div className="card">
          <h2>Excel (.xlsx)</h2>
          <p className="muted">Columns: {activeFields(schema).map((f) => f.label).join(', ')}.</p>
          <button className="btn primary" onClick={() => exportExcel(products, schema)}>Export Excel</button>
          <label className="btn file-btn">
            Import Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleImport(importExcel)} hidden />
          </label>
        </div>
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
        Replace all existing products on import (otherwise merge by Product ID)
      </label>

      {message && <p className={message.type === 'ok' ? 'success' : 'error'}>{message.text}</p>}
    </section>
  )
}
