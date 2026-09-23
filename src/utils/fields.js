// Single source of truth for product fields.
// `key` is the JSON/localStorage key, `label` is the UI + Excel column name.
export const FIELDS = [
  { key: 'id', label: 'Product ID', type: 'text' },
  { key: 'name', label: 'Product Name', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'sku', label: 'SKU', type: 'text' },
  { key: 'purchasePrice', label: 'Purchase Price', type: 'number' },
  { key: 'sellingPrice', label: 'Selling Price', type: 'number' },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'minStock', label: 'Minimum Stock', type: 'number' },
  { key: 'supplier', label: 'Supplier', type: 'text' },
]

export const EMPTY_PRODUCT = Object.fromEntries(
  FIELDS.map((f) => [f.key, f.type === 'number' ? 0 : ''])
)

// Coerce any raw object (form, JSON file, Excel row) into a clean product.
export function normalizeProduct(raw) {
  const p = {}
  for (const f of FIELDS) {
    const v = raw[f.key] ?? raw[f.label]
    if (f.type === 'number') {
      const n = Number(v)
      p[f.key] = Number.isFinite(n) && n >= 0 ? n : 0
    } else {
      p[f.key] = v == null ? '' : String(v).trim()
    }
  }
  return p
}

export const isLowStock = (p) => p.quantity <= p.minStock
