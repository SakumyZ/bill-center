import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

// GET /api/monthly-summaries/trend - 获取历史总资产走势数据
export async function GET(_request: NextRequest) {
  try {
    const summaries = await prisma.monthlySummary.findMany({
      orderBy: {
        month: 'asc'
      }
    })

    const data = summaries.map(s => ({
      month: s.month,
      assets: Number(s.assets)
    }))

    return successResponse(data)
  } catch (error: any) {
    console.error('获取资产走势失败:', error)
    return errorResponse(`获取资产走势失败: ${error?.message || error}`, 500)
  }
}
