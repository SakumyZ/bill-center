import React from 'react'
import { Card, Row, Col, Space, Button, Input, Spin } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import CurrencyInput from '@/components/CurrencyInput'
import dayjs from 'dayjs'

export default function MonthlySummaryCard({
  dateRange,
  monthlySummary,
  setMonthlySummary,
  savingSummary,
  loadingSummary,
  handleSaveSummary
}: {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
  monthlySummary: { content: string; assets: number | null }
  setMonthlySummary: React.Dispatch<React.SetStateAction<{ content: string; assets: number | null }>>
  savingSummary: boolean
  loadingSummary: boolean
  handleSaveSummary: () => void
}) {
  return (
    <Card
      title={
        <Space>
          <EditOutlined className="text-blue-500" />
          <span>{dateRange[0].format('YYYY-MM')} 月度总结与资产对账</span>
        </Space>
      }
      className="mb-6 rounded-xl shadow-sm border border-slate-100"
      extra={
        <Button
          type="primary"
          loading={savingSummary}
          onClick={handleSaveSummary}
          className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 border-none shadow-md"
        >
          保存月度记录
        </Button>
      }
    >
      <Spin spinning={loadingSummary}>
        <Row gutter={24} align="top">
          <Col xs={24} md={8} className="mb-4">
            <div className="mb-2 font-medium text-slate-600 text-sm">
              期末总资产 (独立核对)
            </div>
            <CurrencyInput
              placeholder="期末总资产"
              value={monthlySummary.assets ?? undefined}
              onChange={val => setMonthlySummary(prev => ({ ...prev, assets: val ? Number(val) : null }))}
              className="w-full rounded-lg"
              style={{ width: '100%' }}
              size="large"
            />
            <div className="mt-2 text-xs text-slate-400 leading-relaxed">
              手动统计该月份结束时的真实总资产，可用于补齐未记账流水以呈现完整的资产走势。
            </div>
          </Col>
          <Col xs={24} md={16}>
            <div className="mb-2 font-medium text-slate-600 text-sm">
              月度总结 (如大额消费原因、生活总结)
            </div>
            <Input.TextArea
              placeholder="在这里输入本月的消费感受、超支原因或生活记账总结..."
              value={monthlySummary.content}
              onChange={e => setMonthlySummary(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              size="large"
              className="rounded-lg"
            />
          </Col>
        </Row>
      </Spin>
    </Card>
  )
}
