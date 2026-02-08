'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Tree,
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  InputNumber,
  Space,
  App,
  Card,
  Empty,
  Spin,
  Popconfirm,
  Tag
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api-client'

interface CategoryNode {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon?: string
  color?: string
  sort: number
  parentId?: string
  children?: CategoryNode[]
}

export default function CategoriesPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [expandAll, setExpandAll] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [flatCategories, setFlatCategories] = useState<CategoryNode[]>([])
  const [form] = Form.useForm()

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const [treeRes, flatRes] = await Promise.all([
        fetchCategories({ type: activeType }),
        fetchCategories({ type: activeType, flat: true })
      ])
      if (treeRes.success) setCategories(treeRes.data as CategoryNode[])
      if (flatRes.success) setFlatCategories(flatRes.data as CategoryNode[])
    } catch {
      message.error('加载分类失败')
    } finally {
      setLoading(false)
    }
  }, [activeType, message])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const getAllKeys = useCallback((nodes: CategoryNode[]): string[] => {
    return nodes.flatMap(node => [node.id, ...(node.children ? getAllKeys(node.children) : [])])
  }, [])

  useEffect(() => {
    const keys = getAllKeys(categories)
    setExpandedKeys(expandAll ? keys : [])
  }, [categories, expandAll, getAllKeys])

  const handleAdd = (pId?: string) => {
    setEditingId(null)
    setParentId(pId || null)
    form.resetFields()
    form.setFieldsValue({ type: activeType, sort: 0, parentId: pId || null })
    setModalOpen(true)
  }

  const handleEdit = (node: CategoryNode) => {
    setEditingId(node.id)
    setParentId(node.parentId || null)
    form.setFieldsValue({
      name: node.name,
      type: node.type,
      icon: node.icon,
      color: node.color,
      sort: node.sort,
      parentId: node.parentId || null
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteCategory(id)
    if (res.success) {
      message.success('删除成功')
      loadCategories()
    } else {
      message.error(res.error || '删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // 处理颜色值
      if (values.color && typeof values.color === 'object') {
        values.color = values.color.toHexString()
      }

      // 清理空的 parentId，避免传递空字符串导致 UUID 验证失败
      if (!values.parentId) {
        delete values.parentId
      }

      let res
      if (editingId) {
        res = await updateCategory(editingId, values)
      } else {
        res = await createCategory(values)
      }

      if (res.success) {
        message.success(editingId ? '更新成功' : '创建成功')
        setModalOpen(false)
        loadCategories()
      } else {
        message.error(res.error || '操作失败')
      }
    } catch {
      // 表单验证失败
    }
  }

  const renderTreeNodes = (nodes: CategoryNode[]): React.ReactNode[] =>
    nodes.map(node => (
      <Tree.TreeNode
        key={node.id}
        title={
          <Space>
            {node.color && (
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: node.color
                }}
              />
            )}
            <span>{node.name}</span>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={e => {
                e.stopPropagation()
                handleAdd(node.id)
              }}
            />
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={e => {
                e.stopPropagation()
                handleEdit(node)
              }}
            />
            <Popconfirm
              title="确定删除此分类？"
              description="删除后子分类也会一起删除"
              onConfirm={() => handleDelete(node.id)}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={e => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        }
      >
        {node.children && node.children.length > 0 ? renderTreeNodes(node.children) : null}
      </Tree.TreeNode>
    ))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: '#fff',
          paddingBottom: 12
        }}
      >
        <Space>
          <Tag.CheckableTag
            checked={activeType === 'EXPENSE'}
            onChange={() => setActiveType('EXPENSE')}
          >
            支出分类
          </Tag.CheckableTag>
          <Tag.CheckableTag
            checked={activeType === 'INCOME'}
            onChange={() => setActiveType('INCOME')}
          >
            收入分类
          </Tag.CheckableTag>
        </Space>
        <Space>
          <Button onClick={() => setExpandAll(prev => !prev)}>
            {expandAll ? '全部折叠' : '全部展开'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
            新增分类
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Card style={{ height: '100%' }}>
          <Spin spinning={loading}>
            {categories.length > 0 ? (
              <Tree
                showLine
                expandedKeys={expandedKeys}
                onExpand={keys => setExpandedKeys(keys as string[])}
              >
                {renderTreeNodes(categories)}
              </Tree>
            ) : (
              <Empty description="暂无分类数据" />
            )}
          </Spin>
        </Card>
      </div>

      <Modal
        title={editingId ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" maxLength={50} />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '支出', value: 'EXPENSE' },
                { label: '收入', value: 'INCOME' }
              ]}
            />
          </Form.Item>
          <Form.Item name="parentId" label="父分类">
            <Select
              allowClear
              placeholder="无（顶级分类）"
              options={flatCategories
                .filter(c => c.id !== editingId)
                .map(c => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <ColorPicker />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="图标标识" maxLength={50} />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
