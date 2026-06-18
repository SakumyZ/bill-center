FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN npx prisma generate

# Build Next.js project
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 拷贝依赖文件并安装完整的生产环境依赖，确保生产环境也有完整的 Prisma CLI 及其深层依赖（如 valibot）
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 拷贝 Prisma 结构及配置以供运行时部署表结构
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# 启动 Web 前，先通过 Shell 拼接导出 DATABASE_URL，然后同步数据库表结构，安全导入初始种子数据，再启动服务
CMD ["sh", "-c", "export DATABASE_URL=\"postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres_secure_pwd}@${DB_HOST:-db}:${DB_PORT:-5432}/${DB_NAME:-bill_center}?schema=public\" && npx prisma db push --accept-data-loss && node prisma/seed.js && node server.js"]
