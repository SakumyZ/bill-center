import React from 'react'
import { InputNumber, InputNumberProps } from 'antd'

export default function CurrencyInput(props: InputNumberProps) {
  return (
    <InputNumber
      min={0}
      precision={2}
      prefix="¥"
      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={value => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
      {...props}
    />
  )
}
