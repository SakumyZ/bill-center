import { prisma } from '@/lib/prisma'

type BillTypeValue = 'INCOME' | 'EXPENSE'

export async function validateBillCategory(
  categoryId: string | null | undefined,
  type: BillTypeValue
) {
  if (!categoryId) {
    return null
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, deletedAt: null },
    select: { type: true }
  })

  if (!category) {
    return '所选分类不存在'
  }

  if (category.type !== type) {
    return type === 'INCOME' ? '收入账单只能选择收入分类' : '支出账单只能选择支出分类'
  }

  return null
}
