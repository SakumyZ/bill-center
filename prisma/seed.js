const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || 'postgres_secure_pwd';
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const database = process.env.DB_NAME || 'bill_center';
    connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  }

  const pool = new Pool({ connectionString });

  try {
    // 安全保障：检查 categories 表是否存在
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('categories 表还不存在，跳过种子数据导入。');
      return;
    }

    // 安全保障：检查是否已有分类数据，避免在容器重启或升级时清空或覆盖用户的真实账单
    const countRes = await pool.query('SELECT COUNT(*) FROM categories;');
    const count = parseInt(countRes.rows[0].count, 10);
    
    if (count > 0) {
      console.log('检测到数据库中已存在分类数据，跳过种子数据导入以保护您的真实数据。');
      return;
    }

    const sqlPath = path.join(__dirname, 'seed-yimu-data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('未检测到分类数据，开始导入初始分类和标签种子数据...');
    // pg 驱动的 query 支持单次执行包含多个语句的 SQL 文本
    await pool.query(sql);
    console.log('初始分类和标签种子数据导入成功！');

  } catch (err) {
    console.error('导入分类种子数据失败：', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
