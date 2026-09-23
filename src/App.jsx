import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Export from './pages/Export'
import { loadProducts, saveProducts } from './utils/storage'

export default function App() {
  const [page, setPage] = useState('Dashboard')
  const [products, setProducts] = useState(loadProducts)

  // React state → JSON → localStorage on every change.
  useEffect(() => saveProducts(products), [products])

  return (
    <>
      <Navbar page={page} onChange={setPage} />
      <main className="container">
        {page === 'Dashboard' && <Dashboard products={products} />}
        {page === 'Inventory' && <Inventory products={products} setProducts={setProducts} />}
        {page === 'Export' && <Export products={products} setProducts={setProducts} />}
      </main>
    </>
  )
}
