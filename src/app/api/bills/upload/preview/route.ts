import { NextRequest } from 'next/server'
import { getParser } from '@/lib/bill-parser'
import { successResponse, errorResponse } from '@/lib/api-response'

// POST /api/bills/upload/preview - 预览上传文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = (formData.get('source') as string) || 'YIMU'

    if (!file) {
      return errorResponse('请上传文件')
    }

    const buffer = await file.arrayBuffer()
    const parser = getParser(source)
    const result = parser.parse(buffer)

    return successResponse({
      fileName: file.name,
      source,
      ...result
    })
  } catch (error) {
    console.error('预览上传文件失败:', error)
    return errorResponse('解析文件失败: ' + (error as Error).message, 500)
  }
}
