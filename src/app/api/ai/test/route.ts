import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import OpenAI from 'openai'

// POST /api/ai/test - 测试 AI 连通性
export async function POST(request: NextRequest) {
  try {
    const { apiKey, baseURL, model } = (await request.json()) as {
      apiKey?: string
      baseURL?: string
      model?: string
    }

    // 处理配置 fallback
    // 如果用户提交的是掩码，或者未提供，我们需要从数据库/环境变量获取真实的 Key
    let realApiKey = apiKey
    if (!realApiKey || realApiKey === '******') {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'ai_api_key' }
      })
      realApiKey = config?.value || process.env.OPENAI_API_KEY
    }

    let realBaseURL = baseURL
    if (!realBaseURL) {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'ai_base_url' }
      })
      realBaseURL = config?.value || process.env.OPENAI_BASE_URL || 'https://api.longcat.chat/openai'
    }

    let realModel = model
    if (!realModel) {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'ai_model' }
      })
      realModel = config?.value || process.env.OPENAI_MODEL || 'LongCat-Flash-Lite'
    }

    if (!realApiKey) {
      return errorResponse('未配置 API Key，无法进行测试', 400)
    }

    console.log('[AI 连通性测试] 开始测试端点:', realBaseURL, '模型:', realModel)

    const openai = new OpenAI({
      apiKey: realApiKey,
      baseURL: realBaseURL,
      defaultHeaders: {
        'User-Agent': 'bill-center/1.0'
      },
      timeout: 10000 // 10秒超时限制
    })

    // 发起极简的 Chat 问答来测试
    const completion = await openai.chat.completions.create({
      model: realModel,
      messages: [{ role: 'user', content: 'Say ok' }],
      max_tokens: 5
    })

    const reply = completion.choices[0]?.message?.content?.trim()
    console.log('[AI 连通性测试] 响应成功:', reply)

    return successResponse({
      message: '连通性测试成功！',
      reply
    })
  } catch (error) {
    console.error('[AI 连通性测试] 失败:', error)
    const err = error as any
    let msg = '测试失败，请检查配置参数'

    if (err.status === 404) {
      msg = `404 错误 - 接口路径不存在。请检查 API Base URL 是否填写正确。`
    } else if (err.status === 401) {
      msg = '401 错误 - API Key 无效或已过期，请检查秘钥是否正确。'
    } else if (err.status === 400) {
      msg = `400 错误 - 请求无效，通常原因为该模型不支持或格式错误: ${err.message}`
    } else if (err.message?.includes('ECONNREFUSED')) {
      msg = '连接被拒绝，无法建立网络连接，请检查 Base URL 是否可正常访问，或当前网络是否需要代理。'
    } else if (err.name === 'APITimeoutError') {
      msg = '网络连接超时（10秒），可能因为 Base URL 网络不通。'
    } else {
      msg = `测试失败: ${err.message || '未知错误'}`
    }

    return errorResponse(msg, 500)
  }
}
