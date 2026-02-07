import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { createCategorySchema } from '@/lib/validators'
import { buildTree } from '@/lib/tree-utils'

// GET /api/categories - 获取分类列表（树形结构）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // INCOME | EXPENSE
    const flat = searchParams.get('flat') === 'true'

    const where: Record<string, unknown> = { deletedAt: null }
    if (type) where.type = type

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }]
    })

    if (flat) {
      return successResponse(categories)
    }

    const tree = buildTree(categories as never[])
    return successResponse(tree)
  } catch (error) {
    console.error('获取分类失败:', error)
    return errorResponse('获取分类失败', 500)
  }
}

// POST /api/categories - 创建分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = createCategorySchema.safeParse(body)

    if (!result.success) {
      return errorResponse(result.error.issues[0].message)
    }

    const data = result.data

    // 检查父分类是否存在
    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, deletedAt: null }
      })
      if (!parent) {
        return errorResponse('父分类不存在')
      }
      // 子分类的类型必须和父分类一致
      if (parent.type !== data.type) {
        return errorResponse('子分类的类型必须和父分类一致')
      }
    }

    // 检查同级下是否有重名
    const exists = await prisma.category.findFirst({
      where: {
        name: data.name,
        type: data.type,
        parentId: data.parentId ?? null,
        deletedAt: null
      }
    })
    if (exists) {
      return errorResponse('同级下已存在相同名称的分类')
    }

    const category = await prisma.category.create({ data })
    return successResponse(category)
  } catch (error) {
    console.error('创建分类失败:', error)
    return errorResponse('创建分类失败', 500)
  }
}
