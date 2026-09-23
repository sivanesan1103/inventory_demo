import { normalizeProduct } from './fields'

const LEGACY_KEY = 'shop-inventory-products'

// Products saved in this browser before accounts existed, so they can be moved to the server once.
export function takeLegacyProducts() {
  try {
    const saved = localStorage.getItem(LEGACY_KEY)
    if (!saved) return []
    localStorage.removeItem(LEGACY_KEY)
    return JSON.parse(saved).map((p) => normalizeProduct(p))
  } catch {
    return []
  }
}

export function nextProductId(products) {
  const max = products.reduce((m, p) => {
    const n = parseInt(String(p.id).replace(/\D/g, ''), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return 'P' + String(max + 1).padStart(3, '0')
}
