import { useMemo, useState } from 'react'
import ProductForm from '../components/ProductForm'
import ProductTable from '../components/ProductTable'
import InventoryFieldsEditor from '../components/InventoryFieldsEditor'
import StockAdjust from '../components/StockAdjust'
import { activeFields, emptyProduct, isLowStock } from '../utils/fields'
import { nextProductId } from '../utils/storage'

export default function Inventory({ schema, onSchemaChange, products, setProducts }) {
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [adding, setAdding] = useState(null) // null | new product draft
  const [customizing, setCustomizing] = useState(false)
  const [stocking, setStocking] = useState(null) // product whose stock is being updated

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (lowOnly && !isLowStock(p)) return false
      if (!q) return true
      return activeFields(schema)
        .filter((f) => f.type !== 'number')
        .some((f) => String(p[f.key] ?? '').toLowerCase().includes(q))
    })
  }, [products, query, lowOnly, schema])

  const existingIds = useMemo(() => new Set(products.map((p) => p.id)), [products])

  const openAdd = () =>
    setAdding({ ...emptyProduct(schema), id: nextProductId(products) })

  const handleSave = (product) => {
    setProducts([...products, product])
    setAdding(null)
  }

  const handleDelete = (product) => {
    if (window.confirm(`Delete "${product.name}"?`)) {
      setProducts(products.filter((p) => p.id !== product.id))
    }
  }

  return (
    <section>
      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="checkbox">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
        <button className="btn" onClick={() => setCustomizing(true)}>⚙ Customize Fields</button>
        <button className="btn primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <p className="muted">Showing {filtered.length} of {products.length} products</p>

      <ProductTable
        schema={schema}
        products={filtered}
        onStock={setStocking}
        onDelete={handleDelete}
      />

      {adding && (
        <ProductForm
          schema={schema}
          initial={adding}
          existingIds={existingIds}
          onSave={handleSave}
          onCancel={() => setAdding(null)}
        />
      )}
      {stocking && (
        <StockAdjust
          product={stocking}
          onSave={(updated) => {
            setProducts(products.map((p) => (p.id === updated.id ? updated : p)))
            setStocking(null)
          }}
          onCancel={() => setStocking(null)}
        />
      )}
      {customizing && (
        <InventoryFieldsEditor
          schema={schema}
          onSave={async (next) => {
            await onSchemaChange(next)
            setCustomizing(false)
          }}
          onCancel={() => setCustomizing(false)}
        />
      )}
    </section>
  )
}
