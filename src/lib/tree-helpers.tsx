import React from 'react'
import { Space } from 'antd'
import { Icon } from '@iconify/react'

export interface TreeOption {
  value: string
  title: string | React.ReactNode
  icon?: string
  color?: string
  type?: 'INCOME' | 'EXPENSE'
  children?: TreeOption[]
  searchValue?: string
}

export function mapTreeDataWithIcon(nodes: any[]): TreeOption[] {
  return nodes.map(node => ({
    value: node.value || node.id,
    title: (
      <Space size={4}>
        {node.icon && node.icon.includes(':') && <Icon icon={node.icon} style={{ fontSize: 14 }} />}
        <span>{node.title || node.name}</span>
      </Space>
    ),
    searchValue: (node.title || node.name) as string,
    children: node.children ? mapTreeDataWithIcon(node.children) : undefined
  }))
}

export function filterTreeDataByType(nodes: any[], type: 'INCOME' | 'EXPENSE'): any[] {
  return nodes
    .filter(node => !node.type || node.type === type)
    .map(node => ({
      ...node,
      children: node.children ? filterTreeDataByType(node.children, type) : undefined
    }))
}

export function getAllKeys(nodes: any[]): string[] {
  return nodes.flatMap(node => [node.id, ...(node.children ? getAllKeys(node.children) : [])])
}
