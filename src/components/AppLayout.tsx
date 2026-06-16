'use client'

import React, { useState } from 'react'
import { Layout, Menu, ConfigProvider } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  TagsOutlined,
  FileTextOutlined,
  UploadOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'

const { Sider, Content, Header } = Layout

const LogoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <defs>
      {/* Background gradient: Indigo to Royal Blue for high-end feel */}
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1677ff" />
        <stop offset="100%" stopColor="#722ed1" />
      </linearGradient>
      
      {/* Glassmorphic card overlay */}
      <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.45" />
      </linearGradient>
      
      {/* Soft shadow for depth */}
      <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#1677ff" floodOpacity="0.25" />
      </filter>
    </defs>
    
    {/* Base squircle container */}
    <rect width="32" height="32" rx="9" fill="url(#bgGrad)" filter="url(#logoGlow)" />
    
    {/* Glass card shape */}
    <rect x="7" y="10" width="18" height="13" rx="2.5" fill="url(#glassGrad)" />
    
    {/* Golden Card Chip */}
    <rect x="10" y="13.5" width="4.5" height="3.5" rx="0.8" fill="#eab308" />
    
    {/* Stylized bill details */}
    <rect x="16.5" y="13.5" width="6" height="1.5" rx="0.75" fill="#1677ff" opacity="0.75" />
    <rect x="16.5" y="16.5" width="4.5" height="1.5" rx="0.75" fill="#1677ff" opacity="0.75" />
    
    {/* Mint green trend arrow breaking out of the card */}
    <path
      d="M7 24C11.5 21.5 14 23 18 19.5C21 16.8 22.5 17 25 13.5"
      stroke="#52c41a"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 13.5H25V17.5"
      stroke="#52c41a"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

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
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置'
  }
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const selectedKey = menuItems.find(item => pathname.startsWith(item.key))?.key || '/dashboard'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ConfigProvider
        theme={{
          components: {
            Layout: {
              siderBg: '#0f172a',
              triggerBg: '#1e293b',
              triggerColor: '#94a3b8'
            },
            Menu: {
              itemBg: '#0f172a',
              itemColor: '#94a3b8',
              itemHoverBg: 'rgba(255, 255, 255, 0.05)',
              itemHoverColor: '#f8fafc',
              itemSelectedBg: 'rgba(56, 189, 248, 0.12)',
              itemSelectedColor: '#38bdf8',
              activeBarBorderWidth: 0
            }
          }
        }}
      >
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            height: '100vh',
            overflow: 'auto',
            borderRight: '1px solid #1e293b',
            zIndex: 100
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              padding: collapsed ? '0 8px' : '0 16px',
              borderBottom: '1px solid #1e293b',
              overflow: 'hidden'
            }}
          >
            <div
              className="logo-container"
              onClick={() => router.push('/dashboard')}
              style={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '6px 0' : '6px 12px'
              }}
            >
              <LogoIcon className="logo-icon" />
              {!collapsed && (
                <div className="logo-title-container">
                  <span className="logo-title">账单中心</span>
                  <span className="logo-subtitle">Bill Center</span>
                </div>
              )}
            </div>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{ borderRight: 0 }}
          />
        </Sider>
      </ConfigProvider>
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
