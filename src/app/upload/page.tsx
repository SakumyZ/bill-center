'use client'

import React, { useState, useCallback } from 'react'
import {
  Upload,
  Button,
  Table,
  Select,
  App,
  Card,
  Steps,
  Result,
  Space,
  Tag,
  TreeSelect,
  Statistic,
  Row,
  Col
} from 'antd'
import {
  UploadOutlined,
  CheckCircleOutlined,
  FileExcelOutlined,
  RobotOutlined
} from '@ant-design/icons'
import {
  previewUpload,
  confirmUpload,
  analyzeWithAI,
  fetchCategories,
  fetchTags
} from '@/lib/api-client'

interface TreeOption {
  value: string
  title: string
  children?: TreeOption[]
}

interface PreviewBill {
  date: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  discount: number
  actualAmount: number
  remark: string
  categoryName?: string
  categoryId?: string
  tagIds?: string[]
  aiCategoryId?: string
  aiCategoryName?: string
  aiTagIds?: string[]
  aiTagNames?: string[]
  aiConfidence?: number
}

function convertToTreeSelectData(nodes: Record<string, unknown>[]): TreeOption[] {
  return nodes.map(node => ({
    value: node.id as string,
    title: node.name as string,
    children: node.children
      ? convertToTreeSelectData(node.children as Record<string, unknown>[])
      : undefined
  }))
}

