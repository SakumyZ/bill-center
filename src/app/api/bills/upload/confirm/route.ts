import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { type ParsedBill } from '@/lib/bill-parser'

interface ConfirmBody {
  fileName: string
  source: 'YIMU' | 'OTHER'
  bills: (ParsedBill & {
    categoryId?: string
    tagIds?: string[]
  })[]
}

// POST /api/bills/upload/confirm - 确认导入
export async function POST(request: NextRequest) {
  try {
    const body: ConfirmBody = await request.json()
    const { fileName, source, bills } = body

    if (!bills || bills.length === 0) {
      return errorResponse('没有要导入的账单数据')
    }

    // 去重检测
    const duplicates: number[] = []
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i]
      const existing = await prisma.bill.findFirst({
        where: {
          date: new Date(bill.date),
          amount: bill.amount,
          remark: bill.remark || null,
          deletedAt: null
        }
      })
      if (existing) {
        duplicates.push(i)
      }
    }

    // 过滤掉重复的
    const uniqueBills = bills.filter((_, i) => !duplicates.includes(i))

    // 创建导入批次
    const batch = await prisma.importBatch.create({
      data: {
        fileName,
        source,
        totalCount: bills.length,
        successCount: uniqueBills.length,
        failCount: duplicates.length
      }
    })

    // 批量创建账单
    let successCount = 0
    const errors: string[] = []

    for (const bill of uniqueBills) {
      try {
        await prisma.bill.create({
          data: {
            date: new Date(bill.date),
            type: bill.type,
            amount: bill.amount,
            discount: bill.discount,
            actualAmount: bill.actualAmount,
            remark: bill.remark || null,
            source,
            categoryId: bill.categoryId || null,
            importBatchId: batch.id,
            tags: bill.tagIds?.length
              ? { create: bill.tagIds.map(tagId => ({ tagId })) }
              : undefined
          }
        })
        successCount++
      } catch (error) {
        errors.push(`导入失败: ${bill.date} ${bill.amount} - ${(error as Error).message}`)
      }
    }

    // 更新批次统计
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        successCount,
        failCount: bills.length - successCount
      }
    })

    return successResponse({
      batchId: batch.id,
      total: bills.length,
      success: successCount,
      duplicates: duplicates.length,
      failed: errors.length,
      errors
    })
  } catch (error) {
    console.error('导入账单失败:', error)
    return errorResponse('导入账单失败: ' + (error as Error).message, 500)
  }
}
