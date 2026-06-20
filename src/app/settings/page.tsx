'use client'

import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Switch,
  Button,
  Card,
  App,
  Spin,
  Divider,
  Typography,
  Space,
  Alert
} from 'antd'
import {
  SettingOutlined,
  RobotOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  ExperimentOutlined
} from '@ant-design/icons'
import { fetchSystemConfigs, updateSystemConfigs, testAIConnection } from '@/lib/api-client'

const { Title, Paragraph, Text } = Typography

export default function SettingsPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [form] = Form.useForm()

  const handleTestConnection = async () => {
    const values = form.getFieldsValue()
    
    if (!values.ai_enabled) {
      message.warning('请先开启“AI 智能分类服务”开关再进行连通性测试')
      return
    }

    setTesting(true)
    try {
      const res = await testAIConnection({
        apiKey: values.ai_api_key,
        baseURL: values.ai_base_url,
        model: values.ai_model
      })

      if (res.success) {
        message.success(
          `AI 连通性测试成功！大模型正常响应："${res.data?.reply || 'ok'}"`
        )
      } else {
        message.error(res.error || '连通性测试失败，请检查配置')
      }
    } catch (error: any) {
      message.error(error?.message || '连通性测试失败，请检查配置')
    } finally {
      setTesting(false)
    }
  }

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const res = await fetchSystemConfigs()
      if (res.success && res.data) {
        form.setFieldsValue({
          ai_enabled: res.data.ai_enabled === 'true',
          ai_api_key: res.data.ai_api_key,
          ai_base_url: res.data.ai_base_url,
          ai_model: res.data.ai_model,
          ai_guidance: res.data.ai_guidance || ''
        })
      } else {
        message.error(res.error || '加载配置失败')
      }
    } catch {
      message.error('加载配置失败，请检查网络或控制台日志')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  const handleSubmit = async (values: {
    ai_enabled: boolean
    ai_api_key?: string
    ai_base_url?: string
    ai_model?: string
    ai_guidance?: string
  }) => {
    setSaving(true)
    try {
      const payload: Record<string, string> = {
        ai_enabled: values.ai_enabled ? 'true' : 'false',
        ai_api_key: values.ai_api_key || '',
        ai_base_url: values.ai_base_url || '',
        ai_model: values.ai_model || '',
        ai_guidance: values.ai_guidance || ''
      }

      const res = await updateSystemConfigs(payload)
      if (res.success) {
        message.success('配置已保存成功')
        await loadConfigs() // 刷新表单更新 API Key 的脱敏星号
      } else {
        message.error(res.error || '保存配置失败')
      }
    } catch {
      message.error('保存配置失败，请检查后台服务')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '12px 0' }}>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f0f0f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#e6f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              color: '#1677ff',
              fontSize: 22
            }}
          >
            <SettingOutlined />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
              系统设置
            </Title>
            <Text type="secondary">全局管理账单中心的系统级配置与第三方服务集成</Text>
          </div>
        </div>

        <Alert
          message="说明"
          description="在此页面可以配置您的 AI 智能分析凭证。若您在 .env 文件中已配置了环境变量，在不修改此处的情况下，系统仍会自动回退并使用环境变量的默认参数。"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 28, borderRadius: 10 }}
        />

        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {/* AI 功能开关组 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '16px 20px',
                background: '#fafafa',
                borderRadius: 12,
                marginBottom: 28,
                border: '1px solid #f0f0f0'
              }}
            >
              <div style={{ display: 'flex', gap: 16 }}>
                <RobotOutlined style={{ fontSize: 24, color: '#1677ff', marginTop: 2 }} />
                <div>
                  <Title level={5} style={{ margin: 0, fontWeight: 550 }}>
                    AI 智能分类服务
                  </Title>
                  <Paragraph style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    启用后，上传账单时将支持通过大语言模型自动识别、预测并补全账单的分类和标签，极大提高记账效率。
                  </Paragraph>
                </div>
              </div>
              <Form.Item name="ai_enabled" valuePropName="checked" style={{ margin: 0 }}>
                <Switch size="default" />
              </Form.Item>
            </div>

            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.ai_enabled !== curr.ai_enabled}>
              {({ getFieldValue }) => {
                const isEnabled = getFieldValue('ai_enabled')
                return (
                  <div
                    style={{
                      maxHeight: isEnabled ? 800 : 0,
                      opacity: isEnabled ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 4,
                          height: 14,
                          borderRadius: 2,
                          background: '#1677ff',
                          marginRight: 8
                        }}
                      />
                      OpenAI 兼容端点配置
                    </Title>

                    <Form.Item
                      name="ai_base_url"
                      label="API Base URL"
                      tooltip="大模型中转或官方接口的基础路径，默认情况下回退使用环境变量配置"
                    >
                      <Input placeholder="例如: https://api.openai.com/v1" size="large" />
                    </Form.Item>

                    <Form.Item
                      name="ai_api_key"
                      label="API Key"
                      tooltip="接口访问令牌，输入后将安全掩码存储"
                    >
                      <Input.Password placeholder="请输入 OpenAI API Key 或中转 Key" size="large" />
                    </Form.Item>

                    <Form.Item
                      name="ai_model"
                      label="Model (分析模型名称)"
                      tooltip="所指定的模型名称，请确认识别效率与计费成本平衡"
                    >
                      <Input placeholder="例如: gpt-3.5-turbo 或 LongCat-Flash-Lite" size="large" />
                    </Form.Item>

                    <Title level={5} style={{ marginTop: 24, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 4,
                          height: 14,
                          borderRadius: 2,
                          background: '#1677ff',
                          marginRight: 8
                        }}
                      />
                      AI 引导提示词
                    </Title>

                    <Form.Item
                      name="ai_guidance"
                      label="自定义分类与标签引导规则"
                      tooltip="配置用于纠正 AI 分类和标签混淆的引导词。当账单备注中包含关键字时，AI 会优先归类到指定分类和标签。"
                      extra={
                        <div style={{ marginTop: 8, fontSize: '13px', color: '#8c8c8c' }}>
                          <div>规则模板：<strong>关键字-分类-标签</strong>（每行一个）</div>
                          <div>例如：<strong>包子-早餐-餐饮</strong></div>
                          <div>如果某个关键字不需要标签，可留空，如：<strong>包子-早餐-</strong></div>
                        </div>
                      }
                    >
                      <Input.TextArea
                        placeholder="请输入引导词规则，例如：&#13;包子-早餐-餐饮&#13;理发-个人护理-生活服务"
                        rows={4}
                        size="large"
                      />
                    </Form.Item>
                  </div>
                )
              }}
            </Form.Item>

            <Divider style={{ margin: '24px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Space size={12}>
                <Button size="large" onClick={loadConfigs} disabled={loading || saving || testing}>
                  重置
                </Button>
                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.ai_enabled !== curr.ai_enabled}>
                  {({ getFieldValue }) => {
                    const isEnabled = getFieldValue('ai_enabled')
                    if (!isEnabled) return null
                    return (
                      <Button
                        size="large"
                        icon={<ExperimentOutlined />}
                        loading={testing}
                        disabled={loading || saving}
                        onClick={handleTestConnection}
                        style={{
                          borderRadius: 8,
                          borderColor: '#1677ff',
                          color: '#1677ff',
                          fontWeight: 500
                        }}
                      >
                        测试连通性
                      </Button>
                    )
                  }}
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={saving}
                  disabled={loading || testing}
                  style={{
                    background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(22, 119, 255, 0.25)',
                    borderRadius: 8,
                    fontWeight: 500
                  }}
                >
                  保存设置
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  )
}
