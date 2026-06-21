import { request } from './request'

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
