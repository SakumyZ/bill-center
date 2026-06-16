export type BillType = 'INCOME' | 'EXPENSE'

export interface TreeOption {
  value: string
  title: string
  children?: TreeOption[]
}

export interface CategoryOption extends TreeOption {
  type: BillType
  children?: CategoryOption[]
}

export interface BillModalValues {
  id?: string
  date: string
  type: BillType
  amount: number
  discount?: number
  actualAmount?: number
  remark?: string
  categoryId?: string
  tagIds?: string[]
  source?: string
}

export function convertToCategoryTreeSelectData(
  nodes: Record<string, unknown>[]
): CategoryOption[] {
  return nodes.map(node => ({
    value: node.id as string,
    title: node.name as string,
    type: node.type as BillType,
    children: node.children
      ? convertToCategoryTreeSelectData(node.children as Record<string, unknown>[])
      : undefined
  }))
}

export function convertToTreeSelectData(nodes: Record<string, unknown>[]): TreeOption[] {
  return nodes.map(node => ({
    value: node.id as string,
    title: node.name as string,
    children: node.children
      ? convertToTreeSelectData(node.children as Record<string, unknown>[])
      : undefined
  }))
}

export function filterCategoriesByType(nodes: CategoryOption[], type?: BillType): CategoryOption[] {
  if (!type) {
    return nodes
  }

  return nodes
    .filter(node => node.type === type)
    .map(node => ({
      ...node,
      children: node.children ? filterCategoriesByType(node.children, type) : undefined
    }))
}

export function hasCategoryValue(nodes: CategoryOption[], value?: string): boolean {
  if (!value) {
    return false
  }

  const stack: CategoryOption[] = [...nodes]

  while (stack.length > 0) {
    const current = stack.pop()

    if (!current) {
      continue
    }

    if (current.value === value) {
      return true
    }

    if (current.children?.length) {
      stack.push(...current.children)
    }
  }

  return false
}

export function normalizeTagIds(values: unknown): string[] | undefined {
  if (!Array.isArray(values)) {
    return undefined
  }

  const normalized = values
    .map(value => (typeof value === 'string' ? value : (value as { value?: string }).value))
    .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)

  return normalized.length > 0 ? normalized : undefined
}
