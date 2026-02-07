'use client'

import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import 'echarts-wordcloud'

echarts.use([
  PieChart,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer
])

interface EChartsWrapperProps {
  option: Record<string, unknown>
  style?: React.CSSProperties
  notMerge?: boolean
}

export default function EChartsWrapper({ option, style, notMerge }: EChartsWrapperProps) {
  return <ReactEChartsCore echarts={echarts} option={option} style={style} notMerge={notMerge} />
}
