import dayjs from 'dayjs'

export type Dimension = 'year' | 'month' | 'day'
export type PeriodPreset = 'previous' | 'current' | 'next'

export function getDefaultDateRange(dimension: Dimension): [dayjs.Dayjs, dayjs.Dayjs] {
  if (dimension === 'year') {
    return [dayjs().startOf('year'), dayjs().endOf('year')]
  }
  const previousMonth = dayjs().subtract(1, 'month')
  return [previousMonth.startOf('month'), previousMonth.endOf('month')]
}

export function getPresetDateRange(
  dimension: Dimension,
  preset: PeriodPreset
): [dayjs.Dayjs, dayjs.Dayjs] {
  const offset = preset === 'previous' ? -1 : preset === 'next' ? 1 : 0

  if (dimension === 'year') {
    const target = dayjs().add(offset, 'year')
    return [target.startOf('year'), target.endOf('year')]
  }

  if (dimension === 'month') {
    const target = dayjs().add(offset, 'month')
    return [target.startOf('month'), target.endOf('month')]
  }

  const target = dayjs().add(offset, 'day')
  return [target.startOf('day'), target.endOf('day')]
}

export function normalizeDateRange(
  dimension: Dimension,
  range: [dayjs.Dayjs, dayjs.Dayjs]
): [dayjs.Dayjs, dayjs.Dayjs] {
  if (dimension === 'year') {
    return [range[0].startOf('year'), range[1].endOf('year')]
  }
  if (dimension === 'month') {
    return [range[0].startOf('month'), range[1].endOf('month')]
  }
  return [range[0].startOf('day'), range[1].endOf('day')]
}

export function getPickerMode(dimension: Dimension): 'year' | 'month' | undefined {
  if (dimension === 'year') return 'year'
  if (dimension === 'month') return 'month'
  return undefined
}

export function getRangePickerFormat(dimension: Dimension) {
  if (dimension === 'year') return 'YYYY'
  if (dimension === 'month') return 'YYYY-MM'
  return 'YYYY-MM-DD'
}

export function getPresetLabel(dimension: Dimension, preset: PeriodPreset) {
  const labels: Record<Dimension, Record<PeriodPreset, string>> = {
    year: { previous: '前年', current: '本年', next: '下年' },
    month: { previous: '上月', current: '本月', next: '下月' },
    day: { previous: '前日', current: '本日', next: '次日' }
  }
  return labels[dimension][preset]
}

export function resolveMatchedPreset(
  dimension: Dimension,
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
): PeriodPreset | undefined {
  const presets: PeriodPreset[] = ['previous', 'current', 'next']
  return presets.find(preset => {
    const [start, end] = getPresetDateRange(dimension, preset)
    return dateRange[0].isSame(start, 'day') && dateRange[1].isSame(end, 'day')
  })
}
