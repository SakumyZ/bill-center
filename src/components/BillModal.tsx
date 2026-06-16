'use client'

import React, { useEffect, useState } from 'react'
import { Modal, Form, DatePicker, Select, Space, InputNumber, TreeSelect, Input, App } from 'antd'
import dayjs from 'dayjs'
import { createBill, fetchCategories, fetchTags, updateBill } from '@/lib/api-client'
import {
  BillModalValues,
  BillType,
  CategoryOption,
  TreeOption,
  convertToCategoryTreeSelectData,
  convertToTreeSelectData,
  filterCategoriesByType,
  hasCategoryValue,
  normalizeTagIds
} from '@/lib/bill-form'

interface BillModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: BillModalValues
  onCancel: () => void
  onSuccess: () => void | Promise<void>
}

export default function BillModal({
  open,
  mode,
  initialValues,
  onCancel,
  onSuccess
}: BillModalProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [categoryTree, setCategoryTree] = useState<CategoryOption[]>([])
  const [tagTree, setTagTree] = useState<TreeOption[]>([])
  const currentType = Form.useWatch<BillType>('type', form) ?? 'EXPENSE'
  const filteredCategoryTree = filterCategoriesByType(categoryTree, currentType)
  const discountLabel = currentType === 'INCOME' ? '手续费/扣除' : '优惠金额'
  const actualAmountLabel = currentType === 'INCOME' ? '到账金额' : '实付金额'
  const categoryPlaceholder = currentType === 'INCOME' ? '请选择收入分类' : '请选择支出分类'

  useEffect(() => {
    if (!open) {
      return
    }

    async function loadMetadata(): Promise<void> {
      const [catRes, tagRes] = await Promise.all([fetchCategories(), fetchTags()])
      if (catRes.success) {
        setCategoryTree(convertToCategoryTreeSelectData(catRes.data as Record<string, unknown>[]))
      }
      if (tagRes.success) {
        setTagTree(convertToTreeSelectData(tagRes.data as Record<string, unknown>[]))
      }
    }

    void loadMetadata()
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    form.resetFields()

    if (mode === 'edit' && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        date: dayjs(initialValues.date),
        discount: Number(initialValues.discount || 0),
        actualAmount:
          initialValues.actualAmount ??
          Number(initialValues.amount) - Number(initialValues.discount || 0),
        tagIds: initialValues.tagIds || []
      })
      return
    }

    form.setFieldsValue({ type: 'EXPENSE', discount: 0, source: 'MANUAL' })
  }, [form, initialValues, mode, open])

  const handleValuesChange = (
    changedValues: Record<string, unknown>,
    allValues: Record<string, unknown>
  ): void => {
    if ('type' in changedValues) {
      const availableCategories = filterCategoriesByType(
        categoryTree,
        allValues.type as BillType | undefined
      )
      const currentCategoryId = form.getFieldValue('categoryId') as string | undefined

      if (currentCategoryId && !hasCategoryValue(availableCategories, currentCategoryId)) {
        form.setFieldValue('categoryId', undefined)
      }
    }

    if ('amount' in changedValues || 'discount' in changedValues) {
      const amount = Number(allValues.amount || 0)
      const discount = Number(allValues.discount || 0)
      form.setFieldValue('actualAmount', amount - discount)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        type: values.type,
        amount: values.amount,
        discount: values.discount || 0,
        actualAmount: values.actualAmount ?? values.amount - (values.discount || 0),
        remark: values.remark,
        source: values.source || 'MANUAL',
        categoryId: values.categoryId || undefined,
        tagIds: normalizeTagIds(values.tagIds)
      }

      let res
      if (mode === 'edit' && initialValues?.id) {
        res = await updateBill(initialValues.id, payload)
      } else {
        res = await createBill(payload)
      }

      if (!res.success) {
        message.error(res.error || '操作失败')
        return
      }

      message.success(mode === 'edit' ? '更新成功' : '创建成功')
      form.resetFields()
      await onSuccess()
    } catch {
      // 表单校验失败
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={mode === 'edit' ? '编辑账单' : '新增账单'}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={submitting}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
          <Select
            options={[
              { label: '支出', value: 'EXPENSE' },
              { label: '收入', value: 'INCOME' }
            ]}
          />
        </Form.Item>
        <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
            style={{ flex: 1 }}
          >
            <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="discount" label={discountLabel} style={{ flex: 1 }}>
            <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="actualAmount" label={actualAmountLabel} style={{ flex: 1 }}>
            <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
        </Space>
        <Form.Item name="categoryId" label="分类">
          <TreeSelect
            allowClear
            placeholder={categoryPlaceholder}
            treeData={filteredCategoryTree}
          />
        </Form.Item>
        <Form.Item name="tagIds" label="标签">
          <TreeSelect
            allowClear
            multiple
            placeholder="请选择标签"
            treeData={tagTree}
            treeCheckable
            treeCheckStrictly
            showCheckedStrategy={TreeSelect.SHOW_PARENT}
          />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
