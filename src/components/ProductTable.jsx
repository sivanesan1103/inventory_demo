import { isLowStock } from '../utils/fields'
import { money, num } from '../utils/format'

export default function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) return <p className="empty">No products found.</p>

  const showActions = onEdit || onDelete

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>SKU</th>
            <th className="right">Purchase</th>
            <th className="right">Selling</th>
            <th className="right">Qty</th>
            <th className="right">Min</th>
            <th>Supplier</th>
            {showActions && <th></th>}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={isLowStock(p) ? 'low' : ''}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.sku}</td>
              <td className="right">{money(p.purchasePrice)}</td>
              <td className="right">{money(p.sellingPrice)}</td>
              <td className="right">
                {num(p.quantity)}
                {isLowStock(p) && <span className="badge">Low</span>}
              </td>
              <td className="right">{num(p.minStock)}</td>
              <td>{p.supplier}</td>
              {showActions && (
                <td className="actions">
                  {onEdit && <button className="btn small" onClick={() => onEdit(p)}>Edit</button>}
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
