import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import OpenAI from 'openai'

// POST /api/ai/analyze - AI 分析账单分类和标签
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.longcat.chat/openai'
  const model = process.env.OPENAI_MODEL || 'LongCat-Flash-Lite'

  try {
    const { bills } = (await request.json()) as {
      bills: Array<{ remark: string; amount: number; type: string }>
    }

    if (!bills || bills.length === 0) {
      return errorResponse('请提供账单数据')
    }

    if (!apiKey) {
      return errorResponse('未配置 AI API Key，请在 .env 中设置 OPENAI_API_KEY', 500)
    }

    console.log('[AI 分析] 配置:', { baseURL, model, apiKeySet: !!apiKey })

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
      apiKey: apiKey,
      baseURL: baseURL,
      defaultHeaders: {
        'User-Agent': 'bill-center/1.0'
      }
    })

    const prompt = `你是一个个人财务记账助手。请根据以下账单信息，为每条账单推荐最合适的分类和标签。

可用分类列表：
${categories.map(c => `- ${c.name} (id: ${c.id}, 类型: ${c.type})`).join('\n')}

可用标签列表：
${tags.map(t => `- ${t.name} (id: ${t.id})`).join('\n')}

需要分析的账单列表：
${bills.map((b, i) => `${i + 1}. 备注: "${b.remark}", 金额: ${b.amount}, 类型: ${b.type}`).join('\n')}

请直接返回 JSON 数组格式的结果，每个元素对应一条账单（从索引0开始）：
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

重要：
1. 分类的类型(INCOME/EXPENSE)必须与账单类型匹配
2. 如果没有合适的分类或标签，对应字段返回 null 或空数组
3. confidence 为 0-1 之间的置信度
4. 直接返回 JSON 数组，不要包含任何解释或 markdown 标记`

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })

    console.log('[AI 分析] 请求成功，开始处理响应...')
    const content = completion.choices[0]?.message?.content
    if (!content) {
      return errorResponse('AI 未返回有效结果')
    }

    let suggestions
    try {
      // 清理可能的 markdown 代码块标记
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '')
      }

      const parsed = JSON.parse(cleanContent)
      // 兼容多种返回格式
      suggestions = Array.isArray(parsed)
        ? parsed
        : parsed.suggestions || parsed.results || [parsed]
      console.log('[AI 分析] 解析成功，共 ' + suggestions.length + ' 条建议')
    } catch (error) {
      console.error('JSON 解析失败，内容:', content)
      return errorResponse('AI 返回格式解析失败: ' + (error as Error).message)
    }

    return successResponse(suggestions)
  } catch (error) {
    console.error('AI 分析失败:', error)
    const err = error as any
    let msg = 'AI 分析失败'

    if (err.status === 404) {
      msg = `404 错误 - API 端点不存在。请确认 API Key 和 BaseURL 配置: ${baseURL}`
    } else if (err.status === 401) {
      msg = '401 错误 - API Key 无效或过期'
    } else if (err.status === 429) {
      msg = '429 错误 - 请求过于频繁，请稍后重试'
    } else if (err.message?.includes('ECONNREFUSED')) {
      msg = '连接失败 - 无法连接到 API 服务器'
    }

    return errorResponse(msg, 500)
  }
}
