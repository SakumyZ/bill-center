import { request } from './request'

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
