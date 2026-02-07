'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Tree,
  Modal,
  Form,
  Input,
  ColorPicker,
  InputNumber,
  Space,
  App,
  Card,
  Empty,
  Spin,
  Popconfirm,
  Select
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { fetchTags, createTag, updateTag, deleteTag } from '@/lib/api-client'

interface TagNode {
  id: string
  name: string
  color?: string
  sort: number
  parentId?: string
  children?: TagNode[]
}

export default function TagsPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<TagNode[]>([])
  const [flatTags, setFlatTags] = useState<TagNode[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const loadTags = useCallback(async () => {
    setLoading(true)
    try {
      const [treeRes, flatRes] = await Promise.all([fetchTags(), fetchTags({ flat: true })])
      if (treeRes.success) setTags(treeRes.data as TagNode[])
      if (flatRes.success) setFlatTags(flatRes.data as TagNode[])
    } catch {
      message.error('加载标签失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const handleAdd = (parentId?: string) => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ sort: 0, parentId: parentId || null })
    setModalOpen(true)
  }

  const handleEdit = (node: TagNode) => {
    setEditingId(node.id)
    form.setFieldsValue({
      name: node.name,
      color: node.color,
      sort: node.sort,
      parentId: node.parentId || null
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteTag(id)
    if (res.success) {
      message.success('删除成功')
      loadTags()
    } else {
      message.error(res.error || '删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.color && typeof values.color === 'object') {
        values.color = values.color.toHexString()
      }

      let res
      if (editingId) {
        res = await updateTag(editingId, values)
      } else {
        res = await createTag(values)
      }

      if (res.success) {
        message.success(editingId ? '更新成功' : '创建成功')
        setModalOpen(false)
        loadTags()
      } else {
        message.error(res.error || '操作失败')
      }
    } catch {
      // 表单验证失败
    }
  }

  const renderTreeNodes = (nodes: TagNode[]): React.ReactNode[] =>
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
              title="确定删除此标签？"
              description="删除后子标签也会一起删除"
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
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
          新增标签
        </Button>
      </div>

      <Card>
        <Spin spinning={loading}>
          {tags.length > 0 ? (
            <Tree defaultExpandAll showLine>
              {renderTreeNodes(tags)}
            </Tree>
          ) : (
            <Empty description="暂无标签数据" />
          )}
        </Spin>
      </Card>

      <Modal
        title={editingId ? '编辑标签' : '新增标签'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" maxLength={50} />
          </Form.Item>
          <Form.Item name="parentId" label="父标签">
            <Select
              allowClear
              placeholder="无（顶级标签）"
              options={flatTags
                .filter(t => t.id !== editingId)
                .map(t => ({ label: t.name, value: t.id }))}
            />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <ColorPicker />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
