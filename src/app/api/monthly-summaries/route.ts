import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

// GET /api/monthly-summaries - 获取单月总结与总资产数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return errorResponse('请提供合法的月份参数 (格式: YYYY-MM)', 400)
    }

    const summary = await prisma.monthlySummary.findUnique({
      where: { month }
    })

    if (!summary) {
      return successResponse({
        month,
        content: '',
        assets: 0
      })
    }

    return successResponse({
      month: summary.month,
      content: summary.content,
      assets: Number(summary.assets)
    })
  } catch (error: any) {
    console.error('获取月度总结失败:', error)
    return errorResponse(`获取月度总结失败: ${error?.message || error}`, 500)
  }
}

// POST /api/monthly-summaries - 创建或更新单月总结与总资产
export async function POST(request: NextRequest) {
  try {
    const { month, content, assets } = (await request.json()) as {
      month: string
      content?: string
      assets?: number
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return errorResponse('请提供合法的月份参数 (格式: YYYY-MM)', 400)
    }

    const result = await prisma.monthlySummary.upsert({
      where: { month },
      update: {
        content: content || '',
        assets: assets || 0
      },
      create: {
        month,
        content: content || '',
        assets: assets || 0
      }
    })

    return successResponse({
      month: result.month,
      content: result.content,
      assets: Number(result.assets)
    })
  } catch (error: any) {
    console.error('更新月度总结失败:', error)
    return errorResponse(`更新月度总结失败: ${error?.message || error}`, 500)
  }
}
