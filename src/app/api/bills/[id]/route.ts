import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { updateBillSchema } from '@/lib/validators'

// GET /api/bills/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bill = await prisma.bill.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        tags: {
          include: {
            tag: { select: { id: true, name: true, color: true } }
          }
        }
      }
    })

    if (!bill) {
      return errorResponse('账单不存在', 404)
    }

    return successResponse({
      ...bill,
      tags: bill.tags.map(bt => bt.tag)
    })
  } catch (error) {
    console.error('获取账单详情失败:', error)
    return errorResponse('获取账单详情失败', 500)
  }
}

// PUT /api/bills/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = updateBillSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(result.error.issues[0].message)
    }

    const existing = await prisma.bill.findFirst({
      where: { id, deletedAt: null }
    })
    if (!existing) {
      return errorResponse('账单不存在', 404)
    }

    const { tagIds, ...data } = result.data

    // 如果更新了金额相关字段，重新计算实付金额
    const updateData: Record<string, unknown> = { ...data }
    if (data.date) updateData.date = new Date(data.date)
    if (data.amount !== undefined || data.discount !== undefined) {
      const amount = data.amount ?? Number(existing.amount)
      const discount = data.discount ?? Number(existing.discount)
      updateData.actualAmount = data.actualAmount ?? amount - discount
    }

    const bill = await prisma.$transaction(async tx => {
      // 更新标签关联
      if (tagIds !== undefined) {
        await tx.billTag.deleteMany({ where: { billId: id } })
        if (tagIds.length > 0) {
          await tx.billTag.createMany({
            data: tagIds.map(tagId => ({ billId: id, tagId }))
          })
        }
      }

      return tx.bill.update({
        where: { id },
        data: updateData,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          tags: {
            include: {
              tag: { select: { id: true, name: true, color: true } }
            }
          }
        }
      })
    })

    return successResponse({
      ...bill,
      tags: bill.tags.map(bt => bt.tag)
    })
  } catch (error) {
    console.error('更新账单失败:', error)
    return errorResponse('更新账单失败', 500)
  }
}

// DELETE /api/bills/[id] - 软删除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.bill.findFirst({
      where: { id, deletedAt: null }
    })
    if (!existing) {
      return errorResponse('账单不存在', 404)
    }

    await prisma.bill.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('删除账单失败:', error)
    return errorResponse('删除账单失败', 500)
  }
}
