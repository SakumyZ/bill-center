import type { Metadata } from 'next'
import AntdProvider from '@/components/AntdProvider'
import AppLayout from '@/components/AppLayout'
import './globals.css'

export const metadata: Metadata = {
  title: '账单中心 - 个人财务管理平台',
  description: '账单管理、统计分析、智能分类'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdProvider>
          <AppLayout>{children}</AppLayout>
        </AntdProvider>
      </body>
    </html>
  )
}
