const PAGES = ['Dashboard', 'Inventory', 'Export']

export default function Navbar({ page, onChange }) {
  return (
    <header className="navbar">
      <h1 className="brand">📦 Shop Inventory</h1>
      <nav>
        {PAGES.map((p) => (
          <button
            key={p}
            className={page === p ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </nav>
    </header>
  )
}
