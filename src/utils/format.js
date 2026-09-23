const currency = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const money = (n) => currency.format(n || 0)
export const num = (n) => (n || 0).toLocaleString()
