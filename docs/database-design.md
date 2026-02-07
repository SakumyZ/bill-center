# 数据库设计文档

## 表结构总览

```
Category (分类)
├── id (PK)
├── name
├── type (INCOME/EXPENSE)
├── icon
├── color
├── sort
├── parentId (FK → Category.id)
├── createdAt
├── updatedAt
└── deletedAt (软删除)

Tag (标签)
├── id (PK)
├── name
├── color
├── sort
├── parentId (FK → Tag.id)
├── createdAt
├── updatedAt
└── deletedAt (软删除)

ImportBatch (导入批次)
├── id (PK)
├── fileName
├── source (MANUAL/YIMU/OTHER)
├── totalCount
├── successCount
├── failCount
├── createdAt
└── updatedAt

Bill (账单)
├── id (PK)
├── date
├── type (INCOME/EXPENSE)
├── amount (金额)
├── discount (优惠金额)
├── actualAmount (实付金额)
├── remark
├── source (MANUAL/YIMU/OTHER)
├── categoryId (FK → Category.id)
├── importBatchId (FK → ImportBatch.id)
├── createdAt
├── updatedAt
└── deletedAt (软删除)

BillTag (账单-标签关联表)
├── billId (FK → Bill.id)
└── tagId (FK → Tag.id)
```

## 字段说明

### Category 分类表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(50) | 分类名称 |
| type | ENUM | 收支类型：INCOME/EXPENSE |
| icon | VARCHAR(50) | 图标标识，可选 |
| color | VARCHAR(20) | 颜色值，可选 |
| sort | INT | 排序值，默认0 |
| parentId | UUID | 父分类ID，顶级分类为NULL |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |
| deletedAt | TIMESTAMP | 软删除时间，NULL表示未删除 |

### Tag 标签表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(50) | 标签名称 |
| color | VARCHAR(20) | 颜色值，可选 |
| sort | INT | 排序值，默认0 |
| parentId | UUID | 父标签ID，顶级标签为NULL |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |
| deletedAt | TIMESTAMP | 软删除时间 |

### ImportBatch 导入批次表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| fileName | VARCHAR(255) | 导入文件名 |
| source | ENUM | 数据来源：MANUAL/YIMU/OTHER |
| totalCount | INT | 总记录数 |
| successCount | INT | 成功数 |
| failCount | INT | 失败数 |
| createdAt | TIMESTAMP | 导入时间 |
| updatedAt | TIMESTAMP | 更新时间 |

### Bill 账单表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| date | DATE | 账单日期 |
| type | ENUM | 收支类型：INCOME/EXPENSE |
| amount | DECIMAL(12,2) | 账单金额 |
| discount | DECIMAL(12,2) | 优惠金额，默认0 |
| actualAmount | DECIMAL(12,2) | 实付金额 |
| remark | TEXT | 备注 |
| source | ENUM | 来源：MANUAL/YIMU/OTHER |
| categoryId | UUID | 所属分类ID |
| importBatchId | UUID | 导入批次ID，手动录入为NULL |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |
| deletedAt | TIMESTAMP | 软删除时间 |

### BillTag 账单-标签关联表
| 字段 | 类型 | 说明 |
|------|------|------|
| billId | UUID | 账单ID |
| tagId | UUID | 标签ID |
| (billId, tagId) | 联合主键 | |

## 索引设计

- Bill: `idx_bill_date` (date)
- Bill: `idx_bill_category` (categoryId)
- Bill: `idx_bill_type` (type)
- Bill: `idx_bill_deleted` (deletedAt)
- Bill: `idx_bill_import_batch` (importBatchId)
- Category: `idx_category_parent` (parentId)
- Tag: `idx_tag_parent` (parentId)
- BillTag: `idx_billtag_tag` (tagId)
