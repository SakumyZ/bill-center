import { request } from './request'

export async function fetchTags(params?: { flat?: boolean }) {
  const searchParams = new URLSearchParams()
  if (params?.flat) searchParams.set('flat', 'true')
  return request<unknown[]>(`/api/tags?${searchParams.toString()}`)
}

export async function createTag(data: Record<string, unknown>) {
  return request('/api/tags', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateTag(id: string, data: Record<string, unknown>) {
  return request(`/api/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteTag(id: string) {
  return request(`/api/tags/${id}`, { method: 'DELETE' })
}

export async function reorderTags(updates: Array<{ id: string; parentId: string | null; sort: number }>) {
  return request('/api/tags/reorder', {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
}
