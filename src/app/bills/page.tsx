'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  App,
  Tag,
  Popconfirm,
  TreeSelect
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import {
  fetchBills,
  createBill,
  updateBill,
  deleteBill,
  fetchCategories,
  fetchTags
} from '@/lib/api-client'
import dayjs from 'dayjs'

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
  category?: { id: string; name: string; color?: string }
  tags: Array<{ id: string; name: string; color?: string }>
}

interface TreeOption {
  value: string
  title: string
  children?: TreeOption[]
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

export default function BillsPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [bills, setBills] = useState<BillRecord[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categoryTree, setCategoryTree] = useState<TreeOption[]>([])
  const [tagTree, setTagTree] = useState<TreeOption[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  // 筛选条件
  const [filters, setFilters] = useState<Record<string, string | undefined>>({})

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
  }, [pagination.page, pagination.pageSize, filters, message])

  const loadMetadata = useCallback(async () => {
    const [catRes, tagRes] = await Promise.all([fetchCategories(), fetchTags()])
    if (catRes.success)
      setCategoryTree(convertToTreeSelectData(catRes.data as Record<string, unknown>[]))
    if (tagRes.success)
      setTagTree(convertToTreeSelectData(tagRes.data as Record<string, unknown>[]))
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

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ type: 'EXPENSE', discount: 0, source: 'MANUAL' })
    setModalOpen(true)
  }

  const handleEdit = (record: BillRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      date: dayjs(record.date),
      type: record.type,
      amount: Number(record.amount),
      discount: Number(record.discount),
      actualAmount: Number(record.actualAmount),
      remark: record.remark,
      categoryId: record.category?.id,
      tagIds: record.tags?.map(t => t.id) || []
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteBill(id)
    if (res.success) {
      message.success('删除成功')
      loadBills()
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
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (failCount === 0) {
        message.success(`成功删除 ${successCount} 条账单`)
      } else {
        message.warning(`删除完成：成功 ${successCount} 条，失败 ${failCount} 条`)
      }

      setSelectedRowKeys([])
      loadBills()
    } catch {
      message.error('批量删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        actualAmount: values.actualAmount ?? values.amount - (values.discount || 0)
      }

      // 清理空的 categoryId 和 tagIds，避免 UUID 验证失败
      if (!data.categoryId) {
        delete data.categoryId
      }
      if (!data.tagIds || data.tagIds.length === 0) {
        delete data.tagIds
      }

      let res
      if (editingId) {
        res = await updateBill(editingId, data)
      } else {
        res = await createBill(data)
      }

      if (res.success) {
        message.success(editingId ? '更新成功' : '创建成功')
        setModalOpen(false)
        loadBills()
      } else {
        message.error(res.error || '操作失败')
      }
    } catch {
      // 表单验证失败
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
        category ? <Tag color={category.color || undefined}>{category.name}</Tag> : '-'
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: BillRecord['tags']) =>
        tags?.map(tag => (
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
          />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 筛选栏 */}
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Form form={filterForm} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
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
              treeData={categoryTree}
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

      {/* 操作栏 */}
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

      {/* 表格 */}
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

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑账单' : '新增账单'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '支出', value: 'EXPENSE' },
                { label: '收入', value: 'INCOME' }
              ]}
            />
          </Form.Item>
          <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
            <Form.Item
              name="amount"
              label="金额"
              rules={[{ required: true, message: '请输入金额' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0}
                precision={2}
                prefix="¥"
                style={{ width: '100%' }}
                onChange={() => {
                  const amount = form.getFieldValue('amount') || 0
                  const discount = form.getFieldValue('discount') || 0
                  form.setFieldValue('actualAmount', amount - discount)
                }}
              />
            </Form.Item>
            <Form.Item name="discount" label="优惠金额" style={{ flex: 1 }}>
              <InputNumber
                min={0}
                precision={2}
                prefix="¥"
                style={{ width: '100%' }}
                onChange={() => {
                  const amount = form.getFieldValue('amount') || 0
                  const discount = form.getFieldValue('discount') || 0
                  form.setFieldValue('actualAmount', amount - discount)
                }}
              />
            </Form.Item>
            <Form.Item name="actualAmount" label="实付金额" style={{ flex: 1 }}>
              <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="categoryId" label="分类">
            <TreeSelect allowClear placeholder="请选择分类" treeData={categoryTree} />
          </Form.Item>
          <Form.Item name="tagIds" label="标签">
            <TreeSelect
              allowClear
              multiple
              placeholder="请选择标签"
              treeData={tagTree}
              treeCheckable
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