export default function UploadPage() {
  const { message } = App.useApp()
  const [currentStep, setCurrentStep] = useState(0)
  const [source, setSource] = useState<string>('YIMU')
  const [fileName, setFileName] = useState('')
  const [previewBills, setPreviewBills] = useState<PreviewBill[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [analyzingAI, setAnalyzingAI] = useState(false)
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null)
  const [categoryTree, setCategoryTree] = useState<TreeOption[]>([])
  const [tagTree, setTagTree] = useState<TreeOption[]>([])

  const loadMetadata = useCallback(async () => {
    const [catRes, tagRes] = await Promise.all([fetchCategories(), fetchTags()])
    if (catRes.success)
      setCategoryTree(convertToTreeSelectData(catRes.data as Record<string, unknown>[]))
    if (tagRes.success)
      setTagTree(convertToTreeSelectData(tagRes.data as Record<string, unknown>[]))
  }, [])

  const handleUpload = async (file: File) => {
    try {
      await loadMetadata()
      const res = await previewUpload(file, source)
      if (res.success) {
        setFileName(res.data.fileName)
        setPreviewBills(res.data.bills)
        setErrors(res.data.errors || [])
        setCurrentStep(1)
        message.success(`解析成功，共 ${res.data.bills.length} 条记录`)
      } else {
        message.error(res.error || '解析失败')
      }
    } catch {
      message.error('文件上传失败')
    }
    return false // 阻止默认上传
  }

  const handleAIAnalyze = async () => {
    if (previewBills.length === 0) return
    setAnalyzingAI(true)
    try {
      const billsForAI = previewBills.map(b => ({
        remark: b.remark,
        amount: b.amount,
        type: b.type
      }))

      const res = await analyzeWithAI(billsForAI)
      if (res.success && Array.isArray(res.data)) {
        const updated = [...previewBills]
        for (const suggestion of res.data as Array<{
          index: number
          categoryId?: string
          categoryName?: string
          tagIds?: string[]
          tagNames?: string[]
          confidence?: number
        }>) {
          const idx = suggestion.index
          if (idx >= 0 && idx < updated.length) {
            updated[idx] = {
              ...updated[idx],
              aiCategoryId: suggestion.categoryId,
              aiCategoryName: suggestion.categoryName,
              aiTagIds: suggestion.tagIds,
              aiTagNames: suggestion.tagNames,
              aiConfidence: suggestion.confidence,
              // 自动应用 AI 推荐
              categoryId: suggestion.categoryId || updated[idx].categoryId,
              tagIds: suggestion.tagIds?.length ? suggestion.tagIds : updated[idx].tagIds
            }
          }
        }
        setPreviewBills(updated)
        message.success('AI 分析完成')
      } else {
        message.error(res.error || 'AI 分析失败')
      }
    } catch {
      message.error('AI 分析失败')
    } finally {
      setAnalyzingAI(false)
    }
  }

  const handleConfirm = async () => {
    setImporting(true)
    try {
      const res = await confirmUpload({
        fileName,
        source,
        bills: previewBills.map(b => ({
          ...b,
          categoryId: b.categoryId || undefined,
          tagIds: b.tagIds || []
        }))
      })

      if (res.success) {
        setImportResult(res.data as Record<string, unknown>)
        setCurrentStep(2)
        message.success('导入成功')
      } else {
        message.error(res.error || '导入失败')
      }
    } catch {
      message.error('导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleBillChange = (index: number, field: string, value: unknown) => {
    const updated = [...previewBills]
    updated[index] = { ...updated[index], [field]: value }
    setPreviewBills(updated)
  }

  const previewColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 70,
      render: (type: string) => (
        <Tag color={type === 'INCOME' ? 'green' : 'red'}>{type === 'INCOME' ? '收入' : '支出'}</Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 90,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    {
      title: '实付',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 90,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true
    },
    {
      title: '分类',
      key: 'categoryId',
      width: 150,
      render: (_: unknown, record: PreviewBill, index: number) => (
        <div>
          <TreeSelect
            allowClear
            size="small"
            placeholder="选择分类"
            style={{ width: '100%' }}
            treeData={categoryTree}
            value={record.categoryId}
            onChange={val => handleBillChange(index, 'categoryId', val)}
          />
          {record.aiCategoryName && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              AI: {record.aiCategoryName} ({((record.aiConfidence || 0) * 100).toFixed(0)}%)
            </div>
          )}
        </div>
      )
    },
    {
      title: '标签',
      key: 'tagIds',
      width: 180,
      render: (_: unknown, record: PreviewBill, index: number) => (
        <div>
          <TreeSelect
            allowClear
            multiple
            size="small"
            placeholder="选择标签"
            style={{ width: '100%' }}
            treeData={tagTree}
            treeCheckable
            value={record.tagIds}
            onChange={val => handleBillChange(index, 'tagIds', val)}
          />
          {record.aiTagNames && record.aiTagNames.length > 0 && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              AI: {record.aiTagNames.join(', ')}
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <Steps
        current={currentStep}
        style={{ marginBottom: 24 }}
        items={[
          { title: '上传文件', icon: <FileExcelOutlined /> },
          { title: '预览确认', icon: <CheckCircleOutlined /> },
          { title: '完成', icon: <CheckCircleOutlined /> }
        ]}
      />

      {currentStep === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <span style={{ marginRight: 8 }}>数据源：</span>
              <Select
                value={source}
                onChange={setSource}
                style={{ width: 200 }}
                options={[
                  { label: '一木记账', value: 'YIMU' },
                  { label: '其他', value: 'OTHER' }
                ]}
              />
            </div>
            <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={handleUpload}>
              <Button type="primary" size="large" icon={<UploadOutlined />}>
                选择 Excel 文件
              </Button>
            </Upload>
            <p style={{ marginTop: 16, color: '#999' }}>支持 .xlsx / .xls 格式</p>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <span>共 {previewBills.length} 条记录</span>
              {errors.length > 0 && <Tag color="red">{errors.length} 条解析错误</Tag>}
            </Space>
            <Space>
              <Button icon={<RobotOutlined />} loading={analyzingAI} onClick={handleAIAnalyze}>
                AI 智能分类
              </Button>
              <Button onClick={() => setCurrentStep(0)}>重新上传</Button>
              <Button type="primary" loading={importing} onClick={handleConfirm}>
                确认导入
              </Button>
            </Space>
          </div>

          <Table
            columns={previewColumns}
            dataSource={previewBills}
            rowKey={(_, index) => String(index)}
            size="small"
            scroll={{ x: 900 }}
            pagination={{ pageSize: 50 }}
          />
        </div>
      )}

      {currentStep === 2 && importResult && (
        <Result
          status="success"
          title="导入完成"
          subTitle={
            <Row gutter={24} style={{ marginTop: 16 }}>
              <Col>
                <Statistic title="总记录" value={importResult.total as number} />
              </Col>
              <Col>
                <Statistic
                  title="成功导入"
                  value={importResult.success as number}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col>
                <Statistic
                  title="重复跳过"
                  value={importResult.duplicates as number}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col>
                <Statistic
                  title="失败"
                  value={importResult.failed as number}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
          }
          extra={[
            <Button
              key="again"
              onClick={() => {
                setCurrentStep(0)
                setImportResult(null)
              }}
            >
              继续上传
            </Button>,
            <Button key="view" type="primary" href="/bills">
              查看账单
            </Button>
          ]}
        />
      )}
    </div>
  )
}
