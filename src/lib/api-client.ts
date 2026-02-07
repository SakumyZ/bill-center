import { ApiResponse } from '@/lib/api-response'

const BASE_URL = ''

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })
  return res.json()
}

// ============ 分类 API ============

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

// ============ 标签 API ============

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

// ============ 账单 API ============

export async function fetchBills(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value))
      }
    })
  }
  return request<unknown[]>(`/api/bills?${searchParams.toString()}`)
}

export async function createBill(data: Record<string, unknown>) {
  return request('/api/bills', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateBill(id: string, data: Record<string, unknown>) {
  return request(`/api/bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteBill(id: string) {
  return request(`/api/bills/${id}`, { method: 'DELETE' })
}

// ============ 统计 API ============

export async function fetchStatistics(params?: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value))
      }
    })
  }
  return request<unknown>(`/api/bills/statistics?${searchParams.toString()}`)
}

// ============ 上传 API ============

export async function previewUpload(file: File, source: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('source', source)

  const res = await fetch('/api/bills/upload/preview', {
    method: 'POST',
    body: formData
  })
  return res.json()
}

export async function confirmUpload(data: { fileName: string; source: string; bills: unknown[] }) {
  return request('/api/bills/upload/confirm', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// ============ AI API ============

export async function analyzeWithAI(
  bills: Array<{ remark: string; amount: number; type: string }>
) {
  return request('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ bills })
  })
}

// ============ 导入批次 API ============

export async function fetchImportBatches(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value))
      }
    })
  }
  return request<unknown[]>(`/api/import-batches?${searchParams.toString()}`)
}
