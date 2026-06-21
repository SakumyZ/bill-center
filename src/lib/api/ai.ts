import { request } from './request'

export async function analyzeWithAI(
  bills: Array<{ remark: string; amount: number; type: string }>
) {
  return request('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ bills })
  })
}

export async function testAIConnection(params: {
  apiKey?: string
  baseURL?: string
  model?: string
}) {
  return request<{ reply?: string }>('/api/ai/test', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}
