import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, paginationParams } from '@/lib/api-response'

// GET /api/import-batches - 获取导入批次列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, pageSize, skip } = paginationParams(searchParams)

    const [batches, total] = await Promise.all([
      prisma.importBatch.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          _count: { select: { bills: true } }
        }
      }),
      prisma.importBatch.count()
    ])

    return successResponse(batches, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('获取导入批次失败:', error)
    return errorResponse('获取导入批次失败', 500)
  }
}
