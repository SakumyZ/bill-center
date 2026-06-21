import { request } from './request'

export async function fetchMonthlySummary(month: string) {
  return request<{ month: string; content: string; assets: number }>(
    `/api/monthly-summaries?month=${month}`
  )
}

export async function updateMonthlySummary(
  month: string,
  data: { content: string; assets: number }
) {
  return request<{ month: string; content: string; assets: number }>('/api/monthly-summaries', {
    method: 'POST',
    body: JSON.stringify({ month, ...data })
  })
}

export async function fetchAssetsTrend() {
  return request<Array<{ month: string; assets: number }>>('/api/monthly-summaries/trend')
}
