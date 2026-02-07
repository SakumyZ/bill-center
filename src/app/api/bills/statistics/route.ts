import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { getAllDescendantIds } from '@/lib/tree-utils'
import { Prisma } from '@/generated/prisma/client'

// GET /api/bills/statistics - 账单统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')
    const tagId = searchParams.get('tagId')
    const dimension = searchParams.get('dimension') || 'month' // year | month | day

    // 构建基础筛选条件
    const where: Prisma.BillWhereInput = { deletedAt: null }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Prisma.DateTimeFilter).gte = new Date(startDate)
      if (endDate) (where.date as Prisma.DateTimeFilter).lte = new Date(endDate)
    }

    if (categoryId) {
      const allCategories = await prisma.category.findMany({ where: { deletedAt: null } })
      const ids = getAllDescendantIds(allCategories as never[], categoryId)
      where.categoryId = { in: ids }
    }

    if (tagId) {
      const allTags = await prisma.tag.findMany({ where: { deletedAt: null } })
      const ids = getAllDescendantIds(allTags as never[], tagId)
      where.tags = { some: { tagId: { in: ids } } }
    }

    // 1. 收支概览
    const [incomeAgg, expenseAgg, totalCount] = await Promise.all([
      prisma.bill.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { actualAmount: true },
        _count: true
      }),
      prisma.bill.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { actualAmount: true },
        _count: true
      }),
      prisma.bill.count({ where })
    ])

    const overview = {
      totalIncome: Number(incomeAgg._sum.actualAmount || 0),
      totalExpense: Number(expenseAgg._sum.actualAmount || 0),
      netIncome:
        Number(incomeAgg._sum.actualAmount || 0) - Number(expenseAgg._sum.actualAmount || 0),
      totalCount,
      incomeCount: incomeAgg._count,
      expenseCount: expenseAgg._count
    }

    // 2. 分类统计
    const categoryStats = await prisma.bill.groupBy({
      by: ['categoryId'],
      where: { ...where, categoryId: { not: null } },
      _sum: { actualAmount: true },
      _count: true
    })

    const categoryIds = categoryStats.map(s => s.categoryId!).filter(Boolean)
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true, icon: true, type: true }
    })
    const categoryMap = new Map(categories.map(c => [c.id, c]))

    const categoryData = categoryStats.map(s => ({
      categoryId: s.categoryId,
      category: categoryMap.get(s.categoryId!) || null,
      totalAmount: Number(s._sum.actualAmount || 0),
      count: s._count
    }))

    // 3. 趋势数据 (使用原始SQL按时间维度分组)
    let dateFormat: string
    switch (dimension) {
      case 'year':
        dateFormat = 'YYYY'
        break
      case 'day':
        dateFormat = 'YYYY-MM-DD'
        break
      default:
        dateFormat = 'YYYY-MM'
    }

    const trendData = await prisma.$queryRaw<
      Array<{ period: string; type: string; total: number; count: bigint }>
    >`
      SELECT
        TO_CHAR(date, ${dateFormat}) as period,
        type,
        SUM("actualAmount")::float as total,
        COUNT(*)::bigint as count
      FROM bills
      WHERE "deletedAt" IS NULL
        ${startDate ? Prisma.sql`AND date >= ${new Date(startDate)}` : Prisma.sql``}
        ${endDate ? Prisma.sql`AND date <= ${new Date(endDate)}` : Prisma.sql``}
      GROUP BY period, type
      ORDER BY period ASC
    `

    const trend = trendData.map(t => ({
      period: t.period,
      type: t.type,
      total: Number(t.total),
      count: Number(t.count)
    }))

    // 4. 标签使用频率（词云数据）
    const tagStats = await prisma.billTag.groupBy({
      by: ['tagId'],
      _count: true
    })

    const tagIds = tagStats.map(s => s.tagId)
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds }, deletedAt: null },
      select: { id: true, name: true, color: true }
    })
    const tagMap = new Map(tags.map(t => [t.id, t]))

    const tagCloud = tagStats
      .filter(s => tagMap.has(s.tagId))
      .map(s => ({
        tagId: s.tagId,
        name: tagMap.get(s.tagId)!.name,
        color: tagMap.get(s.tagId)!.color,
        count: s._count
      }))
      .sort((a, b) => b.count - a.count)

    // 5. 大额账单 TOP 10
    const topBills = await prisma.bill.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        tags: {
          include: {
            tag: { select: { id: true, name: true, color: true } }
          }
        }
      },
      orderBy: { actualAmount: 'desc' },
      take: 10
    })

    const formattedTopBills = topBills.map(bill => ({
      ...bill,
      tags: bill.tags.map(bt => bt.tag)
    }))

    return successResponse({
      overview,
      categoryData,
      trend,
      tagCloud,
      topBills: formattedTopBills
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return errorResponse('获取统计数据失败', 500)
  }
}
