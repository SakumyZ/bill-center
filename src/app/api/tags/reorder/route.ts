import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { z } from 'zod'

const reorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    parentId: z.string().min(1).nullable().optional(),
    sort: z.number().int().min(0)
  })
)

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const result = reorderSchema.safeParse(body)
    if (!result.success) {
      return errorResponse(result.error.issues[0].message)
    }

    const updates = result.data

    await prisma.$transaction(
      updates.map(item =>
        prisma.tag.update({
          where: { id: item.id },
          data: {
            parentId: item.parentId || null,
            sort: item.sort
          }
        })
      )
    )

    return successResponse({ updatedCount: updates.length })
  } catch (error) {
    console.error('重新排序标签失败:', error)
    return errorResponse('重新排序标签失败', 500)
  }
}
