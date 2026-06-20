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
import { Icon } from '@iconify/react'
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '@/lib/api-client'

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

interface IconPickerProps {
  value?: string
  onChange?: (value: string) => void
}

const COMMON_ICONS = [
  { name: '餐饮', icon: 'mdi:food' },
  { name: '购物', icon: 'mdi:cart' },
  { name: '住房', icon: 'mdi:home' },
  { name: '交通', icon: 'mdi:bus' },
  { name: '娱乐', icon: 'mdi:gamepad-variant' },
  { name: '工资', icon: 'mdi:cash' },
  { name: '理财', icon: 'mdi:trending-up' },
  { name: '医疗', icon: 'mdi:hospital-building' },
  { name: '运动', icon: 'mdi:dumbbell' },
  { name: '旅行', icon: 'mdi:airplane' },
  { name: '学习', icon: 'mdi:book-open-variant' },
  { name: '数码', icon: 'mdi:laptop' },
  { name: '人情', icon: 'mdi:gift' },
  { name: '水电', icon: 'mdi:flash' },
  { name: '宠物', icon: 'mdi:cat' }
]

function IconPicker({ value = '', onChange }: IconPickerProps) {
  const [previewError, setPreviewError] = useState(false)

  useEffect(() => {
    setPreviewError(false)
  }, [value])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Input
          placeholder="例如 mdi:food（可从 icones.js.org 复制）"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          style={{ flex: 1 }}
        />
        {value && (
          <div
            style={{
              width: 32,
              height: 32,
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5'
            }}
          >
            {!previewError ? (
              <Icon
                icon={value}
                style={{ fontSize: 20 }}
                onError={() => setPreviewError(true)}
              />
            ) : (
              <span style={{ fontSize: 10, color: '#ff4d4f' }}>失效</span>
            )}
          </div>
        )}
      </div>
      
      {/* 常用图标面板 */}
      <div style={{ background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>推荐图标：</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COMMON_ICONS.map(item => (
            <Tag.CheckableTag
              key={item.icon}
              checked={value === item.icon}
              onChange={() => onChange?.(item.icon)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 6px',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                margin: 0,
                background: value === item.icon ? undefined : '#fff'
              }}
            >
              <Icon icon={item.icon} />
              <span>{item.name}</span>
            </Tag.CheckableTag>
          ))}
        </div>
      </div>
    </div>
  )
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

  const currentParentId = Form.useWatch('parentId', form)
  const isFirstLevel = !currentParentId

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

  const handleDrop = async (info: any) => {
    const dropKey = info.node.key as string
    const dragKey = info.dragNode.key as string
    const dropPos = info.node.pos.split('-')
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])

    const data = JSON.parse(JSON.stringify(categories)) as CategoryNode[]

    let dragObj: CategoryNode | undefined
    const removeNode = (nodes: CategoryNode[], id: string): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
          dragObj = nodes[i]
          nodes.splice(i, 1)
          return true
        }
        if (nodes[i].children && removeNode(nodes[i].children!, id)) {
          return true
        }
      }
      return false
    }
    removeNode(data, dragKey)

    if (!dragObj) return

    if (!info.dropToGap) {
      const insertInside = (nodes: CategoryNode[], id: string): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) {
            nodes[i].children = nodes[i].children || []
            nodes[i].children!.push(dragObj!)
            return true
          }
          if (nodes[i].children && insertInside(nodes[i].children!, id)) {
            return true
          }
        }
        return false
      }
      insertInside(data, dropKey)
    } else {
      const insertAtGap = (nodes: CategoryNode[], id: string): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) {
            if (dropPosition === -1) {
              nodes.splice(i, 0, dragObj!)
            } else {
              nodes.splice(i + 1, 0, dragObj!)
            }
            return true
          }
          if (nodes[i].children && insertAtGap(nodes[i].children!, id)) {
            return true
          }
        }
        return false
      }
      insertAtGap(data, dropKey)
    }

    interface UpdateItem {
      id: string
      parentId: string | null
      sort: number
    }
    const updates: UpdateItem[] = []

    const getUpdates = (nodes: CategoryNode[], pId: string | null = null) => {
      nodes.forEach((node, index) => {
        const original = flatCategories.find(c => c.id === node.id)
        const currentParentId = pId
        const currentSort = index
        const originalParentId = original?.parentId || null

        if (originalParentId !== currentParentId || original?.sort !== currentSort) {
          updates.push({
            id: node.id,
            parentId: currentParentId,
            sort: currentSort
          })
        }
        if (node.children && node.children.length > 0) {
          getUpdates(node.children, node.id)
        }
      })
    }

    getUpdates(data, null)

    if (updates.length === 0) return

    setLoading(true)
    try {
      const res = await reorderCategories(updates)
      if (res.success) {
        message.success('排序更新成功')
        await loadCategories()
      } else {
        message.error(res.error || '排序更新失败')
      }
    } catch {
      message.error('排序更新失败')
    } finally {
      setLoading(false)
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
            {!node.parentId && node.icon && node.icon.includes(':') && (
              <Icon icon={node.icon} style={{ fontSize: 16, display: 'flex', alignItems: 'center' }} />
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
                draggable
                blockNode
                showLine
                expandedKeys={expandedKeys}
                onExpand={keys => setExpandedKeys(keys as string[])}
                onDrop={handleDrop}
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
          {isFirstLevel && (
            <Form.Item name="icon" label="一级分类图标">
              <IconPicker />
            </Form.Item>
          )}
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
