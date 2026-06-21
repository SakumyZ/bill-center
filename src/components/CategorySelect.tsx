import React, { useMemo } from 'react'
import { TreeSelect, TreeSelectProps } from 'antd'
import { useMetadata } from '@/hooks/useMetadata'
import { mapTreeDataWithIcon, filterTreeDataByType } from '@/lib/tree-helpers'

export interface CategorySelectProps extends Omit<TreeSelectProps, 'treeData'> {
  type?: 'INCOME' | 'EXPENSE'
}

export default function CategorySelect({ type, ...props }: CategorySelectProps) {
  const { categoryTree, isLoading } = useMetadata()

  const treeData = useMemo(() => {
    let data = categoryTree
    if (type) {
      data = filterTreeDataByType(data, type)
    }
    return mapTreeDataWithIcon(data)
  }, [categoryTree, type])

  return (
    <TreeSelect
      allowClear
      treeData={treeData}
      showSearch={{ treeNodeFilterProp: 'searchValue' }}
      placeholder="请选择分类"
      loading={isLoading}
      {...props}
    />
  )
}
