import sampleProducts from '../data/sampleProducts.json'
import { normalizeProduct } from './fields'

const STORAGE_KEY = 'shop-inventory-products'

export function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved).map(normalizeProduct)
  } catch {
    // Corrupt or unavailable storage: fall back to sample data.
  }
  return sampleProducts.map(normalizeProduct)
}

export function saveProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch {
    // Storage full or blocked; data stays in memory for this session.
  }
}

export function nextProductId(products) {
  const max = products.reduce((m, p) => {
    const n = parseInt(String(p.id).replace(/\D/g, ''), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return 'P' + String(max + 1).padStart(3, '0')
}
