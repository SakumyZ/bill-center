'use client'

import { useState } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  TreeSelect,
  Button
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CategorySelect from '@/components/CategorySelect'
import BillListTable from '@/components/BillListTable'
import { useMetadata } from '@/hooks/useMetadata'
import { BillType, filterCategoriesByType, hasCategoryValue } from '@/lib/bill-form'

const { RangePicker } = DatePicker

export default function BillsPage() {
  const { categoryTree, tagTree } = useMetadata()
  const [filterForm] = Form.useForm()
  const currentFilterType = Form.useWatch<BillType | undefined>('type', filterForm)
  const [filters, setFilters] = useState<Record<string, string | undefined>>({})



  const handleFilter = () => {
    const values = filterForm.getFieldsValue()
    const newFilters: Record<string, string | undefined> = {}

    if (values.dateRange) {
      newFilters.startDate = values.dateRange[0].format('YYYY-MM-DD')
      newFilters.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }
    if (values.type) newFilters.type = values.type
    if (values.categoryId) newFilters.categoryId = values.categoryId
    if (values.tagId) newFilters.tagId = values.tagId
    if (values.keyword) newFilters.keyword = values.keyword

    setFilters(newFilters)
  }

  const handleReset = () => {
    filterForm.resetFields()
    setFilters({})
  }

  const handleFilterValuesChange = (
    changedValues: Record<string, unknown>,
    allValues: Record<string, unknown>
  ) => {
    if (!('type' in changedValues)) {
      return
    }

    const availableCategories = filterCategoriesByType(
      categoryTree,
      allValues.type as BillType | undefined
    )
    const currentCategoryId = filterForm.getFieldValue('categoryId') as string | undefined

    if (currentCategoryId && !hasCategoryValue(availableCategories, currentCategoryId)) {
      filterForm.setFieldValue('categoryId', undefined)
    }
  }



  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Form
          form={filterForm}
          layout="inline"
          style={{ flexWrap: 'wrap', gap: 8 }}
          onValuesChange={handleFilterValuesChange}
        >
          <Form.Item name="dateRange" label="日期">
            <RangePicker />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select
              allowClear
              placeholder="全部"
              style={{ width: 100 }}
              options={[
                { label: '支出', value: 'EXPENSE' },
                { label: '收入', value: 'INCOME' }
              ]}
            />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <CategorySelect
              placeholder="全部"
              style={{ width: 150 }}
              type={currentFilterType}
            />
          </Form.Item>
          <Form.Item name="tagId" label="标签">
            <TreeSelect allowClear placeholder="全部" style={{ width: 150 }} treeData={tagTree} />
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="搜索备注" allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleFilter}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="flex-1 min-h-0 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <BillListTable filters={filters} />
      </div>
    </div>
  )
}
