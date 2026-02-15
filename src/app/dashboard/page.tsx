'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  TreeSelect,
  App
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import { fetchStatistics, fetchCategories, fetchTags } from '@/lib/api-client'

const { RangePicker } = DatePicker

// 动态导入 ECharts 避免 SSR 中 window is not defined
const ReactEChartsCore = dynamic(
  () => import('@/components/EChartsWrapper').then(mod => mod.default),
  { ssr: false }
)

interface TreeOption {
  value: string
  title: string
  children?: TreeOption[]
}

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
  type: string
  amount: number
  actualAmount: number
  remark?: string
  category?: { name: string; color?: string }
  tags: Array<{ name: string; color?: string }>
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

export default function DashboardPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [dimension, setDimension] = useState<string>('month')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('year'),
    dayjs().endOf('year')
  ])
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [tagId, setTagId] = useState<string | undefined>()

  const [overview, setOverview] = useState<Overview | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryStat[]>([])
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [tagCloud, setTagCloud] = useState<TagCloudItem[]>([])
  const [topBills, setTopBills] = useState<BillItem[]>([])
  const [categoryTree, setCategoryTree] = useState<TreeOption[]>([])
  const [tagTree, setTagTree] = useState<TreeOption[]>([])
  const [flatCategories, setFlatCategories] = useState<Array<Record<string, unknown>>>([])
  const [drillDownParentId, setDrillDownParentId] = useState<string | null>(null)

  const loadMetadata = useCallback(async () => {
    const [catRes, tagRes, flatCatRes] = await Promise.all([
      fetchCategories(),
      fetchTags(),
      fetchCategories({ flat: true })
    ])
    if (catRes.success)
      setCategoryTree(convertToTreeSelectData(catRes.data as Record<string, unknown>[]))
    if (tagRes.success)
      setTagTree(convertToTreeSelectData(tagRes.data as Record<string, unknown>[]))
    if (flatCatRes.success) setFlatCategories(flatCatRes.data as Array<Record<string, unknown>>)
  }, [])

  const loadStatistics = useCallback(async () => {
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

  useEffect(() => {
    loadMetadata()
  }, [loadMetadata])

  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  // 分类饼图配置（支持钻取）
  const getFilteredCategoryData = () => {
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

  const topBillColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD')
    },
    {
      title: '金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 100,
      render: (v: number) => `¥${Number(v).toFixed(2)}`
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
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat: BillItem['category']) => cat?.name || '-'
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true
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
            onChange={setDimension}
            style={{ width: 100 }}
            options={[
              { label: '按年', value: 'year' },
              { label: '按月', value: 'month' },
              { label: '按日', value: 'day' }
            ]}
          />
          <span>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={vals => {
              if (vals && vals[0] && vals[1]) {
                setDateRange([vals[0], vals[1]])
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
                    valueStyle={{ color: '#52c41a' }}
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
                    valueStyle={{ color: '#ff4d4f' }}
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
                    valueStyle={{ color: overview.netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}
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
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </div>
  )
}
