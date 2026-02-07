import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { updateTagSchema } from '@/lib/validators'
import { getAllDescendantIds } from '@/lib/tree-utils'

// GET /api/tags/[id] - 获取标签详情
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tag = await prisma.tag.findFirst({
      where: { id, deletedAt: null },
      include: { children: { where: { deletedAt: null } } }
    })

    if (!tag) {
      return errorResponse('标签不存在', 404)
    }

    return successResponse(tag)
  } catch (error) {
    console.error('获取标签详情失败:', error)
    return errorResponse('获取标签详情失败', 500)
  }
}

// PUT /api/tags/[id] - 更新标签
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = updateTagSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(result.error.issues[0].message)
    }

    const existing = await prisma.tag.findFirst({
      where: { id, deletedAt: null }
    })
    if (!existing) {
      return errorResponse('标签不存在', 404)
    }

    if (result.data.parentId === id) {
      return errorResponse('不能将标签设为自己的子标签')
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: result.data
    })

    return successResponse(tag)
  } catch (error) {
    console.error('更新标签失败:', error)
    return errorResponse('更新标签失败', 500)
  }
}

// DELETE /api/tags/[id] - 删除标签（软删除）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.tag.findFirst({
      where: { id, deletedAt: null }
    })
    if (!existing) {
      return errorResponse('标签不存在', 404)
    }

    const allTags = await prisma.tag.findMany({
      where: { deletedAt: null }
    })
    const descendantIds = getAllDescendantIds(allTags as never[], id)

    // 检查关联
    const billTagCount = await prisma.billTag.count({
      where: { tagId: { in: descendantIds } }
    })

    if (billTagCount > 0) {
      return errorResponse(`该标签及其子标签下有 ${billTagCount} 条账单关联，请先处理`)
    }

    await prisma.tag.updateMany({
      where: { id: { in: descendantIds } },
      data: { deletedAt: new Date() }
    })

    return successResponse({ deleted: descendantIds.length })
  } catch (error) {
    console.error('删除标签失败:', error)
    return errorResponse('删除标签失败', 500)
  }
}
