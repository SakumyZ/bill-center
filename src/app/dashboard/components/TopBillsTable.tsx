import React, { useState } from 'react'
import { Card, Table, Space, Tag, Popconfirm, App } from 'antd'
import dayjs from 'dayjs'
import { Icon } from '@iconify/react'
import { deleteBill } from '@/lib/api-client'
import BillModal from '@/components/BillModal'

export default function TopBillsTable({ topBills, reload }: { topBills: any[], reload: () => void }) {
  const { message } = App.useApp()
  const [editingBill, setEditingBill] = useState<any>(null)

  const handleDelete = async (id: string) => {
    const res = await deleteBill(id)
    if (res.success) {
      message.success('删除成功')
      reload()
    } else {
      message.error(res.error || '删除失败')
    }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 60,
      render: (text: string) => dayjs(text).format('MM-DD')
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 110,
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
      width: 80,
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
      width: 85,
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
      width: 120,
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Space size={8}>
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
          <Popconfirm
            title="确认删除该账单？"
            onConfirm={e => {
              e?.stopPropagation()
              handleDelete(record.id)
            }}
            onCancel={e => e?.stopPropagation()}
          >
            <a onClick={e => e.stopPropagation()} style={{ color: '#ff4d4f' }}>
              删除
            </a>
          </Popconfirm>
        </Space>
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
