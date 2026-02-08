'use client'

import React, { useState } from 'react'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  TagsOutlined,
  FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'

const { Sider, Content, Header } = Layout

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '统计看板'
  },
  {
    key: '/bills',
    icon: <FileTextOutlined />,
    label: '账单管理'
  },
  {
    key: '/categories',
    icon: <AppstoreOutlined />,
    label: '分类管理'
  },
  {
    key: '/tags',
    icon: <TagsOutlined />,
    label: '标签管理'
  },
  {
    key: '/upload',
    icon: <UploadOutlined />,
    label: '上传账单'
  }
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const selectedKey = menuItems.find(item => pathname.startsWith(item.key))?.key || '/dashboard'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          overflow: 'auto',
          borderRight: '1px solid #f0f0f0',
          zIndex: 100
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          <h1
            style={{
              fontSize: collapsed ? 16 : 20,
              fontWeight: 700,
              margin: 0,
              color: '#1677ff',
              transition: 'all 0.2s'
            }}
          >
            {collapsed ? '💰' : '💰 账单中心'}
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            background: '#fff',
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {menuItems.find(item => pathname.startsWith(item.key))?.label || '账单管理平台'}
          </h2>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            height: 'calc(100vh - 112px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  )
}
