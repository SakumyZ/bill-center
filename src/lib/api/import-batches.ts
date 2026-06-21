import { request } from './request'

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
