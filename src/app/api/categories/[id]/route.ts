import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { updateCategorySchema } from '@/lib/validators'
import { getAllDescendantIds } from '@/lib/tree-utils'

// GET /api/categories/[id] - 获取分类详情
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { children: { where: { deletedAt: null } } }
    })

    if (!category) {
      return errorResponse('分类不存在', 404)
    }

    return successResponse(category)
  } catch (error) {
    console.error('获取分类详情失败:', error)
    return errorResponse('获取分类详情失败', 500)
  }
}

// PUT /api/categories/[id] - 更新分类
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = updateCategorySchema.safeParse(body)

    if (!result.success) {
      return errorResponse(result.error.issues[0].message)
    }

    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null }
    })
    if (!existing) {
      return errorResponse('分类不存在', 404)
    }

    // 不能将自己设为自己的子分类
    if (result.data.parentId === id) {
      return errorResponse('不能将分类设为自己的子分类')
    }

    const category = await prisma.category.update({
      where: { id },
      data: result.data
    })

    return successResponse(category)
  } catch (error) {
    console.error('更新分类失败:', error)
    return errorResponse('更新分类失败', 500)
  }
}

// DELETE /api/categories/[id] - 删除分类（软删除）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null }
    })
    if (!existing) {
      return errorResponse('分类不存在', 404)
    }

    // 获取所有子分类
    const allCategories = await prisma.category.findMany({
      where: { deletedAt: null }
    })
    const descendantIds = getAllDescendantIds(allCategories as never[], id)

    // 检查是否有关联的账单
    const billCount = await prisma.bill.count({
      where: {
        categoryId: { in: descendantIds },
        deletedAt: null
      }
    })

    if (billCount > 0) {
      return errorResponse(`该分类及其子分类下有 ${billCount} 条账单，请先处理关联账单`)
    }

    // 软删除该分类及所有子分类
    await prisma.category.updateMany({
      where: { id: { in: descendantIds } },
      data: { deletedAt: new Date() }
    })

    return successResponse({ deleted: descendantIds.length })
  } catch (error) {
    console.error('删除分类失败:', error)
    return errorResponse('删除分类失败', 500)
  }
}
