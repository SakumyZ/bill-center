'use client'

import React from 'react'
import { App } from 'antd'
import useSWR from 'swr'
import ManagementTree, { TreeNodeItem } from '@/components/ManagementTree'
import { fetchTags, createTag, updateTag, deleteTag, reorderTags } from '@/lib/api'

export default function TagsPage() {
  const { message } = App.useApp()

  const { data: treeRes, isLoading: isTreeLoading, mutate: mutateTree } = useSWR(
    '/api/tags',
    () => fetchTags()
  )

  const { data: flatRes, isLoading: isFlatLoading, mutate: mutateFlat } = useSWR(
    '/api/tags?flat=true',
    () => fetchTags({ flat: true })
  )

  const reload = async () => {
    await Promise.all([mutateTree(), mutateFlat()])
  }

  const handleAdd = async (values: any) => {
    const res = await createTag(values)
    if (res.success) {
      message.success('创建成功')
      await reload()
    } else {
      message.error(res.error || '创建失败')
    }
  }

  const handleUpdate = async (id: string, values: any) => {
    const res = await updateTag(id, values)
    if (res.success) {
      message.success('更新成功')
      await reload()
    } else {
      message.error(res.error || '更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteTag(id)
    if (res.success) {
      message.success('删除成功')
      await reload()
    } else {
      message.error(res.error || '删除失败')
    }
  }

  const handleReorder = async (updates: Array<{ id: string; parentId: string | null; sort: number }>) => {
    const res = await reorderTags(updates)
    if (res.success) {
      message.success('排序已更新')
      mutateTree()
      mutateFlat()
    } else {
      message.error(res.error || '排序更新失败')
    }
  }

  return (
    <ManagementTree
      title="标签"
      items={(treeRes?.data as TreeNodeItem[]) || []}
      flatItems={(flatRes?.data as TreeNodeItem[]) || []}
      loading={isTreeLoading || isFlatLoading}
      hasTypeToggle={false}
      hasIcon={false}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onReorder={handleReorder}
    />
  )
}
