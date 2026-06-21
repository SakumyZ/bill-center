import useSWR from 'swr'
import { fetchCategories, fetchTags } from '@/lib/api'
import { convertToCategoryTreeSelectData, convertToTreeSelectData } from '@/lib/bill-form'

export function useMetadata() {
  const { data: catRes, error: catError, isLoading: isCatLoading } = useSWR(
    '/api/categories',
    () => fetchCategories(),
    { revalidateOnFocus: false }
  )

  const { data: tagRes, error: tagError, isLoading: isTagLoading } = useSWR(
    '/api/tags',
    () => fetchTags(),
    { revalidateOnFocus: false }
  )

  const categoryTree = catRes?.success ? convertToCategoryTreeSelectData(catRes.data as Record<string, unknown>[]) : []
  const tagTree = tagRes?.success ? convertToTreeSelectData(tagRes.data as Record<string, unknown>[]) : []

  return {
    categoryTree,
    tagTree,
    categories: catRes?.success ? (catRes.data as Record<string, unknown>[]) : [],
    tags: tagRes?.success ? (tagRes.data as Record<string, unknown>[]) : [],
    isLoading: isCatLoading || isTagLoading,
    isError: catError || tagError
  }
}

export function useFlatMetadata() {
  const { data: catRes, error: catError, isLoading: isCatLoading } = useSWR(
    '/api/categories?flat=true',
    () => fetchCategories({ flat: true }),
    { revalidateOnFocus: false }
  )

  const { data: tagRes, error: tagError, isLoading: isTagLoading } = useSWR(
    '/api/tags?flat=true',
    () => fetchTags({ flat: true }),
    { revalidateOnFocus: false }
  )

  return {
    flatCategories: catRes?.success ? (catRes.data as Record<string, unknown>[]) : [],
    flatTags: tagRes?.success ? (tagRes.data as Record<string, unknown>[]) : [],
    isLoading: isCatLoading || isTagLoading,
    isError: catError || tagError
  }
}
