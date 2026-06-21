'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  TreeSelect,
  App,
  Button,
  Input,
  InputNumber
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  FileTextOutlined,
  EditOutlined
} from '@ant-design/icons'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import { fetchStatistics, fetchCategories, fetchTags, fetchMonthlySummary, updateMonthlySummary, fetchAssetsTrend } from '@/lib/api-client'
import BillModal from '@/components/BillModal'
import {
  BillModalValues,
  CategoryOption,
  TreeOption,
  convertToCategoryTreeSelectData,
  convertToTreeSelectData
} from '@/lib/bill-form'
import type { ColumnsType } from 'antd/es/table'

const { RangePicker } = DatePicker

type Dimension = 'year' | 'month' | 'day'
type PeriodPreset = 'previous' | 'current' | 'next'

function getDefaultDateRange(dimension: Dimension): [dayjs.Dayjs, dayjs.Dayjs] {
  if (dimension === 'year') {
    return [dayjs().startOf('year'), dayjs().endOf('year')]
  }

  const previousMonth = dayjs().subtract(1, 'month')
  return [previousMonth.startOf('month'), previousMonth.endOf('month')]
}

function getPresetDateRange(
  dimension: Dimension,
  preset: PeriodPreset
): [dayjs.Dayjs, dayjs.Dayjs] {
  const offset = preset === 'previous' ? -1 : preset === 'next' ? 1 : 0

  if (dimension === 'year') {
    const target = dayjs().add(offset, 'year')
    return [target.startOf('year'), target.endOf('year')]
  }

  if (dimension === 'month') {
    const target = dayjs().add(offset, 'month')
    return [target.startOf('month'), target.endOf('month')]
  }

  const target = dayjs().add(offset, 'day')
  return [target.startOf('day'), target.endOf('day')]
}

function normalizeDateRange(
  dimension: Dimension,
  range: [dayjs.Dayjs, dayjs.Dayjs]
): [dayjs.Dayjs, dayjs.Dayjs] {
  if (dimension === 'year') {
    return [range[0].startOf('year'), range[1].endOf('year')]
  }

  if (dimension === 'month') {
    return [range[0].startOf('month'), range[1].endOf('month')]
  }

  return [range[0].startOf('day'), range[1].endOf('day')]
}

function getPickerMode(dimension: Dimension): 'year' | 'month' | undefined {
  if (dimension === 'year') return 'year'
  if (dimension === 'month') return 'month'
  return undefined
}

function getRangePickerFormat(dimension: Dimension) {
  if (dimension === 'year') return 'YYYY'
  if (dimension === 'month') return 'YYYY-MM'
  return 'YYYY-MM-DD'
}

function getPresetLabel(dimension: Dimension, preset: PeriodPreset) {
  const labels: Record<Dimension, Record<PeriodPreset, string>> = {
    year: {
      previous: '前年',
      current: '本年',
      next: '下年'
    },
    month: {
      previous: '上月',
      current: '本月',
      next: '下月'
    },
    day: {
      previous: '前日',
      current: '本日',
      next: '次日'
    }
  }

  return labels[dimension][preset]
}

function resolveMatchedPreset(
  dimension: Dimension,
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
): PeriodPreset | undefined {
  const presets: PeriodPreset[] = ['previous', 'current', 'next']

  return presets.find(preset => {
    const [start, end] = getPresetDateRange(dimension, preset)
    return dateRange[0].isSame(start, 'day') && dateRange[1].isSame(end, 'day')
  })
}

// 动态导入 ECharts 避免 SSR 中 window is not defined
const ReactEChartsCore = dynamic(
  () => import('@/components/EChartsWrapper').then(mod => mod.default),
  { ssr: false }
)

interface Overview {
  totalIncome: number
  totalExpense: number
  netIncome: number
  totalCount: number
  incomeCount: number
  expenseCount: number
}

interface CategoryStat {
  categoryId: string
  category: {
    id: string
    name: string
    color?: string
    type: string
    parentId?: string | null
  } | null
  totalAmount: number
  count: number
}

interface TrendItem {
  period: string
  type: string
  total: number
  count: number
}

interface TagCloudItem {
  tagId: string
  name: string
  color?: string
  count: number
}

