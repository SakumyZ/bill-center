import React, { useState } from 'react'
import { Card, Row, Col } from 'antd'
import dynamic from 'next/dynamic'

const ReactEChartsCore = dynamic(
  () => import('@/components/EChartsWrapper').then(mod => mod.default),
  { ssr: false }
)

export default function DashboardCharts({
  categoryData,
  flatCategories,
  trend,
  assetsTrend,
  tagCloud,
  topBillsSlot,
  onOpenDetail
}: {
  categoryData: any[]
  flatCategories: any[]
  trend: any[]
  assetsTrend: any[]
  tagCloud: any[]
  topBillsSlot: React.ReactNode
  onOpenDetail?: (categoryId: string, categoryName: string) => void
}) {
  const [drillDownParentId, setDrillDownParentId] = useState<string | null>(null)

  const getFilteredCategoryData = React.useCallback(() => {
    const expenseCategories = categoryData.filter(d => d.category?.type === 'EXPENSE')
    if (drillDownParentId === null) {
      const topLevelIds = flatCategories.filter(c => !c.parentId).map(c => c.id)
      const aggregated = new Map<string, any>()
      expenseCategories.forEach(d => {
        if (!d.category) return
        const catId = d.category.id
        const parentId = d.category.parentId
        if (parentId && topLevelIds.includes(parentId)) {
          const existing = aggregated.get(parentId)
          const parent = flatCategories.find(c => c.id === parentId)
          if (existing) existing.total += d.totalAmount
          else if (parent) aggregated.set(parentId, { id: parentId, name: parent.name, color: parent.color, total: d.totalAmount })
        } else if (topLevelIds.includes(catId)) {
          const existing = aggregated.get(catId)
          if (existing) existing.total += d.totalAmount
          else aggregated.set(catId, { id: catId, name: d.category.name, color: d.category.color, total: d.totalAmount })
        }
      })
      return Array.from(aggregated.values()).map(item => ({
        categoryId: item.id, value: item.total, name: item.name, itemStyle: item.color ? { color: item.color } : undefined
      }))
    } else {
      const parentSelfSpending = expenseCategories.find(d => d.category?.id === drillDownParentId)
      const subSpending = expenseCategories.filter(d => d.category?.parentId === drillDownParentId).map(d => ({
        categoryId: d.categoryId, value: d.totalAmount, name: d.category?.name || '未细分', itemStyle: d.category?.color ? { color: d.category.color } : undefined
      }))

      if (parentSelfSpending) {
        subSpending.push({
          categoryId: parentSelfSpending.categoryId,
          value: parentSelfSpending.totalAmount,
          name: '其他 (未细分)',
          itemStyle: parentSelfSpending.category?.color ? { color: parentSelfSpending.category.color } : undefined
        })
      }
      return subSpending
    }
  }, [categoryData, drillDownParentId, flatCategories])

  const categoryPieOption = React.useMemo(() => ({
    title: {
      text: drillDownParentId ? `${flatCategories.find(c => c.id === drillDownParentId)?.name} - 子分类占比` : '支出分类占比',
      left: 'center',
      subtext: drillDownParentId ? '点击此处返回一级分类' : '点击图形分类查看子分类',
      subtextStyle: { color: '#999', fontSize: 12 },
      triggerEvent: true
    },
    tooltip: { 
      trigger: 'item', 
      formatter: (params: any) => {
        const base = `${params.name}: ¥${params.value} (${params.percent}%)`
        const tip = `<br/><span style="font-size:12px;color:#999;">💡 按住 Ctrl 点击查看所有明细账单</span>`
        return base + tip
      } 
    },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      center: ['50%', '55%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: getFilteredCategoryData()
    }]
  }), [drillDownParentId, flatCategories, getFilteredCategoryData])

  const periods = [...new Set(trend.map(t => t.period))].sort()
  const trendLineOption = React.useMemo(() => ({
    title: { text: '收支趋势', left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => params.map(p => `${p.marker} ${p.seriesName}: ¥${p.value.toFixed(2)}`).join('<br/>')
    },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: periods },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      { name: '收入', type: 'line', data: periods.map(p => trend.find(t => t.period === p && t.type === 'INCOME')?.total || 0), smooth: true, itemStyle: { color: '#52c41a' }, areaStyle: { color: 'rgba(82, 196, 26, 0.1)' } },
      { name: '支出', type: 'line', data: periods.map(p => trend.find(t => t.period === p && t.type === 'EXPENSE')?.total || 0), smooth: true, itemStyle: { color: '#ff4d4f' }, areaStyle: { color: 'rgba(255, 77, 79, 0.1)' } }
    ]
  }), [trend, periods])

  const assetsTrendLineOption = React.useMemo(() => ({
    title: { text: '历史总资产走势', left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => params.map(p => `${p.marker} 总资产: ¥${p.value.toFixed(2)}`).join('<br/>')
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: assetsTrend.map(t => t.month) },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{
      name: '总资产', type: 'line', data: assetsTrend.map(t => t.assets), smooth: true, itemStyle: { color: '#1677ff' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(22, 119, 255, 0.2)' }, { offset: 1, color: 'rgba(22, 119, 255, 0)' }] } }
    }]
  }), [assetsTrend])

  const wordCloudOption = React.useMemo(() => ({
    title: { text: '标签词云', left: 'center' },
    series: [{
      type: 'wordCloud', shape: 'circle', gridSize: 8, sizeRange: [14, 60], rotationRange: [-45, 45],
      textStyle: { fontFamily: 'sans-serif', fontWeight: 'bold', color: () => `hsl(${Math.random() * 360}, 70%, 50%)` },
      data: tagCloud.map(t => ({ name: t.name, value: t.count }))
    }]
  }), [tagCloud])

  return (
    <>
      <Row gutter={16} className="my-6">
        <Col xs={24} lg={12}>
          <Card>
            {/* 支出分类占比 */}
            <ReactEChartsCore
              option={categoryPieOption}
              style={{ height: 350 }}
              notMerge
              onEvents={{
                click: (params: any) => {
                  // 如果点击的是标题/副标题，且处于下钻状态，则返回上级
                  if (params.componentType === 'title') {
                    if (drillDownParentId !== null) {
                      setDrillDownParentId(null)
                    }
                    return
                  }
                  
                  // 如果点击的是饼图扇区
                  if (params.componentType === 'series') {
                    const cid = params.data?.categoryId
                    const cname = params.data?.name

                    if (!cid) return

                    // Ctrl / Meta 键点击，强制打开明细
                    if (params.event?.event?.ctrlKey || params.event?.event?.metaKey) {
                      onOpenDetail?.(cid, cname)
                      return
                    }

                    if (drillDownParentId === null) {
                      // 一级分类
                      if (flatCategories.some(c => c.parentId === cid)) {
                        setDrillDownParentId(cid) // 有子分类，下钻
                      } else {
                        // 无子分类，提示必须按 Ctrl
                      }
                    } else {
                      // 已经在看子分类，提示必须按 Ctrl
                    }
                  }
                }
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            {/* 收支趋势 */}
            <ReactEChartsCore option={trendLineOption} style={{ height: 350 }} notMerge />
          </Card>
        </Col>
      </Row>
      {assetsTrend.length > 0 && (
        <Row gutter={16} className="mb-6">
          <Col span={24}>
            <Card className="rounded-xl border border-slate-100">
              {/* 历史总资产走势 */}
              <ReactEChartsCore option={assetsTrendLineOption} style={{ height: 320 }} notMerge />
            </Card>
          </Col>
        </Row>
      )}
      {/* 标签词云和 Top10 账单 */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} lg={12} className="mb-6 lg:mb-0 min-w-0">
          <Card className="h-full">
            {tagCloud.length > 0 ? (
              // 标签词云
              <ReactEChartsCore option={wordCloudOption} style={{ height: 350 }} notMerge />
            ) : <div className="h-[350px] flex items-center justify-center text-gray-400">暂无标签数据</div>}
          </Card>
        </Col>
        <Col xs={24} lg={12} className="min-w-0">
          {/* Top10账单 */}
          {topBillsSlot}
        </Col>
      </Row>
    </>
  )
}
