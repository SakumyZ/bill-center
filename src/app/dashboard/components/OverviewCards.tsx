import React from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons'

export default function OverviewCards({ overview }: { overview: any }) {
  if (!overview) return null

  return (
    <Row gutter={16} className="mb-6">
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="总收入"
            value={overview.totalIncome}
            precision={2}
            prefix={<ArrowUpOutlined className="text-green-500" />}
            suffix="元"
            styles={{ content: { color: '#52c41a' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="总支出"
            value={overview.totalExpense}
            precision={2}
            prefix={<ArrowDownOutlined className="text-red-500" />}
            suffix="元"
            styles={{ content: { color: '#ff4d4f' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="净收入"
            value={overview.netIncome}
            precision={2}
            prefix={<DollarOutlined />}
            suffix="元"
            styles={{ content: { color: overview.netIncome >= 0 ? '#52c41a' : '#ff4d4f' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="账单笔数"
            value={overview.totalCount}
            prefix={<FileTextOutlined />}
            suffix="笔"
          />
        </Card>
      </Col>
    </Row>
  )
}