interface BillItem {
  id: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  discount: number
  actualAmount: number
  remark?: string
  source?: string
  category?: { id: string; name: string; color?: string }
  tags: Array<{ id: string; name: string; color?: string }>
}

interface PieDataItem {
  categoryId: string
  value: number
  name: string
  itemStyle?: { color: string }
}

export default function DashboardPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [editingBill, setEditingBill] = useState<BillModalValues | null>(null)
  const [dimension, setDimension] = useState<Dimension>('month')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(
    getDefaultDateRange('month')
  )
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [tagId, setTagId] = useState<string | undefined>()

  const [overview, setOverview] = useState<Overview | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryStat[]>([])
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [tagCloud, setTagCloud] = useState<TagCloudItem[]>([])
  const [topBills, setTopBills] = useState<BillItem[]>([])
  const [categoryTree, setCategoryTree] = useState<CategoryOption[]>([])
  const [tagTree, setTagTree] = useState<TreeOption[]>([])
  const [flatCategories, setFlatCategories] = useState<Array<Record<string, unknown>>>([])
  const [drillDownParentId, setDrillDownParentId] = useState<string | null>(null)

  // 月度总结与资产走势相关状态
  const [monthlySummary, setMonthlySummary] = useState<{ content: string; assets: number | null }>({
    content: '',
    assets: null
  })
  const [savingSummary, setSavingSummary] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [assetsTrend, setAssetsTrend] = useState<Array<{ month: string; assets: number }>>([])

  const loadMetadata = useCallback<() => Promise<void>>(async () => {
    const [catRes, tagRes, flatCatRes] = await Promise.all([
      fetchCategories(),
      fetchTags(),
      fetchCategories({ flat: true })
    ])
    if (catRes.success)
      setCategoryTree(convertToCategoryTreeSelectData(catRes.data as Record<string, unknown>[]))
    if (tagRes.success)
      setTagTree(convertToTreeSelectData(tagRes.data as Record<string, unknown>[]))
    if (flatCatRes.success) setFlatCategories(flatCatRes.data as Array<Record<string, unknown>>)
  }, [])

  const loadStatistics = useCallback<() => Promise<void>>(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | undefined> = {
        dimension,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      }
      if (categoryId) params.categoryId = categoryId
      if (tagId) params.tagId = tagId

      const res = await fetchStatistics(params)
      if (res.success) {
        const data = res.data as Record<string, unknown>
        setOverview(data.overview as Overview)
        setCategoryData(data.categoryData as CategoryStat[])
        setTrend(data.trend as TrendItem[])
        setTagCloud(data.tagCloud as TagCloudItem[])
        setTopBills(data.topBills as BillItem[])
      }
    } catch {
      message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }, [dimension, dateRange, categoryId, tagId, message])

  const loadMonthlySummary = useCallback(async (month: string) => {
    setLoadingSummary(true)
    try {
      const res = await fetchMonthlySummary(month)
      if (res.success && res.data) {
        setMonthlySummary({
          content: res.data.content,
          assets: res.data.assets
        })
      }
    } catch {
      // 静默失败
    } finally {
      setLoadingSummary(false)
    }
  }, [])

  const loadAssetsTrend = useCallback(async () => {
    try {
      const res = await fetchAssetsTrend()
      if (res.success && res.data) {
        setAssetsTrend(res.data)
      }
    } catch {
      // 静默失败
    }
  }, [])

  const handleSaveSummary = async () => {
    const currentMonth = dateRange[0].format('YYYY-MM')
    setSavingSummary(true)
    try {
      const res = await updateMonthlySummary(currentMonth, {
        content: monthlySummary.content,
        assets: monthlySummary.assets || 0
      })
      if (res.success) {
        message.success('月度总结保存成功')
        await loadAssetsTrend()
      } else {
        message.error(res.error || '保存总结失败')
      }
    } catch {
      message.error('保存总结失败，请检查服务')
    } finally {
      setSavingSummary(false)
    }
  }

  useEffect(() => {
    loadMetadata()
  }, [loadMetadata])

  useEffect(() => {
    loadStatistics()
    loadAssetsTrend()
    if (dimension === 'month') {
      loadMonthlySummary(dateRange[0].format('YYYY-MM'))
    }
  }, [loadStatistics, dimension, dateRange, loadMonthlySummary, loadAssetsTrend])

  const handleEditBill = (bill: BillItem): void => {
    setEditingBill({
      id: bill.id,
      date: dayjs(bill.date).format('YYYY-MM-DD'),
      type: bill.type,
      amount: Number(bill.amount),
      discount: Number(bill.discount || 0),
      actualAmount: Number(bill.actualAmount),
      categoryId: bill.category?.id,
      tagIds: bill.tags.map(tag => tag.id),
      remark: bill.remark
    })
  }

  const handleCancelEdit = (): void => {
    setEditingBill(null)
  }

  const handleBillModalSuccess = async (): Promise<void> => {
    setEditingBill(null)
    await loadStatistics()
  }

  const matchedPreset = resolveMatchedPreset(dimension, dateRange)

  // 分类饼图配置（支持钻取）
  const getFilteredCategoryData = (): PieDataItem[] => {
    const expenseCategories = categoryData.filter(d => d.category?.type === 'EXPENSE')

    if (drillDownParentId === null) {
      // 显示一级分类：没有 parentId 或者是聚合后的一级分类数据
      const topLevelIds = flatCategories
        .filter((c: Record<string, unknown>) => !c.parentId)
        .map((c: Record<string, unknown>) => c.id as string)

      // 聚合：如果有子分类的数据，归并到父分类
      const aggregated = new Map<
        string,
        { name: string; color?: string; total: number; id: string }
      >()

      expenseCategories.forEach(d => {
        if (!d.category) return
        const catId = d.category.id
        const parentId = d.category.parentId

        // 如果是子分类，找到其父分类
        if (parentId && topLevelIds.includes(parentId)) {
          const existing = aggregated.get(parentId)
          const parent = flatCategories.find((c: Record<string, unknown>) => c.id === parentId) as
            | Record<string, unknown>
            | undefined
          if (existing) {
            existing.total += d.totalAmount
          } else if (parent) {
            aggregated.set(parentId, {
              id: parentId,
              name: parent.name as string,
              color: parent.color as string | undefined,
              total: d.totalAmount
            })
          }
        } else if (topLevelIds.includes(catId)) {
          // 如果本身就是一级分类
          const existing = aggregated.get(catId)
          if (existing) {
            existing.total += d.totalAmount
          } else {
            aggregated.set(catId, {
              id: catId,
              name: d.category.name,
              color: d.category.color,
              total: d.totalAmount
            })
          }
        }
      })

      return Array.from(aggregated.values()).map(item => ({
        categoryId: item.id,
        value: item.total,
        name: item.name,
        itemStyle: item.color ? { color: item.color } : undefined
      }))
    } else {
      // 显示选中一级分类的子分类
      return expenseCategories
        .filter(d => d.category?.parentId === drillDownParentId)
        .map(d => ({
          categoryId: d.categoryId,
          value: d.totalAmount,
          name: d.category?.name || '未分类',
          itemStyle: d.category?.color ? { color: d.category.color } : undefined
        }))
    }
  }

  const filteredPieData = getFilteredCategoryData()
  const currentParentName = drillDownParentId
    ? ((
        flatCategories.find((c: Record<string, unknown>) => c.id === drillDownParentId) as
          | Record<string, unknown>
          | undefined
      )?.name as string)
    : null

  const categoryPieOption = {
    title: {
      text: drillDownParentId ? `${currentParentName} - 子分类占比` : '支出分类占比',
      left: 'center',
      subtext: drillDownParentId ? '点击返回一级分类' : '点击分类查看子分类',
      subtextStyle: { color: '#999', fontSize: 12 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        data: filteredPieData
      }
    ]
  }

  // 趋势折线图
  const periods = [...new Set(trend.map(t => t.period))].sort()
  const incomeData = periods.map(
    p => trend.find(t => t.period === p && t.type === 'INCOME')?.total || 0
  )
  const expenseData = periods.map(
    p => trend.find(t => t.period === p && t.type === 'EXPENSE')?.total || 0
  )

  const trendLineOption = {
    title: { text: '收支趋势', left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ seriesName: string; value: number; marker: string }>) => {
        return params.map(p => `${p.marker} ${p.seriesName}: ¥${p.value.toFixed(2)}`).join('<br/>')
      }
    },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: periods },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      {
        name: '收入',
        type: 'line',
        data: incomeData,
        smooth: true,
        itemStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.1)' }
      },
      {
        name: '支出',
        type: 'line',
        data: expenseData,
        smooth: true,
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { color: 'rgba(255, 77, 79, 0.1)' }
      }
    ]
  }

  // 资产趋势折线图配置
  const trendMonths = assetsTrend.map(t => t.month)
  const assetsData = assetsTrend.map(t => t.assets)
  const assetsTrendLineOption = {
    title: { text: '历史总资产走势', left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ name: string; value: number; marker: string }>) => {
        return params.map(p => `${p.marker} 总资产: ¥${p.value.toFixed(2)}`).join('<br/>')
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: trendMonths },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      {
        name: '总资产',
        type: 'line',
        data: assetsData,
        smooth: true,
        itemStyle: { color: '#1677ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.2)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0)' }
            ]
          }
        }
      }
    ]
  }

  // 词云配置
  const wordCloudOption = {
    title: { text: '标签词云', left: 'center' },
    series: [
      {
        type: 'wordCloud',
        shape: 'circle',
        gridSize: 8,
        sizeRange: [14, 60],
        rotationRange: [-45, 45],
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: () => `hsl(${Math.random() * 360}, 70%, 50%)`
        },
        data: tagCloud.map(t => ({
          name: t.name,
          value: t.count
        }))
      }
    ]
  }

  const topBillColumns: ColumnsType<BillItem> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 102,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD')
    },
    {
      title: '金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 96,
      render: (v: number) => `¥${Number(v).toFixed(2)}`
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 68,
      render: (type: string) => (
        <Tag color={type === 'INCOME' ? 'green' : 'red'}>{type === 'INCOME' ? '收入' : '支出'}</Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      ellipsis: true,
      render: (cat: BillItem['category']) => cat?.name || '-'
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 132,
      render: (tags: BillItem['tags']) => {
        if (!tags.length) {
          return '-'
        }

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tags.slice(0, 2).map(tag => (
              <Tag key={tag.id} color={tag.color || undefined} style={{ marginInlineEnd: 0 }}>
                {tag.name}
              </Tag>
            ))}
            {tags.length > 2 ? <Tag style={{ marginInlineEnd: 0 }}>+{tags.length - 2}</Tag> : null}
          </div>
        )
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (remark?: string) => remark || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      align: 'center' as const,
      render: (_: unknown, record: BillItem) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditBill(record)}
        >
          编辑
        </Button>
      )
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 筛选栏 - 固定在顶部 */}
      <div style={{ flexShrink: 0, marginBottom: 24 }}>
        <Space wrap>
          <span>时间维度：</span>
          <Select
            value={dimension}
            onChange={(value: Dimension) => {
              setDimension(value)
              setDateRange(getDefaultDateRange(value))
            }}
            style={{ width: 100 }}
            options={[
              { label: '按年', value: 'year' },
              { label: '按月', value: 'month' },
              { label: '按日', value: 'day' }
            ]}
          />
          <span>快捷周期：</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={matchedPreset}
            onChange={event => {
              const preset = event.target.value as PeriodPreset
              setDateRange(getPresetDateRange(dimension, preset))
            }}
            options={[
              { label: getPresetLabel(dimension, 'previous'), value: 'previous' },
              { label: getPresetLabel(dimension, 'current'), value: 'current' },
              { label: getPresetLabel(dimension, 'next'), value: 'next' }
            ]}
          />
          <span>日期范围：</span>
          <RangePicker
            value={dateRange}
            picker={getPickerMode(dimension)}
            format={getRangePickerFormat(dimension)}
            allowClear={false}
            onChange={vals => {
              if (vals && vals[0] && vals[1]) {
                setDateRange(normalizeDateRange(dimension, [vals[0], vals[1]]))
              }
            }}
          />
          <span>分类：</span>
          <TreeSelect
            allowClear
            placeholder="全部"
            style={{ width: 150 }}
            treeData={categoryTree}
            value={categoryId}
            onChange={setCategoryId}
          />
          <span>标签：</span>
          <TreeSelect
            allowClear
            placeholder="全部"
            style={{ width: 150 }}
            treeData={tagTree}
            value={tagId}
            onChange={setTagId}
          />
        </Space>
      </div>

      {/* 可滚动内容区域 */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        <Spin spinning={loading}>
          {/* 收支概览 */}
          {overview && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="总收入"
                    value={overview.totalIncome}
                    precision={2}
                    prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
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
                    prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
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
          )}

          {/* 月度总结与资产录入卡片 */}
          {dimension === 'month' && (
            <Card
              title={
                <Space>
                  <EditOutlined style={{ color: '#1677ff' }} />
                  <span>{dateRange[0].format('YYYY-MM')} 月度总结与资产对账</span>
                </Space>
              }
              style={{
                marginBottom: 24,
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                border: '1px solid #f1f5f9'
              }}
              extra={
                <Button
                  type="primary"
                  loading={savingSummary}
                  onClick={handleSaveSummary}
                  style={{
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(22, 119, 255, 0.25)'
                  }}
                >
                  保存月度记录
                </Button>
              }
            >
              <Spin spinning={loadingSummary}>
                <Row gutter={24} align="top">
                  <Col xs={24} md={6} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 550, color: '#475569', fontSize: 13 }}>
                      期末总资产 (独立核对)
                    </div>
                    <InputNumber
                      placeholder="期末总资产"
                      value={monthlySummary.assets ?? undefined}
                      onChange={val => setMonthlySummary(prev => ({ ...prev, assets: val }))}
                      precision={2}
                      prefix="¥"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                      style={{ width: '100%', borderRadius: 8 }}
                      size="large"
                    />
                    <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', lineHeight: '1.5' }}>
                      手动统计该月份结束时的真实总资产，可用于补齐未记账流水以呈现完整的资产走势。
                    </div>
                  </Col>
                  <Col xs={24} md={18}>
                    <div style={{ marginBottom: 8, fontWeight: 550, color: '#475569', fontSize: 13 }}>
                      月度总结 (如大额消费原因、生活总结)
                    </div>
                    <Input.TextArea
                      placeholder="在这里输入本月的消费感受、超支原因或生活记账总结..."
                      value={monthlySummary.content}
                      onChange={e => setMonthlySummary(prev => ({ ...prev, content: e.target.value }))}
                      rows={3}
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  </Col>
                </Row>
              </Spin>
            </Card>
          )}

          {/* 图表 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card>
                <ReactEChartsCore
                  option={categoryPieOption}
                  style={{ height: 350 }}
                  notMerge
                  onEvents={{
                    click: (params: { data?: { categoryId?: string } }) => {
                      if (drillDownParentId === null) {
                        // 当前是一级分类视图，点击钻取到子分类
                        const clickedCategoryId = params.data?.categoryId
                        if (clickedCategoryId) {
                          const hasChildren = flatCategories.some(
                            (c: Record<string, unknown>) => c.parentId === clickedCategoryId
                          )
                          if (hasChildren) {
                            setDrillDownParentId(clickedCategoryId)
                          } else {
                            message.info('该分类没有子分类')
                          }
                        }
                      } else {
                        // 当前是子分类视图，点击返回一级分类
                        setDrillDownParentId(null)
                      }
                    }
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card>
                <ReactEChartsCore option={trendLineOption} style={{ height: 350 }} notMerge />
              </Card>
            </Col>
          </Row>

          {/* 资产走势大图表 */}
          {assetsTrend.length > 0 && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <ReactEChartsCore option={assetsTrendLineOption} style={{ height: 320 }} notMerge />
                </Card>
              </Col>
            </Row>
          )}

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card>
                {tagCloud.length > 0 ? (
                  <ReactEChartsCore option={wordCloudOption} style={{ height: 350 }} notMerge />
                ) : (
                  <div
                    style={{
                      height: 350,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}
                  >
                    暂无标签数据
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="大额账单 TOP 10">
                <Table
                  columns={topBillColumns}
                  dataSource={topBills}
                  rowKey="id"
                  size="small"
                  tableLayout="fixed"
                  pagination={false}
                  scroll={undefined}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>

      <BillModal
        open={!!editingBill}
        mode="edit"
        initialValues={editingBill || undefined}
        onCancel={handleCancelEdit}
        onSuccess={handleBillModalSuccess}
      />
    </div>
  )
}
