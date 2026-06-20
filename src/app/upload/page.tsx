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
  Col,
  Progress
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
import { Icon } from '@iconify/react'

interface TreeOption {
  value: string
  title: string
  icon?: string
  color?: string
  type?: 'INCOME' | 'EXPENSE'
  children?: TreeOption[]
}

interface PreviewBill {
  date: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  discount: number
  actualAmount: number
  remark: string
  // 解析器返回的原始字段（用于自动匹配）
  categoryName?: string
  subCategoryName?: string
  tagNames?: string[]
  // 第三方原始数据（仅用于显示，不存数据库）
  originalCategoryName?: string // 一级分类
  originalSubCategoryName?: string // 二级分类
  originalTagNames?: string[] // 原始标签列表
  // 本系统映射后的 ID
  categoryId?: string
  tagIds?: string[]
  // AI 分析结果
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
    icon: node.icon as string | undefined,
    color: node.color as string | undefined,
    type: node.type as 'INCOME' | 'EXPENSE' | undefined,
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
  const [aiProgress, setAiProgress] = useState(0)
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null)
  const [categoryTree, setCategoryTree] = useState<TreeOption[]>([])
  const [tagTree, setTagTree] = useState<TreeOption[]>([])

  const mapTreeDataWithIcon = (nodes: TreeOption[]): any[] => {
    return nodes.map(node => ({
      value: node.value,
      title: (
        <Space size={4}>
          {node.icon && node.icon.includes(':') && <Icon icon={node.icon} style={{ fontSize: 14 }} />}
          <span>{node.title}</span>
        </Space>
      ),
      searchValue: node.title as string,
      children: node.children ? mapTreeDataWithIcon(node.children) : undefined
    }))
  }

  const filterTreeDataByType = (nodes: TreeOption[], type: 'INCOME' | 'EXPENSE'): TreeOption[] => {
    return nodes
      .filter(node => !node.type || node.type === type)
      .map(node => ({
        ...node,
        children: node.children ? filterTreeDataByType(node.children, type) : undefined
      }))
  }

  const loadMetadata = useCallback(async () => {
    const [catRes, tagRes] = await Promise.all([fetchCategories(), fetchTags()])
    if (catRes.success)
      setCategoryTree(convertToTreeSelectData(catRes.data as Record<string, unknown>[]))
    if (tagRes.success)
      setTagTree(convertToTreeSelectData(tagRes.data as Record<string, unknown>[]))
    return {
      categories: catRes.data as Record<string, unknown>[],
      tags: tagRes.data as Record<string, unknown>[]
    }
  }, [])

  // 递归查找分类（支持按名称匹配）
  const findCategoryByName = (
    categories: Record<string, unknown>[],
    name: string,
    type?: string
  ): string | undefined => {
    for (const cat of categories) {
      if (cat.name === name && (!type || cat.type === type)) {
        return cat.id as string
      }
      if (cat.children && Array.isArray(cat.children)) {
        const found = findCategoryByName(cat.children as Record<string, unknown>[], name, type)
        if (found) return found
      }
    }
    return undefined
  }

  // 递归查找标签（支持按名称匹配）
  const findTagsByNames = (tags: Record<string, unknown>[], names: string[]): string[] => {
    const result: string[] = []
    for (const name of names) {
      for (const tag of tags) {
        if (tag.name === name) {
          result.push(tag.id as string)
          break
        }
        if (tag.children && Array.isArray(tag.children)) {
          const found = findTagsByNames(tag.children as Record<string, unknown>[], [name])
          if (found.length > 0) {
            result.push(...found)
            break
          }
        }
      }
    }
    return result
  }

  const handleUpload = async (file: File) => {
    try {
      const metadata = await loadMetadata()
      const res = await previewUpload(file, source)
      if (res.success) {
        setFileName(res.data.fileName)

        // 自动匹配分类和标签
        const billsWithMapping = (res.data.bills as PreviewBill[]).map(bill => {
          let categoryId: string | undefined = undefined
          let tagIds: string[] = []

          // 优先匹配二级分类，如果没有则匹配一级分类
          if (bill.subCategoryName) {
            categoryId = findCategoryByName(metadata.categories, bill.subCategoryName, bill.type)
          }
          if (!categoryId && bill.categoryName) {
            categoryId = findCategoryByName(metadata.categories, bill.categoryName, bill.type)
          }

          // 匹配标签
          if (bill.tagNames && bill.tagNames.length > 0) {
            tagIds = findTagsByNames(metadata.tags, bill.tagNames)
          }

          return {
            ...bill,
            originalCategoryName: bill.categoryName,
            originalSubCategoryName: bill.subCategoryName,
            originalTagNames: bill.tagNames,
            categoryId,
            tagIds: tagIds.length > 0 ? tagIds : undefined
          }
        })

        setPreviewBills(billsWithMapping)
        setErrors(res.data.errors || [])
        setCurrentStep(1)

        const matchedCount = billsWithMapping.filter(b => b.categoryId || b.tagIds?.length).length
        message.success(
          `解析成功，共 ${billsWithMapping.length} 条记录，自动匹配 ${matchedCount} 条`
        )
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

    // 过滤出需要 AI 分析的账单（没有分类或标签的）
    const needAnalysis: Array<{ bill: PreviewBill; originalIndex: number }> = []
    previewBills.forEach((bill, index) => {
      const hasCategory = !!bill.categoryId
      const hasTags = bill.tagIds && bill.tagIds.length > 0
      // 只分析没有分类或标签的记录
      if (!hasCategory || !hasTags) {
        needAnalysis.push({ bill, originalIndex: index })
      }
    })

    if (needAnalysis.length === 0) {
      message.info('所有账单已有分类和标签，无需 AI 分析')
      return
    }

    setAnalyzingAI(true)
    setAiProgress(0)
    try {
      // 只发送需要分析的账单给 AI
      const billsForAI = needAnalysis.map((item, idx) => ({
        index: idx, // AI 返回时使用的索引
        originalIndex: item.originalIndex, // 原始索引，用于映射回去
        remark: item.bill.remark,
        amount: item.bill.amount,
        type: item.bill.type
      }))

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bills: billsForAI.map(b => ({
            remark: b.remark,
            amount: b.amount,
            type: b.type
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'AI 分析失败')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let accumulatedText = ''
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunkText = decoder.decode(value, { stream: !done })
          accumulatedText += chunkText

          // 匹配 JSON 中的 progress 键值，更新进度状态
          const matches = [...accumulatedText.matchAll(/"progress"\s*:\s*(\d+)/g)]
          if (matches.length > 0) {
            const latestProgress = Math.min(Math.max(...matches.map(m => parseInt(m[1], 10))), 100)
            setAiProgress(latestProgress)
          }
        }
      }

      let cleanContent = accumulatedText.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '')
      }

      const parsed = JSON.parse(cleanContent)
      const resData = Array.isArray(parsed)
        ? parsed
        : parsed.suggestions || parsed.results || [parsed]

      const updated = [...previewBills]
      for (const suggestion of resData as Array<{
        index: number
        categoryId?: string
        categoryName?: string
        tagIds?: string[]
        tagNames?: string[]
        confidence?: number
      }>) {
        // 通过映射找到原始索引
        const mapping = billsForAI[suggestion.index]
        if (mapping) {
          const originalIdx = mapping.originalIndex
          updated[originalIdx] = {
            ...updated[originalIdx],
            aiCategoryId: suggestion.categoryId,
            aiCategoryName: suggestion.categoryName,
            aiTagIds: suggestion.tagIds,
            aiTagNames: suggestion.tagNames,
            aiConfidence: suggestion.confidence,
            // 自动应用 AI 推荐（只覆盖空值）
            categoryId: suggestion.categoryId || updated[originalIdx].categoryId,
            tagIds:
              suggestion.tagIds?.length && suggestion.tagIds.length > 0
                ? suggestion.tagIds
                : updated[originalIdx].tagIds
          }
        }
      }
      setPreviewBills(updated)
      message.success(
        `AI 分析完成，处理 ${needAnalysis.length} 条记录（跳过 ${previewBills.length - needAnalysis.length} 条已有分类标签的记录）`
      )
    } catch (error) {
      console.error(error)
      message.error(error instanceof Error ? error.message : 'AI 分析失败')
    } finally {
      setAnalyzingAI(false)
      setAiProgress(100)
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
          tagIds: (b.tagIds || [])
            .map(v => (typeof v === 'string' ? v : (v as { value?: string }).value))
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
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

  const normalizeTagIds = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined
    const ids = value
      .map(v => (typeof v === 'string' ? v : (v as { value?: string }).value))
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
    return ids.length > 0 ? ids : undefined
  }

  const handleBillChange = (index: number, field: string, value: unknown) => {
    const updated = [...previewBills]
    if (field === 'tagIds') {
      updated[index] = { ...updated[index], [field]: normalizeTagIds(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
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
      width: 150,
      ellipsis: true
    },
    {
      title: '原分类',
      key: 'originalCategory',
      width: 120,
      render: (_: unknown, record: PreviewBill) => (
        <div style={{ fontSize: 12 }}>
          {record.originalCategoryName && (
            <div style={{ color: '#666' }}>{record.originalCategoryName}</div>
          )}
          {record.originalSubCategoryName && (
            <div style={{ color: '#999', fontSize: 11 }}>└ {record.originalSubCategoryName}</div>
          )}
        </div>
      )
    },
    {
      title: '原标签',
      key: 'originalTags',
      width: 120,
      render: (_: unknown, record: PreviewBill) => (
        <div>
          {record.originalTagNames && record.originalTagNames.length > 0 && (
            <Space size={[4, 4]} wrap>
              {record.originalTagNames.map((tag, idx) => (
                <Tag key={idx} color="blue" style={{ fontSize: 11 }}>
                  {tag}
                </Tag>
              ))}
            </Space>
          )}
        </div>
      )
    },
    {
      title: '分类',
      key: 'categoryId',
      width: 150,
      render: (_: unknown, record: PreviewBill, index: number) => {
        const isAiCategory = !!(record.aiCategoryId && record.categoryId === record.aiCategoryId)
        return (
          <div
            style={{
              padding: isAiCategory ? '4px 6px' : '0',
              backgroundColor: isAiCategory ? '#fffbe6' : 'transparent',
              border: isAiCategory ? '1px dashed #ffe58f' : '1px solid transparent',
              borderRadius: '6px',
              transition: 'all 0.3s'
            }}
          >
            <TreeSelect
              allowClear
              size="small"
              placeholder="选择分类"
              style={{ width: '100%' }}
              treeData={mapTreeDataWithIcon(filterTreeDataByType(categoryTree, record.type))}
              value={record.categoryId}
              onChange={val => handleBillChange(index, 'categoryId', val)}
              treeNodeFilterProp="searchValue"
            />
            {record.aiCategoryName && (
              <div
                style={{
                  fontSize: 11,
                  color: isAiCategory ? '#d46b08' : '#999',
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <RobotOutlined style={{ color: isAiCategory ? '#d46b08' : '#999' }} />
                <span>
                  AI: {record.aiCategoryName} ({((record.aiConfidence || 0) * 100).toFixed(0)}%)
                </span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: '标签',
      key: 'tagIds',
      width: 180,
      render: (_: unknown, record: PreviewBill, index: number) => {
        const currentTagIds = (record.tagIds || [])
          .map(v => (typeof v === 'string' ? v : (v as { value?: string }).value))
          .filter((v): v is string => typeof v === 'string')
        const isAiTags = !!(
          record.aiTagIds &&
          record.aiTagIds.length > 0 &&
          currentTagIds.length === record.aiTagIds.length &&
          currentTagIds.every(id => record.aiTagIds!.includes(id))
        )
        return (
          <div
            style={{
              padding: isAiTags ? '4px 6px' : '0',
              backgroundColor: isAiTags ? '#fffbe6' : 'transparent',
              border: isAiTags ? '1px dashed #ffe58f' : '1px solid transparent',
              borderRadius: '6px',
              transition: 'all 0.3s'
            }}
          >
            <TreeSelect
              allowClear
              multiple
              size="small"
              placeholder="选择标签"
              style={{ width: '100%' }}
              treeData={tagTree}
              treeCheckable
              treeCheckStrictly
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              value={record.tagIds}
              onChange={val => handleBillChange(index, 'tagIds', val)}
            />
            {record.aiTagNames && record.aiTagNames.length > 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: isAiTags ? '#d46b08' : '#999',
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <RobotOutlined style={{ color: isAiTags ? '#d46b08' : '#999' }} />
                <span>AI: {record.aiTagNames.join(', ')}</span>
              </div>
            )}
          </div>
        )
      }
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
              {analyzingAI && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 220 }}>
                  <Progress percent={aiProgress} size="small" status="active" />
                  <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>AI 分析中...</span>
                </div>
              )}
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
            scroll={{ x: 900, y: 'calc(100vh - 350px)' }}
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
