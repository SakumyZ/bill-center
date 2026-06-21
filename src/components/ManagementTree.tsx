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
  Card,
  Empty,
  Spin,
  Popconfirm,
  Tag
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Icon } from '@iconify/react'
import IconPicker from './IconPicker'

export interface TreeNodeItem {
  id: string
  name: string
  type?: 'INCOME' | 'EXPENSE'
  icon?: string
  color?: string
  sort: number
  parentId?: string | null
  children?: TreeNodeItem[]
}

export interface ManagementTreeProps {
  title: string
  items: TreeNodeItem[]
  flatItems: TreeNodeItem[]
  loading: boolean
  hasTypeToggle?: boolean
  hasIcon?: boolean
  activeType?: 'INCOME' | 'EXPENSE'
  onTypeChange?: (type: 'INCOME' | 'EXPENSE') => void
  onAdd: (data: any) => Promise<void>
  onUpdate: (id: string, data: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder?: (updates: Array<{ id: string; parentId: string | null; sort: number }>) => Promise<void>
}

export default function ManagementTree({
  title,
  items,
  flatItems,
  loading,
  hasTypeToggle = false,
  hasIcon = false,
  activeType = 'EXPENSE',
  onTypeChange,
  onAdd,
  onUpdate,
  onDelete,
  onReorder
}: ManagementTreeProps) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [expandAll, setExpandAll] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const currentParentId = Form.useWatch('parentId', form)
  const isFirstLevel = !currentParentId

  const getAllKeys = useCallback((nodes: TreeNodeItem[]): string[] => {
    const getKeys = (n: TreeNodeItem[]): string[] => {
      return n.flatMap(node => [node.id, ...(node.children ? getKeys(node.children) : [])])
    }
    return getKeys(nodes)
  }, [])

  useEffect(() => {
    const keys = getAllKeys(items)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedKeys(expandAll ? keys : [])
  }, [items, expandAll, getAllKeys])

  const handleAdd = (pId?: string) => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ type: activeType, sort: 0, parentId: pId || null })
    setModalOpen(true)
  }

  const handleEdit = (node: TreeNodeItem) => {
    setEditingId(node.id)
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
    try {
      await onDelete(id)
    } catch {
      // Error handled by parent or API
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.color && typeof values.color === 'object') {
        values.color = values.color.toHexString()
      }
      if (!values.parentId) {
        delete values.parentId
      }

      if (editingId) {
        await onUpdate(editingId, values)
      } else {
        await onAdd(values)
      }
      setModalOpen(false)
    } catch {
      // Validation failed
    }
  }

  const handleDrop = async (info: any) => {
    if (!onReorder) return
    const dropKey = info.node.key as string
    const dragKey = info.dragNode.key as string
    const dropPos = info.node.pos.split('-')
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])

    const data = JSON.parse(JSON.stringify(items)) as TreeNodeItem[]
    let dragObj: TreeNodeItem | undefined

    const removeNode = (nodes: TreeNodeItem[], id: string): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
          dragObj = nodes[i]
          nodes.splice(i, 1)
          return true
        }
        if (nodes[i].children && removeNode(nodes[i].children!, id)) return true
      }
      return false
    }
    removeNode(data, dragKey)
    if (!dragObj) return

    if (!info.dropToGap) {
      const insertInside = (nodes: TreeNodeItem[], id: string): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) {
            nodes[i].children = nodes[i].children || []
            nodes[i].children!.push(dragObj!)
            return true
          }
          if (nodes[i].children && insertInside(nodes[i].children!, id)) return true
        }
        return false
      }
      insertInside(data, dropKey)
    } else {
      const insertAtGap = (nodes: TreeNodeItem[], id: string): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) {
            if (dropPosition === -1) nodes.splice(i, 0, dragObj!)
            else nodes.splice(i + 1, 0, dragObj!)
            return true
          }
          if (nodes[i].children && insertAtGap(nodes[i].children!, id)) return true
        }
        return false
      }
      insertAtGap(data, dropKey)
    }

    const updates: Array<{ id: string; parentId: string | null; sort: number }> = []
    const getUpdates = (nodes: TreeNodeItem[], pId: string | null = null) => {
      nodes.forEach((node, index) => {
        const original = flatItems.find(c => c.id === node.id)
        if (original?.parentId !== pId || original?.sort !== index) {
          updates.push({ id: node.id, parentId: pId, sort: index })
        }
        if (node.children?.length) getUpdates(node.children, node.id)
      })
    }
    getUpdates(data, null)
    if (updates.length > 0) {
      await onReorder(updates)
    }
  }

  const getTreeData = (nodes: TreeNodeItem[]): any[] =>
    nodes.map(node => ({
      key: node.id,
      title: (
        <Space>
          {node.color && (
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: node.color }}
            />
          )}
          {!node.parentId && node.icon && node.icon.includes(':') && (
            <Icon icon={node.icon} className="text-base flex items-center" />
          )}
          <span>{node.name}</span>
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={e => { e.stopPropagation(); handleAdd(node.id) }} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={e => { e.stopPropagation(); handleEdit(node) }} />
          <Popconfirm
            title={`确定删除此${title}？`}
            description={`删除后子${title}也会一起删除`}
            onConfirm={() => handleDelete(node.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      ),
      children: node.children?.length ? getTreeData(node.children) : undefined
    }))

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 flex justify-between sticky top-0 z-10 bg-white pb-3">
        <Space>
          {hasTypeToggle && onTypeChange && (
            <>
              <Tag.CheckableTag checked={activeType === 'EXPENSE'} onChange={() => onTypeChange('EXPENSE')}>支出分类</Tag.CheckableTag>
              <Tag.CheckableTag checked={activeType === 'INCOME'} onChange={() => onTypeChange('INCOME')}>收入分类</Tag.CheckableTag>
            </>
          )}
        </Space>
        <Space>
          <Button onClick={() => setExpandAll(prev => !prev)}>{expandAll ? '全部折叠' : '全部展开'}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>新增{title}</Button>
        </Space>
      </div>

      <div className="flex-1 overflow-auto">
        <Card className="h-full" styles={{ body: { height: '100%' } }}>
          <Spin spinning={loading}>
            {items.length > 0 ? (
              <Tree
                draggable={!!onReorder}
                blockNode
                showLine
                expandedKeys={expandedKeys}
                onExpand={keys => setExpandedKeys(keys as string[])}
                onDrop={handleDrop}
                treeData={getTreeData(items)}
              />
            ) : (
              <Empty description={`暂无${title}数据`} />
            )}
          </Spin>
        </Card>
      </div>

      <Modal
        title={editingId ? `编辑${title}` : `新增${title}`}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={`${title}名称`} rules={[{ required: true, message: `请输入${title}名称` }]}>
            <Input placeholder={`请输入${title}名称`} maxLength={50} />
          </Form.Item>
          {hasTypeToggle && (
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select options={[{ label: '支出', value: 'EXPENSE' }, { label: '收入', value: 'INCOME' }]} />
            </Form.Item>
          )}
          <Form.Item name="parentId" label={`父${title}`}>
            <Select
              allowClear
              placeholder="无（顶级）"
              options={flatItems.filter(c => c.id !== editingId).map(c => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <ColorPicker />
          </Form.Item>
          {hasIcon && isFirstLevel && (
            <Form.Item name="icon" label={`一级${title}图标`}>
              <IconPicker />
            </Form.Item>
          )}
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
