import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function successResponse<T>(data: T, pagination?: ApiResponse['pagination']) {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    pagination
  })
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json<ApiResponse>({ success: false, error }, { status })
}

export function paginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
  return { page, pageSize, skip: (page - 1) * pageSize }
}
