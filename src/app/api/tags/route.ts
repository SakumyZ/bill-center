import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { createTagSchema } from '@/lib/validators'
import { buildTree } from '@/lib/tree-utils'

// GET /api/tags - 获取标签列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flat = searchParams.get('flat') === 'true'

    const tags = await prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }]
    })

    if (flat) {
      return successResponse(tags)
    }

    const tree = buildTree(tags as never[])
    return successResponse(tree)
  } catch (error) {
    console.error('获取标签失败:', error)
    return errorResponse('获取标签失败', 500)
  }
}

// POST /api/tags - 创建标签
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = createTagSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(result.error.issues[0].message)
    }

    const data = result.data

    if (data.parentId) {
      const parent = await prisma.tag.findFirst({
        where: { id: data.parentId, deletedAt: null }
      })
      if (!parent) {
        return errorResponse('父标签不存在')
      }
    }

    // 检查同级下是否有重名
    const exists = await prisma.tag.findFirst({
      where: {
        name: data.name,
        parentId: data.parentId ?? null,
        deletedAt: null
      }
    })
    if (exists) {
      return errorResponse('同级下已存在相同名称的标签')
    }

    const tag = await prisma.tag.create({ data })
    return successResponse(tag)
  } catch (error) {
    console.error('创建标签失败:', error)
    return errorResponse('创建标签失败', 500)
  }
}
