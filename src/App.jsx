import { useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Export from './pages/Export'
import Forms from './pages/Forms'
import Auth from './pages/Auth'
import Account from './pages/Account'
import PublicForm from './pages/PublicForm'
import { api } from './utils/api'
import { DEFAULT_SCHEMA, normalizeProduct } from './utils/fields'
import { takeLegacyProducts } from './utils/storage'

// Public share links look like  #/f/<formId>
const sharedFormId = () => (window.location.hash.match(/^#\/f\/([\w-]+)/) || [])[1]

export default function App() {
  const [publicFormId] = useState(sharedFormId)
  const [user, setUser] = useState(undefined) // undefined = checking, null = logged out
  const [page, setPage] = useState('Dashboard')
  const [products, setProducts] = useState([])
  const [schema, setSchema] = useState(DEFAULT_SCHEMA)
  const [saveError, setSaveError] = useState('')
  const loaded = useRef(false)

  useEffect(() => {
    if (publicFormId) return
    api.get('/api/me').then(setUser, () => setUser(null))
  }, [publicFormId])

  // Load this user's inventory once after login.
  useEffect(() => {
    if (!user) return
    loaded.current = false
    Promise.all([api.get('/api/products'), api.get('/api/inventory-fields')]).then(([list, fields]) => {
      const legacy = list.length ? [] : takeLegacyProducts()
      setSchema(fields)
      setProducts(legacy.length ? legacy : list.map((p) => normalizeProduct(p, fields)))
      loaded.current = true
    })
  }, [user?.id])

  // React state → server on every change (after the first load).
  useEffect(() => {
    if (!user || !loaded.current) return
    api.put('/api/products', products).then(
      () => setSaveError(''),
      (err) => setSaveError(`Could not save changes: ${err.message}`)
    )
  }, [products, user?.id])

  const saveSchema = async (next) => {
    setSchema(await api.put('/api/inventory-fields', next))
  }

  const logout = async () => {
    await api.post('/api/logout').catch(() => {})
    setProducts([])
    setSchema(DEFAULT_SCHEMA)
    setPage('Dashboard')
    setUser(null)
  }

  if (publicFormId) return <PublicForm formId={publicFormId} />
  if (user === undefined) return <p className="empty">Loading…</p>
  if (!user) return <Auth onLogin={setUser} />

  return (
    <>
      <Navbar page={page} onChange={setPage} user={user} onLogout={logout} />
      <main className="container">
        {saveError && <p className="form-error">{saveError}</p>}
        {page === 'Dashboard' && <Dashboard schema={schema} products={products} />}
        {page === 'Inventory' && <Inventory schema={schema} onSchemaChange={saveSchema} products={products} setProducts={setProducts} />}
        {page === 'Forms' && <Forms />}
        {page === 'Account' && <Account user={user} onUserChange={setUser} />}
        {page === 'Export' && <Export schema={schema} products={products} setProducts={setProducts} />}
      </main>
    </>
  )
}
