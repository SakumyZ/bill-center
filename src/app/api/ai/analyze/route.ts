import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import OpenAI from 'openai'

// POST /api/ai/analyze - AI 分析账单分类和标签
export async function POST(request: NextRequest) {
  try {
    const { bills } = (await request.json()) as {
      bills: Array<{ remark: string; amount: number; type: string }>
    }

    if (!bills || bills.length === 0) {
      return errorResponse('请提供账单数据')
    }

    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_BASE_URL
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    if (!apiKey) {
      return errorResponse('未配置 AI API Key，请在 .env 中设置 OPENAI_API_KEY', 500)
    }

    // 获取所有分类和标签
    const [categories, tags] = await Promise.all([
      prisma.category.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, type: true, parentId: true }
      }),
      prisma.tag.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, parentId: true }
      })
    ])

    const openai = new OpenAI({
      apiKey,
      baseURL: baseURL || undefined
    })

    const prompt = `你是一个个人财务记账助手。请根据以下账单信息，为每条账单推荐最合适的分类和标签。

可用分类列表：
${categories.map(c => `- ${c.name} (id: ${c.id}, 类型: ${c.type})`).join('\n')}

可用标签列表：
${tags.map(t => `- ${t.name} (id: ${t.id})`).join('\n')}

需要分析的账单列表：
${bills.map((b, i) => `${i + 1}. 备注: "${b.remark}", 金额: ${b.amount}, 类型: ${b.type}`).join('\n')}

请以 JSON 数组格式返回结果，每个元素对应一条账单：
[
  {
    "index": 0,
    "categoryId": "推荐的分类ID",
    "categoryName": "分类名称",
    "tagIds": ["推荐的标签ID数组"],
    "tagNames": ["标签名称数组"],
    "confidence": 0.9,
    "reason": "推荐理由"
  }
]

注意：
1. 分类的类型(INCOME/EXPENSE)必须与账单类型匹配
2. 如果没有合适的分类或标签，对应字段返回 null 或空数组
3. confidence 为 0-1 之间的置信度
4. 只返回 JSON，不要其他内容`

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return errorResponse('AI 未返回有效结果')
    }

    let suggestions
    try {
      const parsed = JSON.parse(content)
      suggestions = parsed.suggestions || parsed.results || parsed
      if (!Array.isArray(suggestions)) {
        suggestions = [suggestions]
      }
    } catch {
      return errorResponse('AI 返回格式解析失败')
    }

    return successResponse(suggestions)
  } catch (error) {
    console.error('AI 分析失败:', error)
    return errorResponse('AI 分析失败: ' + (error as Error).message, 500)
  }
}
