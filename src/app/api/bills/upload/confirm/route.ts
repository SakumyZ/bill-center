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

/**
 * 根据分类名称查找分类 ID
 * 支持一级分类和二级分类的查找
 */
async function findCategoryId(
  categoryName?: string,
  subCategoryName?: string,
  type?: string
): Promise<string | null> {
  if (!categoryName && !subCategoryName) {
    return null
  }

  // 如果提供了二级分类，优先查找二级分类
  if (subCategoryName) {
    const subCategory = await prisma.category.findFirst({
      where: {
        name: subCategoryName,
        deletedAt: null,
        parentId: { not: null } // 确保是子分类
      }
    })
    if (subCategory) return subCategory.id
  }

  // 然后查找一级分类
  if (categoryName) {
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
        deletedAt: null,
        type: type as 'INCOME' | 'EXPENSE' | undefined
      }
    })
    if (category) return category.id
  }

  return null
}

/**
 * 根据标签名称列表查找或创建标签
 */
async function findOrCreateTags(tagNames?: string[]): Promise<string[]> {
  if (!tagNames || tagNames.length === 0) {
    return []
  }

  const tagIds: string[] = []

  for (const tagName of tagNames) {
    try {
      let tag = await prisma.tag.findFirst({
        where: {
          name: tagName,
          deletedAt: null
        }
      })

      // 如果标签不存在，自动创建
      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: tagName,
            sort: 0
          }
        })
      }

      tagIds.push(tag.id)
    } catch {
      // 标签处理失败继续下一个
      continue
    }
  }

  return tagIds
}

// POST /api/bills/upload/confirm - 确认导入
export async function POST(request: NextRequest) {
  try {
    const body: ConfirmBody = await request.json()
    const { fileName, source, bills } = body

    if (!bills || bills.length === 0) {
      return errorResponse('没有要导入的账单数据')
    }

    // 预处理：根据分类名称查找分类 ID，根据标签名称查找或创建标签
    const processedBills = await Promise.all(
      bills.map(async bill => {
        let categoryId = bill.categoryId

        // 如果没有 categoryId，尝试根据分类名称查找
        if (!categoryId) {
          categoryId =
            (await findCategoryId(bill.categoryName, bill.subCategoryName, bill.type)) || undefined
        }

        // 处理标签
        let tagIds = bill.tagIds || []
        if (bill.tagNames && bill.tagNames.length > 0) {
          const foundTagIds = await findOrCreateTags(bill.tagNames)
          tagIds = [...new Set([...tagIds, ...foundTagIds])] // 去重合并
        }

        return {
          ...bill,
          categoryId,
          tagIds
        }
      })
    )

    // 去重检测
    const duplicates: number[] = []
    for (let i = 0; i < processedBills.length; i++) {
      const bill = processedBills[i]
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
    const uniqueBills = processedBills.filter((_, i) => !duplicates.includes(i))

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
