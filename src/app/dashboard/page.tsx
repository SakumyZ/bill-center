'use client'

import React, { useState } from 'react'
import { Space, Radio, DatePicker, Button, Select, Spin, App, Drawer } from 'antd'
import dayjs from 'dayjs'
import useSWR from 'swr'
import { fetchStatistics, fetchMonthlySummary, updateMonthlySummary } from '@/lib/api'
import { useFlatMetadata } from '@/hooks/useMetadata'
import {
  Dimension,
  PeriodPreset,
  getDefaultDateRange,
  getPresetDateRange,
  normalizeDateRange,
  getPickerMode,
  getRangePickerFormat,
  getPresetLabel,
  resolveMatchedPreset
} from './utils'
import CategorySelect from '@/components/CategorySelect'
import OverviewCards from './components/OverviewCards'
import DashboardCharts from './components/DashboardCharts'
import MonthlySummaryCard from './components/MonthlySummaryCard'
import TopBillsTable from './components/TopBillsTable'
import BillListTable from '@/components/BillListTable'

export default function DashboardPage() {
  const { message } = App.useApp()
  const [dimension, setDimension] = useState<Dimension>('month')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(getDefaultDateRange('month'))
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [tagId, setTagId] = useState<string | undefined>()

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [detailFilters, setDetailFilters] = useState<Record<string, string | undefined>>({})
  const [detailTitle, setDetailTitle] = useState('账单明细')

  const handleOpenDetail = (filters: Record<string, string>, title: string) => {
    setDetailFilters({
      ...filters,
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD')
    })
    setDetailTitle(title)
    setDetailDrawerOpen(true)
  }

  const { flatCategories, flatTags, isLoading: metaLoading } = useFlatMetadata()

  const currentPreset = resolveMatchedPreset(dimension, dateRange)

  const handlePresetClick = (preset: PeriodPreset) => {
    setDateRange(getPresetDateRange(dimension, preset))
  }

  const { data: statsRes, isLoading: statsLoading, mutate: reloadStats } = useSWR(
    ['/api/bills/statistics', dimension, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'), categoryId, tagId],
    () => fetchStatistics({
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
      dimension,
      categoryId,
      tagId
    })
  )

  const monthStr = dateRange[0].format('YYYY-MM')
  const { data: summaryRes, isLoading: summaryLoading, mutate: reloadSummary } = useSWR(
    dimension === 'month' ? ['/api/monthly-summaries', monthStr] : null,
    () => fetchMonthlySummary(monthStr)
  )

  const [savingSummary, setSavingSummary] = useState(false)
  const [localSummary, setLocalSummary] = useState({ content: '', assets: null as number | null })

  // 同步远程总结数据到本地状态
  React.useEffect(() => {
    if (summaryRes?.success && summaryRes.data) {
      setLocalSummary({ content: summaryRes.data.content || '', assets: summaryRes.data.assets })
    } else {
      setLocalSummary({ content: '', assets: null })
    }
  }, [summaryRes])

  const handleSaveSummary = async () => {
    if (dimension !== 'month') return
    setSavingSummary(true)
    const res = await updateMonthlySummary(monthStr, {
      content: localSummary.content,
      assets: localSummary.assets || 0
    })
    setSavingSummary(false)
    if (res.success) {
      message.success('保存成功')
      reloadSummary()
      reloadStats() // 刷新资产趋势
    } else {
      message.error(res.error || '保存失败')
    }
  }

  const data = statsRes?.success ? (statsRes.data as any) : null

  return (
    <div className="flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      {/* 检索区域 */}
      <div className="mb-6 flex justify-between items-center pb-2 pt-2">
        <Space size="large" className="flex-wrap gap-y-4">
          <Radio.Group
            value={dimension}
            onChange={e => {
              const newDim = e.target.value
              setDimension(newDim)
              setDateRange(getDefaultDateRange(newDim))
            }}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="year">按年</Radio.Button>
            <Radio.Button value="month">按月</Radio.Button>
            <Radio.Button value="day">按日</Radio.Button>
          </Radio.Group>

          <Space>
            <Button onClick={() => handlePresetClick('previous')}>
              {getPresetLabel(dimension, 'previous')}
            </Button>
            <DatePicker.RangePicker
              mode={[getPickerMode(dimension) as any, getPickerMode(dimension) as any]}
              picker={getPickerMode(dimension)}
              format={getRangePickerFormat(dimension)}
              value={dateRange}
              onChange={dates => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange(normalizeDateRange(dimension, [dates[0], dates[1]]))
                }
              }}
              allowClear={false}
              style={{ width: dimension === 'year' ? 200 : 260 }}
            />
            <Button onClick={() => handlePresetClick('next')}>
              {getPresetLabel(dimension, 'next')}
            </Button>
            {currentPreset !== 'current' && (
              <Button type="primary" ghost onClick={() => handlePresetClick('current')}>
                回到{getPresetLabel(dimension, 'current')}
              </Button>
            )}
          </Space>

          <Space>
            <CategorySelect
              placeholder="全部分类"
              value={categoryId}
              onChange={setCategoryId}
              style={{ width: 150 }}
            />
            <Select
              allowClear
              placeholder="全部标签"
              value={tagId}
              onChange={setTagId}
              style={{ width: 150 }}
              options={flatTags.map(t => ({ label: t.name, value: t.id }))}
              loading={metaLoading}
            />
          </Space>
        </Space>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto pb-8 px-2">
        {!data && statsLoading ? (
          <div className="w-full h-full flex items-center justify-center min-h-[400px]">
            <Spin size="large" />
          </div>
        ) : (
          <Spin spinning={statsLoading}>
            {data ? (
              <>
                {/* 总体概览 */}
                <OverviewCards overview={data.overview} />

                {/* 月度总结与资产对账 */}
                {dimension === 'month' && (
                  <MonthlySummaryCard
                    dateRange={dateRange}
                    monthlySummary={localSummary}
                    setMonthlySummary={setLocalSummary}
                    savingSummary={savingSummary}
                    loadingSummary={summaryLoading}
                    handleSaveSummary={handleSaveSummary}
                  />
                )}

                {/* 统计图表 */}
                <DashboardCharts
                  categoryData={data.categoryData || []}
                  flatCategories={flatCategories}
                  trend={data.trend || []}
                  assetsTrend={data.assetsTrend || []}
                  tagCloud={data.tagCloud || []}
                  topBillsSlot={<TopBillsTable topBills={data.topBills || []} reload={reloadStats} />}
                  onOpenDetail={handleOpenDetail}
                />
              </>
            ) : (
              <div className="w-full flex items-center justify-center min-h-[400px] text-gray-400">
                暂无数据
              </div>
            )}
          </Spin>
        )}
      </div>

      <Drawer
        title={detailTitle}
        placement="bottom"
        height="70vh"
        onClose={() => setDetailDrawerOpen(false)}
        open={detailDrawerOpen}
        styles={{ body: { padding: 0 } }}
      >
        <div className="h-full bg-slate-50 p-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 h-full">
            <BillListTable filters={detailFilters} hideToolbar={true} />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
