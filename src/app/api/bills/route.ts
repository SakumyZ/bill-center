import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, paginationParams } from '@/lib/api-response'
import { createBillSchema } from '@/lib/validators'
import { getAllDescendantIds } from '@/lib/tree-utils'
import { Prisma } from '@/generated/prisma/client'

// GET /api/bills - 获取账单列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, pageSize, skip } = paginationParams(searchParams)

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const categoryId = searchParams.get('categoryId')
    const tagId = searchParams.get('tagId')
    const sortField = searchParams.get('sortField') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const keyword = searchParams.get('keyword')

    // 构建查询条件
    const where: Prisma.BillWhereInput = { deletedAt: null }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Prisma.DateTimeFilter).gte = new Date(startDate)
      if (endDate) (where.date as Prisma.DateTimeFilter).lte = new Date(endDate)
    }

    if (type) where.type = type as 'INCOME' | 'EXPENSE'

    // 按分类筛选（包含子分类）
    if (categoryId) {
      const allCategories = await prisma.category.findMany({
        where: { deletedAt: null }
      })
      const categoryIds = getAllDescendantIds(allCategories as never[], categoryId)
      where.categoryId = { in: categoryIds }
    }

    // 按标签筛选（包含子标签）
    if (tagId) {
      const allTags = await prisma.tag.findMany({
        where: { deletedAt: null }
      })
      const tagIds = getAllDescendantIds(allTags as never[], tagId)
      where.tags = { some: { tagId: { in: tagIds } } }
    }

    if (keyword) {
      where.remark = { contains: keyword, mode: 'insensitive' }
    }

    const orderBy: Prisma.BillOrderByWithRelationInput = {}
    if (sortField === 'amount') {
      orderBy.amount = sortOrder as 'asc' | 'desc'
    } else if (sortField === 'actualAmount') {
      orderBy.actualAmount = sortOrder as 'asc' | 'desc'
    } else {
      orderBy.date = sortOrder as 'asc' | 'desc'
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          tags: {
            include: {
              tag: { select: { id: true, name: true, color: true } }
            }
          }
        },
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.bill.count({ where })
    ])

    // 转换标签结构
    const formattedBills = bills.map(bill => ({
      ...bill,
      tags: bill.tags.map(bt => bt.tag)
    }))

    return successResponse(formattedBills, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('获取账单列表失败:', error)
    return errorResponse('获取账单列表失败', 500)
  }
}

// POST /api/bills - 创建账单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = createBillSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(result.error.issues[0].message)
    }

    const { tagIds, ...data } = result.data

    // 计算实付金额
    const actualAmount = data.actualAmount ?? data.amount - data.discount

    const bill = await prisma.bill.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        amount: data.amount,
        discount: data.discount,
        actualAmount,
        remark: data.remark,
        source: data.source,
        categoryId: data.categoryId,
        tags: {
          create: tagIds.map(tagId => ({ tagId }))
        }
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        tags: {
          include: {
            tag: { select: { id: true, name: true, color: true } }
          }
        }
      }
    })

    return successResponse({
      ...bill,
      tags: bill.tags.map(bt => bt.tag)
    })
  } catch (error) {
    console.error('创建账单失败:', error)
    return errorResponse('创建账单失败', 500)
  }
}
