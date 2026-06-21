import { request } from './request'

export async function fetchCategories(params?: { type?: string; flat?: boolean }) {
  const searchParams = new URLSearchParams()
  if (params?.type) searchParams.set('type', params.type)
  if (params?.flat) searchParams.set('flat', 'true')
  return request<unknown[]>(`/api/categories?${searchParams.toString()}`)
}

export async function createCategory(data: Record<string, unknown>) {
  return request('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCategory(id: string, data: Record<string, unknown>) {
  return request(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteCategory(id: string) {
  return request(`/api/categories/${id}`, { method: 'DELETE' })
}

export async function reorderCategories(updates: Array<{ id: string; parentId: string | null; sort: number }>) {
  return request<{ updatedCount: number }>('/api/categories/reorder', {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
}
