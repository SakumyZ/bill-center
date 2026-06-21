'use client'

import React, { useState } from 'react'
import { App } from 'antd'
import useSWR from 'swr'
import ManagementTree, { TreeNodeItem } from '@/components/ManagementTree'
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '@/lib/api'

export default function CategoriesPage() {
  const { message } = App.useApp()
  const [activeType, setActiveType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')

  const { data: treeRes, isLoading: isTreeLoading, mutate: mutateTree } = useSWR(
    ['/api/categories', activeType],
    () => fetchCategories({ type: activeType })
  )

  const { data: flatRes, isLoading: isFlatLoading, mutate: mutateFlat } = useSWR(
    ['/api/categories?flat=true', activeType],
    () => fetchCategories({ type: activeType, flat: true })
  )

  const reload = async () => {
    await Promise.all([mutateTree(), mutateFlat()])
  }

  const handleAdd = async (values: any) => {
    const res = await createCategory(values)
    if (res.success) {
      message.success('创建成功')
      await reload()
    } else {
      message.error(res.error || '创建失败')
    }
  }

  const handleUpdate = async (id: string, values: any) => {
    const res = await updateCategory(id, values)
    if (res.success) {
      message.success('更新成功')
      await reload()
    } else {
      message.error(res.error || '更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteCategory(id)
    if (res.success) {
      message.success('删除成功')
      await reload()
    } else {
      message.error(res.error || '删除失败')
    }
  }

  const handleReorder = async (updates: Array<{ id: string; parentId: string | null; sort: number }>) => {
    const res = await reorderCategories(updates)
    if (res.success) {
      message.success('排序更新成功')
      await reload()
    } else {
      message.error(res.error || '排序更新失败')
    }
  }

  return (
    <ManagementTree
      title="分类"
      items={(treeRes?.data as TreeNodeItem[]) || []}
      flatItems={(flatRes?.data as TreeNodeItem[]) || []}
      loading={isTreeLoading || isFlatLoading}
      hasTypeToggle
      hasIcon
      activeType={activeType}
      onTypeChange={setActiveType}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onReorder={handleReorder}
    />
  )
}
