// Single source of truth for product fields.
// `key` is the JSON/storage key, `label` is the UI + Excel column name.
// `optional` fields can be hidden per user; the rest drive the Dashboard and can't be.
export const FIELDS = [
  { key: 'id', label: 'Product ID', type: 'text' },
  { key: 'name', label: 'Product Name', type: 'text' },
  { key: 'category', label: 'Category', type: 'text', optional: true },
  { key: 'sku', label: 'SKU', type: 'text', optional: true },
  { key: 'purchasePrice', label: 'Purchase Price', type: 'number' },
  { key: 'sellingPrice', label: 'Selling Price', type: 'number' },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'minStock', label: 'Minimum Stock', type: 'number' },
  { key: 'supplier', label: 'Supplier', type: 'text', optional: true },
]

export const OPTIONAL_FIELDS = FIELDS.filter((f) => f.optional)

// A user's inventory field setup: which optional fields are hidden + their own extra fields.
export const DEFAULT_SCHEMA = { hidden: [], custom: [] }

// Custom field values are stored on the product under "cf_<fieldId>".
const customKey = (c) => `cf_${c.id}`

// The fields to show in the form, table and exports, in order.
export function activeFields(schema = DEFAULT_SCHEMA) {
  return [
    ...FIELDS.filter((f) => !schema.hidden.includes(f.key)),
    ...schema.custom.map((c) => ({ key: customKey(c), label: c.label, type: c.type, options: c.options, custom: true })),
  ]
}

export function emptyProduct(schema = DEFAULT_SCHEMA) {
  const p = Object.fromEntries(FIELDS.map((f) => [f.key, f.type === 'number' ? 0 : '']))
  for (const c of schema.custom) p[customKey(c)] = ''
  return p
}

// Coerce any raw object (form, JSON file, Excel row) into a clean product.
// Values can come keyed by field key or by column label (Excel).
export function normalizeProduct(raw, schema = DEFAULT_SCHEMA) {
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
  // Keep values of custom fields, including ones since removed, so re-adding doesn't lose data.
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('cf_')) p[k] = v == null ? '' : String(v).trim()
  }
  for (const c of schema.custom) {
    const v = raw[customKey(c)] ?? raw[c.label]
    p[customKey(c)] = v == null ? '' : String(v).trim()
  }
  return p
}

export const isLowStock = (p) => p.quantity <= p.minStock
