import { z } from 'zod'

// ============ 分类 ============

export const createCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符'),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sort: z.number().int().min(0).optional().default(0),
  parentId: z.string().uuid().optional().nullable()
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

// ============ 标签 ============

export const createTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称不能超过50个字符'),
  color: z.string().max(20).optional().nullable(),
  sort: z.number().int().min(0).optional().default(0),
  parentId: z.string().uuid().optional().nullable()
})

export const updateTagSchema = createTagSchema.partial()

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>

// ============ 账单 ============

export const createBillSchema = z.object({
  date: z.string().or(z.date()),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('金额必须大于0'),
  discount: z.number().min(0).optional().default(0),
  actualAmount: z.number().optional(),
  remark: z.string().optional().nullable(),
  source: z.enum(['MANUAL', 'YIMU', 'OTHER']).optional().default('MANUAL'),
  categoryId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([])
})

export const updateBillSchema = createBillSchema.partial()

export type CreateBillInput = z.infer<typeof createBillSchema>
export type UpdateBillInput = z.infer<typeof updateBillSchema>

// ============ 导入 ============

export const importBillSchema = z.object({
  source: z.enum(['YIMU', 'OTHER']),
  bills: z.array(createBillSchema)
})

export type ImportBillInput = z.infer<typeof importBillSchema>
