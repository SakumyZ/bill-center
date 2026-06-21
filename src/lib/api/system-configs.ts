import { request } from './request'

export async function fetchSystemConfigs() {
  return request<Record<string, string>>('/api/system-configs')
}

export async function updateSystemConfigs(configs: Record<string, string>) {
  return request('/api/system-configs', {
    method: 'POST',
    body: JSON.stringify({ configs })
  })
}
