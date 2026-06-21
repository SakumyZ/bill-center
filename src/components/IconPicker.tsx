'use client'

import React, { useState, useEffect } from 'react'
import { Input, Tag } from 'antd'
import { Icon } from '@iconify/react'

export interface IconPickerProps {
  value?: string
  onChange?: (value: string) => void
}

const COMMON_ICONS = [
  { name: '餐饮', icon: 'mdi:food' },
  { name: '购物', icon: 'mdi:cart' },
  { name: '住房', icon: 'mdi:home' },
  { name: '交通', icon: 'mdi:bus' },
  { name: '娱乐', icon: 'mdi:gamepad-variant' },
  { name: '工资', icon: 'mdi:cash' },
  { name: '理财', icon: 'mdi:trending-up' },
  { name: '医疗', icon: 'mdi:hospital-building' },
  { name: '运动', icon: 'mdi:dumbbell' },
  { name: '旅行', icon: 'mdi:airplane' },
  { name: '学习', icon: 'mdi:book-open-variant' },
  { name: '数码', icon: 'mdi:laptop' },
  { name: '人情', icon: 'mdi:gift' },
  { name: '水电', icon: 'mdi:flash' },
  { name: '宠物', icon: 'mdi:cat' }
]

export default function IconPicker({ value = '', onChange }: IconPickerProps) {
  const [previewError, setPreviewError] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewError(false)
  }, [value])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Input
          placeholder="例如 mdi:food（可从 icones.js.org 复制）"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className="flex-1"
        />
        {value && (
          <div className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center bg-gray-50">
            {!previewError ? (
              <Icon
                icon={value}
                style={{ fontSize: 20 }}
                onError={() => setPreviewError(true)}
              />
            ) : (
              <span className="text-[10px] text-red-500">失效</span>
            )}
          </div>
        )}
      </div>
      
      {/* 常用图标面板 */}
      <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
        <div className="text-xs text-slate-500 mb-1.5">推荐图标：</div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_ICONS.map(item => (
            <Tag.CheckableTag
              key={item.icon}
              checked={value === item.icon}
              onChange={() => onChange?.(item.icon)}
              className={`flex items-center gap-1 px-1.5 py-0.5 border rounded m-0 ${
                value === item.icon ? 'border-blue-200' : 'border-slate-200 bg-white'
              }`}
            >
              <Icon icon={item.icon} />
              <span>{item.name}</span>
            </Tag.CheckableTag>
          ))}
        </div>
      </div>
    </div>
  )
}
