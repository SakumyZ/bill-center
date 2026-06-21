import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

// GET /api/system-configs - 获取系统配置
export async function GET(_request: NextRequest) {
  try {
    // 默认配置（来自环境变量）
    const defaults = {
      ai_enabled: 'true',
      ai_api_key: process.env.OPENAI_API_KEY,
      ai_base_url: process.env.OPENAI_BASE_URL,
      ai_model: process.env.OPENAI_MODEL,
      ai_guidance: ''
    }

    // 从数据库读取已有的配置
    const configs = await prisma.systemConfig.findMany()
    const configMap: Record<string, string> = {}
    configs.forEach(cfg => {
      configMap[cfg.key] = cfg.value
    })

    // 获取真实的 API Key 值以在前端通过眼睛图标随时查验
    const hasDbApiKey = configMap['ai_api_key'] !== undefined
    const realApiKey = hasDbApiKey ? configMap['ai_api_key'] : defaults.ai_api_key

    const result = {
      ai_enabled: configMap['ai_enabled'] ?? defaults.ai_enabled,
      ai_api_key: realApiKey,
      ai_base_url: configMap['ai_base_url'] ?? defaults.ai_base_url,
      ai_model: configMap['ai_model'] ?? defaults.ai_model,
      ai_guidance: configMap['ai_guidance'] ?? defaults.ai_guidance
    }

    return successResponse(result)
  } catch (error) {
    console.error('获取系统配置失败:', error)
    return errorResponse('获取系统配置失败', 500)
  }
}

// POST /api/system-configs - 更新系统配置
export async function POST(request: NextRequest) {
  try {
    const { configs } = (await request.json()) as { configs: Record<string, string> }

    if (!configs || typeof configs !== 'object') {
      return errorResponse('参数格式错误，期望对象格式的 configs')
    }

    const updates = Object.entries(configs)

    for (const [key, value] of updates) {
      // 如果 key 是 API Key 并且值仍是脱敏星号，代表用户没有更改此项配置，跳过更新
      if (key === 'ai_api_key' && value === '******') {
        continue
      }

      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    }

    return successResponse({ message: '配置保存成功' })
  } catch (error) {
    console.error('更新系统配置失败:', error)
    return errorResponse('更新系统配置失败', 500)
  }
}
