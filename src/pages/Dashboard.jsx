import StatCard from '../components/StatCard'
import ProductTable from '../components/ProductTable'
import { isLowStock } from '../utils/fields'
import { money, num } from '../utils/format'

export default function Dashboard({ schema, products }) {
  const totalStock = products.reduce((s, p) => s + p.quantity, 0)
  const costValue = products.reduce((s, p) => s + p.purchasePrice * p.quantity, 0)
  const retailValue = products.reduce((s, p) => s + p.sellingPrice * p.quantity, 0)
  const lowStock = products.filter(isLowStock)
  const profit = retailValue - costValue
  const lossMaking = products.filter((p) => p.sellingPrice < p.purchasePrice)

  return (
    <section>
      <div className="stats">
        <StatCard label="Total Products" value={num(products.length)} />
        <StatCard label="Total Stock" value={num(totalStock)} />
        <StatCard label="Inventory Value (Cost)" value={money(costValue)} />
        <StatCard label="Inventory Value (Retail)" value={money(retailValue)} />
        <StatCard label={profit < 0 ? 'Potential Loss' : 'Potential Profit'} value={money(profit)} tone={profit < 0 ? 'bad' : 'good'} />
        <StatCard label="Low Stock" value={num(lowStock.length)} tone={lowStock.length ? 'warn' : ''} />
      </div>

      {lossMaking.length > 0 && (
        <>
          <h2 className="section-title">⚠ Selling Below Cost</h2>
          <p className="muted">These products sell for less than they cost to buy — check the prices.</p>
          <ProductTable schema={schema} products={lossMaking} />
        </>
      )}

      <h2 className="section-title">Low Stock Products</h2>
      {lowStock.length === 0 ? (
        <p className="empty">All products are above minimum stock. 👍</p>
      ) : (
        <ProductTable schema={schema} products={lowStock} />
      )}
    </section>
  )
}
