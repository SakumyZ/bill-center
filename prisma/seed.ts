import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') })

let connectionString = process.env.DATABASE_URL
if (!connectionString) {
  const user = process.env.DB_USER || 'postgres'
  const password = process.env.DB_PASSWORD || 'postgres_secure_pwd'
  const host = process.env.DB_HOST || 'localhost'
  const port = process.env.DB_PORT || '5432'
  const database = process.env.DB_NAME || 'bill_center'
  connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const categoriesData = [
  {
    "id": "cat-food-001",
    "name": "食品烟酒",
    "type": "EXPENSE",
    "icon": "ShoppingCart",
    "color": "#FF6B6B",
    "sort": 1,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-18T15:47:35.943Z",
    "deletedAt": null,
    "children": [
      {
        "id": "c6544be1-b762-4b3e-9c0a-6423e699088a",
        "name": "早餐",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 0,
        "parentId": "cat-food-001",
        "createdAt": "2026-06-19T13:55:23.187Z",
        "updatedAt": "2026-06-19T13:55:23.187Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-food-001-001",
        "name": "小吃",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-food-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-food-001-003",
        "name": "午餐",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 3,
        "parentId": "cat-food-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-food-001-004",
        "name": "晚餐",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 4,
        "parentId": "cat-food-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-food-001-005",
        "name": "饮料/酒水",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 5,
        "parentId": "cat-food-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-food-001-007",
        "name": "生鲜肉品",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 7,
        "parentId": "cat-food-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-food-001-009",
        "name": "水果",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 9,
        "parentId": "cat-food-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      }
    ]
  },
  {
    "id": "cat-shop-001",
    "name": "购物消费",
    "type": "EXPENSE",
    "icon": "ShoppingCart",
    "color": "#FFC107",
    "sort": 2,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-18T15:47:35.943Z",
    "deletedAt": null,
    "children": [
      {
        "id": "cdc2edb7-cb14-42ff-a8f8-65f8f700cd9c",
        "name": "数码科技",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 0,
        "parentId": "cat-shop-001",
        "createdAt": "2026-06-19T14:27:22.932Z",
        "updatedAt": "2026-06-19T14:27:22.932Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-shop-001-001",
        "name": "日用百货",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-shop-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-shop-001-002",
        "name": "美妆护肤",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 2,
        "parentId": "cat-shop-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-shop-001-003",
        "name": "衣服鞋帽",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 3,
        "parentId": "cat-shop-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-shop-001-004",
        "name": "箱包配饰",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 4,
        "parentId": "cat-shop-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-shop-001-005",
        "name": "饰品首饰",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 5,
        "parentId": "cat-shop-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      }
    ]
  },
  {
    "id": "cat-home-001",
    "name": "居家生活",
    "type": "EXPENSE",
    "icon": "Home",
    "color": "#26A69A",
    "sort": 3,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-19T14:19:23.848Z",
    "deletedAt": null,
    "children": [
      {
        "id": "2f3100af-5af7-4ade-b29b-e4e3546135c8",
        "name": "话费宽带",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 0,
        "parentId": "cat-home-001",
        "createdAt": "2026-06-19T14:25:06.547Z",
        "updatedAt": "2026-06-19T14:25:06.547Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "ff1391c2-28b3-4316-ab3f-927a4e979ccd",
        "name": "物业费",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 0,
        "parentId": "cat-home-001",
        "createdAt": "2026-06-19T14:25:45.170Z",
        "updatedAt": "2026-06-19T14:25:45.170Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "8e6e2b97-a229-4e83-929a-dd94b9b4499f",
        "name": "理发",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 0,
        "parentId": "cat-home-001",
        "createdAt": "2026-06-19T14:26:40.473Z",
        "updatedAt": "2026-06-19T14:26:40.473Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-home-001-001",
        "name": "房租/还贷",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-home-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-19T14:25:31.077Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-home-001-002",
        "name": "水电燃",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 2,
        "parentId": "cat-home-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-19T14:19:07.953Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-home-001-003",
        "name": "家具家电",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 3,
        "parentId": "cat-home-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-home-001-004",
        "name": "居家用品",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 4,
        "parentId": "cat-home-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-home-001-005",
        "name": "家政清洁",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 5,
        "parentId": "cat-home-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-19T14:26:04.030Z",
        "deletedAt": null,
        "children": []
      }
    ]
  },
  {
    "id": "cat-trans-001",
    "name": "出行交通",
    "type": "EXPENSE",
    "icon": "Car",
    "color": "#42A5F5",
    "sort": 4,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-18T15:47:35.943Z",
    "deletedAt": null,
    "children": [
      {
        "id": "cat-trans-001-001",
        "name": "出租车",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-trans-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-trans-001-002",
        "name": "火车",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 2,
        "parentId": "cat-trans-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-trans-001-003",
        "name": "公交",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 3,
        "parentId": "cat-trans-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-trans-001-004",
        "name": "地铁",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 4,
        "parentId": "cat-trans-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-trans-001-005",
        "name": "加油",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 5,
        "parentId": "cat-trans-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-trans-001-006",
        "name": "停车费",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 6,
        "parentId": "cat-trans-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      }
    ]
  },
  {
    "id": "cat-ent-001",
    "name": "休闲娱乐",
    "type": "EXPENSE",
    "icon": "Smile",
    "color": "#AB47BC",
    "sort": 5,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-18T15:47:35.943Z",
    "deletedAt": null,
    "children": [
      {
        "id": "cat-ent-001-001",
        "name": "电影",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-ent-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-ent-001-002",
        "name": "游戏",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 2,
        "parentId": "cat-ent-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-ent-001-003",
        "name": "演出门票",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 3,
        "parentId": "cat-ent-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-ent-001-004",
        "name": "运动户外",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 4,
        "parentId": "cat-ent-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-ent-001-005",
        "name": "宠物",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 5,
        "parentId": "cat-ent-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      }
    ]
  },
  {
    "id": "cat-edu-001",
    "name": "文化教育",
    "type": "EXPENSE",
    "icon": "Book",
    "color": "#7E57C2",
    "sort": 6,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-18T15:47:35.943Z",
    "deletedAt": null,
    "children": [
      {
        "id": "cat-edu-001-001",
        "name": "学费",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-edu-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-edu-001-002",
        "name": "书籍音乐",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 2,
        "parentId": "cat-edu-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-edu-001-003",
        "name": "培训考证",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 3,
        "parentId": "cat-edu-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-edu-001-004",
        "name": "软件工具",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 4,
        "parentId": "cat-edu-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      }
    ]
  },
  {
    "id": "cat-gift-001",
    "name": "送礼人情",
    "type": "EXPENSE",
    "icon": "Gift",
    "color": "#EC407A",
    "sort": 7,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-18T15:47:35.943Z",
    "deletedAt": null,
    "children": [
      {
        "id": "cat-gift-001-001",
        "name": "礼物",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-gift-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-gift-001-002",
        "name": "请客吃饭",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 2,
        "parentId": "cat-gift-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-gift-001-003",
        "name": "红包",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 3,
        "parentId": "cat-gift-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-gift-001-004",
        "name": "人情往来",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 4,
        "parentId": "cat-gift-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      }
    ]
  },
  {
    "id": "cat-health-001",
    "name": "健康医疗",
    "type": "EXPENSE",
    "icon": "Heart",
    "color": "#29B6F6",
    "sort": 8,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-18T15:47:35.943Z",
    "deletedAt": null,
    "children": [
      {
        "id": "cat-health-001-001",
        "name": "医疗挂号",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-health-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-health-001-002",
        "name": "主治项目",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 2,
        "parentId": "cat-health-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-health-001-003",
        "name": "医疗用品",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 3,
        "parentId": "cat-health-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-health-001-004",
        "name": "买药",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 4,
        "parentId": "cat-health-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-19T14:28:22.861Z",
        "deletedAt": null,
        "children": []
      }
    ]
  },
  {
    "id": "cat-other-001",
    "name": "其他",
    "type": "EXPENSE",
    "icon": "More",
    "color": "#90A4AE",
    "sort": 9,
    "parentId": null,
    "createdAt": "2026-06-18T15:47:35.943Z",
    "updatedAt": "2026-06-18T15:47:35.943Z",
    "deletedAt": null,
    "children": [
      {
        "id": "cat-other-001-001",
        "name": "烟酒茶",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 1,
        "parentId": "cat-other-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      },
      {
        "id": "cat-other-001-002",
        "name": "其他消费",
        "type": "EXPENSE",
        "icon": null,
        "color": null,
        "sort": 2,
        "parentId": "cat-other-001",
        "createdAt": "2026-06-18T15:47:35.943Z",
        "updatedAt": "2026-06-18T15:47:35.943Z",
        "deletedAt": null,
        "children": []
      }
    ]
  }
]

async function main() {
  console.log('开始导入分类种子数据...')
  try {
    for (const parent of categoriesData) {
      const parentId = parent.id
      // Upsert 一级分类
      await prisma.category.upsert({
        where: { id: parentId },
        update: {
          name: parent.name,
          type: parent.type as any,
          icon: parent.icon,
          color: parent.color,
          sort: parent.sort,
          parentId: null,
        },
        create: {
          id: parentId,
          name: parent.name,
          type: parent.type as any,
          icon: parent.icon,
          color: parent.color,
          sort: parent.sort,
          parentId: null,
        }
      })
      console.log(`已处理一级分类: ${parent.name}`)

      if (parent.children && parent.children.length > 0) {
        for (const child of parent.children) {
          // Upsert 二级分类
          await prisma.category.upsert({
            where: { id: child.id },
            update: {
              name: child.name,
              type: child.type as any,
              icon: child.icon,
              color: child.color,
              sort: child.sort,
              parentId: parentId,
            },
            create: {
              id: child.id,
              name: child.name,
              type: child.type as any,
              icon: child.icon,
              color: child.color,
              sort: child.sort,
              parentId: parentId,
            }
          })
        }
        console.log(`  已处理 ${parent.name} 的 ${parent.children.length} 个二级分类`)
      }
    }
    console.log('分类种子数据导入完成！')
  } catch (error) {
    console.error('导入种子数据出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
