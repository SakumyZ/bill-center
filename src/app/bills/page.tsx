'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  App,
  Tag,
  Popconfirm,
  TreeSelect
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Icon } from '@iconify/react'
import { fetchBills, deleteBill, fetchCategories, fetchTags } from '@/lib/api-client'
import BillModal from '@/components/BillModal'
import {
  BillModalValues,
  BillType,
  CategoryOption,
  TreeOption,
  convertToCategoryTreeSelectData,
  convertToTreeSelectData,
  filterCategoriesByType,
  hasCategoryValue
} from '@/lib/bill-form'

const { RangePicker } = DatePicker

interface BillRecord {
  id: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  discount: number
  actualAmount: number
  remark?: string
  source: string
  category?: { id: string; name: string; color?: string; icon?: string }
  tags: Array<{ id: string; name: string; color?: string }>
}

export default function BillsPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [bills, setBills] = useState<BillRecord[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [billModalState, setBillModalState] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    initialValues?: BillModalValues
  }>({ open: false, mode: 'create' })
  const [categoryTree, setCategoryTree] = useState<CategoryOption[]>([])
  const [tagTree, setTagTree] = useState<TreeOption[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filterForm] = Form.useForm()
  const currentFilterType = Form.useWatch<BillType | undefined>('type', filterForm)
  const [filters, setFilters] = useState<Record<string, string | undefined>>({})
  const filteredSearchCategoryTree = filterCategoriesByType(categoryTree, currentFilterType)

  const mapTreeDataWithIcon = (nodes: CategoryOption[]): any[] => {
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

  const loadBills = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchBills({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      })
      if (res.success) {
        setBills(res.data as BillRecord[])
        if (res.pagination) {
          setPagination(prev => ({ ...prev, total: res.pagination!.total }))
        }
      }
    } catch {
      message.error('加载账单失败')
    } finally {
      setLoading(false)
    }
  }, [filters, message, pagination.page, pagination.pageSize])

  const loadMetadata = useCallback(async () => {
    const [catRes, tagRes] = await Promise.all([fetchCategories(), fetchTags()])
    if (catRes.success) {
      setCategoryTree(convertToCategoryTreeSelectData(catRes.data as Record<string, unknown>[]))
    }
    if (tagRes.success) {
      setTagTree(convertToTreeSelectData(tagRes.data as Record<string, unknown>[]))
    }
  }, [])

  useEffect(() => {
    loadMetadata()
  }, [loadMetadata])

  useEffect(() => {
    loadBills()
  }, [loadBills])

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
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleReset = () => {
    filterForm.resetFields()
    setFilters({})
    setPagination(prev => ({ ...prev, page: 1 }))
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

  const handleAdd = () => {
    setBillModalState({ open: true, mode: 'create' })
  }

  const handleEdit = (record: BillRecord) => {
    setBillModalState({
      open: true,
      mode: 'edit',
      initialValues: {
        id: record.id,
        date: dayjs(record.date).format('YYYY-MM-DD'),
        type: record.type,
        amount: Number(record.amount),
        discount: Number(record.discount),
        actualAmount: Number(record.actualAmount),
        remark: record.remark,
        categoryId: record.category?.id,
        tagIds: record.tags.map(tag => tag.id)
      }
    })
  }

  const handleCopy = (record: BillRecord) => {
    setBillModalState({
      open: true,
      mode: 'create',
      initialValues: {
        date: dayjs(record.date).format('YYYY-MM-DD'),
        type: record.type,
        amount: Number(record.amount),
        discount: Number(record.discount),
        actualAmount: Number(record.actualAmount),
        remark: record.remark,
        categoryId: record.category?.id,
        tagIds: record.tags.map(tag => tag.id)
      }
    })
  }

  const handleBillModalSuccess = async () => {
    setBillModalState({ open: false, mode: 'create' })
    await loadBills()
  }

  const handleBillModalCancel = () => {
    setBillModalState({ open: false, mode: 'create' })
  }

  const handleDelete = async (id: string) => {
    const res = await deleteBill(id)
    if (res.success) {
      message.success('删除成功')
      await loadBills()
    } else {
      message.error(res.error || '删除失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的账单')
      return
    }

    try {
      const deletePromises = selectedRowKeys.map(id => deleteBill(id as string))
      const results = await Promise.all(deletePromises)
      const successCount = results.filter(result => result.success).length
      const failCount = results.length - successCount

      if (failCount === 0) {
        message.success(`成功删除 ${successCount} 条账单`)
      } else {
        message.warning(`删除完成：成功 ${successCount} 条，失败 ${failCount} 条`)
      }

      setSelectedRowKeys([])
      await loadBills()
    } catch {
      message.error('批量删除失败')
    }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'INCOME' ? 'green' : 'red'}>{type === 'INCOME' ? '收入' : '支出'}</Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => `¥${Number(amount).toFixed(2)}`,
      sorter: true
    },
    {
      title: '优惠',
      dataIndex: 'discount',
      key: 'discount',
      width: 80,
      render: (discount: number) => (discount > 0 ? `¥${Number(discount).toFixed(2)}` : '-')
    },
    {
      title: '实付',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 100,
      render: (amount: number) => `¥${Number(amount).toFixed(2)}`
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: BillRecord['category']) =>
        category ? (
          <Tag color={category.color || undefined}>
            <Space size={4}>
              {category.icon && category.icon.includes(':') && <Icon icon={category.icon} />}
              <span>{category.name}</span>
            </Space>
          </Tag>
        ) : (
          '-'
        )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: BillRecord['tags']) =>
        tags.map(tag => (
          <Tag key={tag.id} color={tag.color || undefined}>
            {tag.name}
          </Tag>
        ))
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: BillRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="编辑"
          />
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
            title="复制"
          />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} title="删除" />
          </Popconfirm>
        </Space>
      )
    }
  ]

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
            <TreeSelect
              allowClear
              placeholder="全部"
              style={{ width: 150 }}
              treeData={mapTreeDataWithIcon(filteredSearchCategoryTree)}
              treeNodeFilterProp="searchValue"
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

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          {selectedRowKeys.length > 0 && (
            <>
              <span>已选择 {selectedRowKeys.length} 项</span>
              <Popconfirm
                title="确认删除"
                description={`确定要删除选中的 ${selectedRowKeys.length} 条账单吗？`}
                onConfirm={handleBatchDelete}
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增账单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={bills}
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE]
        }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, page, pageSize })
            setSelectedRowKeys([])
          }
        }}
        scroll={{ x: 1000, y: 'calc(100vh - 400px)' }}
      />

      <BillModal
        open={billModalState.open}
        mode={billModalState.mode}
        initialValues={billModalState.initialValues}
        onCancel={handleBillModalCancel}
        onSuccess={handleBillModalSuccess}
      />
    </div>
  )
}
