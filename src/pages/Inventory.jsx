import { useMemo, useState } from 'react'
import ProductForm from '../components/ProductForm'
import ProductTable from '../components/ProductTable'
import { EMPTY_PRODUCT, isLowStock } from '../utils/fields'
import { nextProductId } from '../utils/storage'

export default function Inventory({ products, setProducts }) {
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [editing, setEditing] = useState(null) // null | { product, isEdit }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (lowOnly && !isLowStock(p)) return false
      if (!q) return true
      return [p.id, p.name, p.category, p.sku, p.supplier].some((v) => v.toLowerCase().includes(q))
    })
  }, [products, query, lowOnly])

  const existingIds = useMemo(() => new Set(products.map((p) => p.id)), [products])

  const openAdd = () =>
    setEditing({ product: { ...EMPTY_PRODUCT, id: nextProductId(products) }, isEdit: false })

  const handleSave = (product) => {
    setProducts(
      editing.isEdit
        ? products.map((p) => (p.id === product.id ? product : p))
        : [...products, product]
    )
    setEditing(null)
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
          placeholder="Search by name, ID, SKU, category, supplier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="checkbox">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
        <button className="btn primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <p className="muted">Showing {filtered.length} of {products.length} products</p>

      <ProductTable
        products={filtered}
        onEdit={(p) => setEditing({ product: p, isEdit: true })}
        onDelete={handleDelete}
      />

      {editing && (
        <ProductForm
          initial={editing.product}
          isEdit={editing.isEdit}
          existingIds={existingIds}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </section>
  )
}
