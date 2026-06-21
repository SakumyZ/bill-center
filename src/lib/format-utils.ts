export const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '0.00'
  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const parseCurrency = (value: string | undefined) => {
  if (!value) return 0
  return Number(value.replace(/\$\s?|(,*)/g, ''))
}
