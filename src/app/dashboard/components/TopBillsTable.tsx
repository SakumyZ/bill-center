import React, { useState } from 'react'
import { Card, Table, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import { Icon } from '@iconify/react'
import BillModal from '@/components/BillModal'

export default function TopBillsTable({ topBills, reload }: { topBills: any[], reload: () => void }) {
  const [editingBill, setEditingBill] = useState<any>(null)

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (text: string) => dayjs(text).format('MM-DD')
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: any) =>
        category ? (
          <Space size={4}>
            {category.icon && <Icon icon={category.icon} />}
            <span style={{ color: category.color }}>{category.name}</span>
          </Space>
        ) : (
          <span style={{ color: '#999' }}>未分类</span>
        )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      ellipsis: true,
      render: (tags: any[]) =>
        tags?.length > 0
          ? tags.map((t: any) => {
              const tagObj = t.tag || t
              return (
                <Tag key={tagObj.id} color={tagObj.color} style={{ marginInlineEnd: 4 }}>
                  {tagObj.name}
                </Tag>
              )
            })
          : '-'
    },
    {
      title: '金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 100,
      align: 'right' as const,
      render: (amount: number, record: any) => (
        <span style={{ color: record.type === 'INCOME' ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
          {record.type === 'INCOME' ? '+' : '-'}¥{Number(amount).toFixed(2)}
        </span>
      )
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
      width: 80,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <a
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            setEditingBill({
              ...record,
              tagIds: record.tags?.map((t: any) => (t.tag ? t.tag.id : t.id)) || []
            })
          }}
        >
          查看
        </a>
      )
    }
  ]

  return (
    <>
      <Card title="大额账单 TOP 10" className="h-full">
        <Table
          columns={columns}
          dataSource={topBills}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>
      
      {editingBill && (
        <BillModal
          open={!!editingBill}
          mode="edit"
          initialValues={editingBill}
          onCancel={() => setEditingBill(null)}
          onSuccess={() => {
            setEditingBill(null)
            reload()
          }}
        />
      )}
    </>
  )
}
