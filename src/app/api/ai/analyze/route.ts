import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import OpenAI from 'openai'

// POST /api/ai/analyze - AI 分析账单分类和标签
export async function POST(request: NextRequest) {
  let baseURL = 'https://api.longcat.chat/openai'
  try {
    const { bills } = (await request.json()) as {
      bills: Array<{ remark: string; amount: number; type: string }>
    }

    if (!bills || bills.length === 0) {
      return errorResponse('请提供账单数据')
    }

    // 从数据库获取配置，若无则后备环境变量
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['ai_enabled', 'ai_api_key', 'ai_base_url', 'ai_model', 'ai_guidance']
        }
      }
    })
    const configMap: Record<string, string> = {}
    configs.forEach(cfg => {
      configMap[cfg.key] = cfg.value
    })

    const aiGuidance = configMap['ai_guidance'] || ''

    const isEnabled = configMap['ai_enabled'] ?? 'true' // 默认开启
    const apiKey = configMap['ai_api_key'] || process.env.OPENAI_API_KEY
    baseURL = configMap['ai_base_url'] || process.env.OPENAI_BASE_URL || 'https://api.longcat.chat/openai'
    const model = configMap['ai_model'] || process.env.OPENAI_MODEL || 'LongCat-Flash-Lite'

    if (isEnabled !== 'true') {
      return errorResponse('AI 账单分析功能未启用，请到“系统设置”中开启', 400)
    }

    if (!apiKey) {
      return errorResponse('未配置 AI API Key，请先到“系统设置”中配置', 400)
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
${aiGuidance ? `
【用户自定义匹配引导规则】
如果账单的备注(remark)或内容包含指定的关键字，你必须严格优先归类到指定的分类和标签。
规则格式为：关键字-分类-标签（每行一条）
用户配置的规则列表如下：
${aiGuidance}
` : ''}
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
    "reason": "推荐理由",
    "progress": 20
  }
]

重要：
1. 分类的类型(INCOME/EXPENSE)必须与账单类型匹配
2. 如果没有合适的分类或标签，对应字段返回 null 或空数组
3. confidence 为 0-1 之间的置信度
4. 每个返回的账单对象中必须包含一个 "progress" 属性，其值为当前进度占总账单数量的百分比整数值。计算公式为：Math.round(((当前账单索引 + 1) / 总账单数量) * 100)。
5. 直接返回包含以上对象的 JSON 数组，不要包含任何 markdown 代码块、解释或进度标记。整个回复必须是合法的 JSON 数组，以便直接解析。`

    const responseStream = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      stream: true
    })

    const encoder = new TextEncoder()
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    })
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
