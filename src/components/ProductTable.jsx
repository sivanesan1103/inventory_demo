import { activeFields, isLowStock } from '../utils/fields'
import { money, num } from '../utils/format'

const SHORT_LABELS = { id: 'ID', name: 'Name', purchasePrice: 'Purchase', sellingPrice: 'Selling', quantity: 'Qty', minStock: 'Min' }

function cell(p, f) {
  const v = p[f.key]
  if (f.key === 'purchasePrice' || f.key === 'sellingPrice') return money(v)
  if (f.key === 'quantity' || f.key === 'minStock') return num(v)
  return v === '' || v == null ? '—' : v
}

export default function ProductTable({ schema, products, onStock, onDelete }) {
  if (products.length === 0) return <p className="empty">No products found.</p>

  const fields = activeFields(schema)
  const showActions = onStock || onDelete

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f.key} className={f.type === 'number' ? 'right' : ''}>{SHORT_LABELS[f.key] || f.label}</th>
            ))}
            {showActions && <th></th>}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={isLowStock(p) ? 'low' : ''}>
              {fields.map((f) => (
                <td key={f.key} className={f.type === 'number' ? 'right' : ''}>
                  {cell(p, f)}
                  {f.key === 'quantity' && isLowStock(p) && <span className="badge">Low</span>}
                </td>
              ))}
              {showActions && (
                <td className="actions">
                  {onStock && <button className="btn small" onClick={() => onStock(p)}>± Stock</button>}
                  {onDelete && <button className="btn small danger" onClick={() => onDelete(p)}>Delete</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
