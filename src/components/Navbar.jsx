const PAGES = ['Dashboard', 'Inventory', 'Forms', 'Export']

export default function Navbar({ page, onChange, user, onLogout }) {
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
      <div className="user-menu">
        <button className={page === 'Account' ? 'user-btn active' : 'user-btn'} onClick={() => onChange('Account')} title="My Account">
          👤 {user.username}{!user.email && ' ⚠'}
        </button>
        <button className="btn small" onClick={onLogout}>Log out</button>
      </div>
    </header>
  )
}
