import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    const user = process.env.DB_USER || 'postgres'
    const password = process.env.DB_PASSWORD || 'postgres_secure_pwd'
    const host = process.env.DB_HOST || 'localhost'
    const port = process.env.DB_PORT || '5432'
    const database = process.env.DB_NAME || 'bill_center'
    connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`
    
    // 注入内存环境变量，确保 Prisma 查询引擎内部校验通过
    process.env.DATABASE_URL = connectionString
  }
  
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
