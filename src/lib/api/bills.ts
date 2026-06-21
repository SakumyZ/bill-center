import { request } from './request'

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
