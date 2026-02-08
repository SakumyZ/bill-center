/**
 * Excel 账单解析器
 * 可扩展的数据源适配器架构
 */
import * as XLSX from 'xlsx'

export interface ParsedBill {
  date: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  discount: number
  actualAmount: number
  remark: string
  categoryName?: string
  subCategoryName?: string // 二级分类
  tagNames?: string[]
}

export interface ParseResult {
  success: boolean
  bills: ParsedBill[]
  errors: string[]
  total: number
}

// 解析器接口
interface BillParser {
  parse(buffer: ArrayBuffer): ParseResult
}

/**
 * 一木记账解析器
 * 适配一木记账导出的 Excel 格式
 */
class YimuParser implements BillParser {
  parse(buffer: ArrayBuffer): ParseResult {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    const bills: ParsedBill[] = []
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]
        const bill = this.parseRow(row, i + 2) // +2 因为 Excel 有表头且从1开始
        if (bill) bills.push(bill)
      } catch (error) {
        errors.push(`第 ${i + 2} 行: ${(error as Error).message}`)
      }
    }

    return {
      success: errors.length === 0,
      bills,
      errors,
      total: rows.length
    }
  }

  private parseRow(row: Record<string, unknown>, rowNum: number): ParsedBill | null {
    // 一木记账常见字段名映射
    const dateStr = this.getField(row, ['日期', '时间', 'date', 'Date'])
    const typeStr = this.getField(row, ['类型', '收支类型', 'type', 'Type'])
    const amountStr = this.getField(row, ['金额', 'amount', 'Amount'])
    const remark =
      this.getField(row, ['备注', '说明', '描述', 'remark', 'Remark', 'description']) || ''
    const categoryName = this.getField(row, ['分类', '类别', 'category', 'Category'])
    const subCategoryName = this.getField(row, ['二级分类', '子分类', 'subcategory'])
    const discountStr = this.getField(row, ['优惠', '优惠金额', 'discount'])
    const refundStr = this.getField(row, ['退款', 'refund']) // 退款字段
    const tagsStr = this.getField(row, ['标签', 'tags', 'Tag'])

    if (!dateStr || !amountStr) {
      throw new Error(`缺少必要字段（日期/金额）`)
    }

    const amount = Math.abs(parseFloat(String(amountStr)))
    if (isNaN(amount)) {
      throw new Error(`第 ${rowNum} 行金额格式错误: ${amountStr}`)
    }

    // 优惠金额：优惠字段 + 退款金额（都取绝对值）
    let discount = discountStr ? Math.abs(parseFloat(String(discountStr))) : 0
    if (refundStr) {
      const refund = Math.abs(parseFloat(String(refundStr)))
      if (!isNaN(refund)) {
        discount += refund
      }
    }

    // 判断收支类型
    let type: 'INCOME' | 'EXPENSE' = 'EXPENSE'
    if (typeStr) {
      const typeValue = String(typeStr).trim()
      if (['收入', 'income', 'Income', 'INCOME'].includes(typeValue)) {
        type = 'INCOME'
      }
    }

    // 解析日期
    let dateValue: string
    if (typeof dateStr === 'number') {
      // Excel 日期序列号
      const date = XLSX.SSF.parse_date_code(dateStr)
      dateValue = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    } else {
      dateValue = String(dateStr).trim().slice(0, 10)
    }

    // 解析标签（支持逗号/分号/空格分隔）
    const tagNames: string[] = []
    if (tagsStr) {
      const tagsString = String(tagsStr).trim()
      tagNames.push(...tagsString.split(/[,;、\s]+/).filter(t => t.length > 0))
    }

    return {
      date: dateValue,
      type,
      amount,
      discount,
      actualAmount: amount - discount,
      remark: String(remark),
      categoryName: categoryName ? String(categoryName) : undefined,
      subCategoryName: subCategoryName ? String(subCategoryName) : undefined,
      tagNames: tagNames.length > 0 ? tagNames : undefined
    }
  }

  private getField(row: Record<string, unknown>, possibleNames: string[]): unknown {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name]
      }
    }
    return null
  }
}

// 解析器工厂
const parsers: Record<string, BillParser> = {
  YIMU: new YimuParser()
}

export function getParser(source: string): BillParser {
  const parser = parsers[source]
  if (!parser) {
    throw new Error(`不支持的数据源: ${source}`)
  }
  return parser
}
