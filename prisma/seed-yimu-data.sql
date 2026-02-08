-- 一木记账 分类和标签导入脚本
-- 执行方式: psql -U postgres -d bill_center -f prisma/seed-yimu-data.sql

-- ============ 清空现有数据（可选，谨慎使用）============
-- DELETE FROM bill_tags;
-- DELETE FROM bills;
-- DELETE FROM categories WHERE "deletedAt" IS NULL;
-- DELETE FROM tags WHERE "deletedAt" IS NULL;


-- ============ 插入分类数据 ============

-- 1. 食品烟酒
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-food-001', '食品烟酒', 'EXPENSE', 1, '#FF6B6B', 'ShoppingCart', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-food-001-001', '小吃', 'cat-food-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-002', '牛奶', 'cat-food-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-003', '午餐', 'cat-food-001', 'EXPENSE', 3, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-004', '晚餐', 'cat-food-001', 'EXPENSE', 4, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-005', '饮料/酒水', 'cat-food-001', 'EXPENSE', 5, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-006', '小龙虾', 'cat-food-001', 'EXPENSE', 6, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-007', '生鲜肉品', 'cat-food-001', 'EXPENSE', 7, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-008', '面条', 'cat-food-001', 'EXPENSE', 8, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-009', '水果', 'cat-food-001', 'EXPENSE', 9, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-010', '馄饨', 'cat-food-001', 'EXPENSE', 10, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-011', '新鲜蔬菜', 'cat-food-001', 'EXPENSE', 11, NULL, NULL, NOW(), NOW()),
  ('cat-food-001-012', '主食', 'cat-food-001', 'EXPENSE', 12, NULL, NULL, NOW(), NOW());

-- 2. 购物消费
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-shop-001', '购物消费', 'EXPENSE', 2, '#FFC107', 'ShoppingCart', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-shop-001-001', '日用百货', 'cat-shop-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-shop-001-002', '美妆护肤', 'cat-shop-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW()),
  ('cat-shop-001-003', '衣服鞋帽', 'cat-shop-001', 'EXPENSE', 3, NULL, NULL, NOW(), NOW()),
  ('cat-shop-001-004', '箱包配饰', 'cat-shop-001', 'EXPENSE', 4, NULL, NULL, NOW(), NOW()),
  ('cat-shop-001-005', '饰品首饰', 'cat-shop-001', 'EXPENSE', 5, NULL, NULL, NOW(), NOW());

-- 3. 房屋生活
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-home-001', '房屋生活', 'EXPENSE', 3, '#26A69A', 'Home', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-home-001-001', '房租', 'cat-home-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-home-001-002', '水电气', 'cat-home-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW()),
  ('cat-home-001-003', '家具家电', 'cat-home-001', 'EXPENSE', 3, NULL, NULL, NOW(), NOW()),
  ('cat-home-001-004', '居家用品', 'cat-home-001', 'EXPENSE', 4, NULL, NULL, NOW(), NOW()),
  ('cat-home-001-005', '维修保养', 'cat-home-001', 'EXPENSE', 5, NULL, NULL, NOW(), NOW());

-- 4. 出行交通
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-trans-001', '出行交通', 'EXPENSE', 4, '#42A5F5', 'Car', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-trans-001-001', '出租车', 'cat-trans-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-trans-001-002', '火车', 'cat-trans-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW()),
  ('cat-trans-001-003', '公交', 'cat-trans-001', 'EXPENSE', 3, NULL, NULL, NOW(), NOW()),
  ('cat-trans-001-004', '地铁', 'cat-trans-001', 'EXPENSE', 4, NULL, NULL, NOW(), NOW()),
  ('cat-trans-001-005', '加油', 'cat-trans-001', 'EXPENSE', 5, NULL, NULL, NOW(), NOW()),
  ('cat-trans-001-006', '停车费', 'cat-trans-001', 'EXPENSE', 6, NULL, NULL, NOW(), NOW());

-- 5. 休闲娱乐
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-ent-001', '休闲娱乐', 'EXPENSE', 5, '#AB47BC', 'Smile', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-ent-001-001', '电影', 'cat-ent-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-ent-001-002', '游戏', 'cat-ent-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW()),
  ('cat-ent-001-003', '演出门票', 'cat-ent-001', 'EXPENSE', 3, NULL, NULL, NOW(), NOW()),
  ('cat-ent-001-004', '运动户外', 'cat-ent-001', 'EXPENSE', 4, NULL, NULL, NOW(), NOW()),
  ('cat-ent-001-005', '宠物', 'cat-ent-001', 'EXPENSE', 5, NULL, NULL, NOW(), NOW());

-- 6. 文化教育
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-edu-001', '文化教育', 'EXPENSE', 6, '#7E57C2', 'Book', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-edu-001-001', '学费', 'cat-edu-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-edu-001-002', '书籍音乐', 'cat-edu-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW()),
  ('cat-edu-001-003', '培训考证', 'cat-edu-001', 'EXPENSE', 3, NULL, NULL, NOW(), NOW()),
  ('cat-edu-001-004', '软件工具', 'cat-edu-001', 'EXPENSE', 4, NULL, NULL, NOW(), NOW());

-- 7. 送礼人情
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-gift-001', '送礼人情', 'EXPENSE', 7, '#EC407A', 'Gift', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-gift-001-001', '礼物', 'cat-gift-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-gift-001-002', '请客吃饭', 'cat-gift-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW()),
  ('cat-gift-001-003', '红包', 'cat-gift-001', 'EXPENSE', 3, NULL, NULL, NOW(), NOW()),
  ('cat-gift-001-004', '人情往来', 'cat-gift-001', 'EXPENSE', 4, NULL, NULL, NOW(), NOW());

-- 8. 健康医疗
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-health-001', '健康医疗', 'EXPENSE', 8, '#29B6F6', 'Heart', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-health-001-001', '医疗挂号', 'cat-health-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-health-001-002', '主治项目', 'cat-health-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW()),
  ('cat-health-001-003', '医疗用品', 'cat-health-001', 'EXPENSE', 3, NULL, NULL, NOW(), NOW()),
  ('cat-health-001-004', '药品', 'cat-health-001', 'EXPENSE', 4, NULL, NULL, NOW(), NOW());

-- 9. 其他
INSERT INTO categories (id, name, type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-other-001', '其他', 'EXPENSE', 9, '#90A4AE', 'More', NOW(), NOW());

INSERT INTO categories (id, name, "parentId", type, sort, color, icon, "createdAt", "updatedAt")
VALUES
  ('cat-other-001-001', '烟酒茶', 'cat-other-001', 'EXPENSE', 1, NULL, NULL, NOW(), NOW()),
  ('cat-other-001-002', '其他消费', 'cat-other-001', 'EXPENSE', 2, NULL, NULL, NOW(), NOW());


-- ============ 插入标签数据 ============

-- 1. 手办
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-figure-001', '手办', 1, '#FF6B6B', NOW(), NOW());

INSERT INTO tags (id, name, "parentId", sort, color, "createdAt", "updatedAt")
VALUES
  ('tag-figure-001-001', '高达', 'tag-figure-001', 1, NULL, NOW(), NOW()),
  ('tag-figure-001-002', '盲盒', 'tag-figure-001', 2, NULL, NOW(), NOW());

-- 2. 理财
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-finance-001', '理财', 2, '#4CAF50', NOW(), NOW());

-- 3. 生活缴费
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-bill-001', '生活缴费', 3, '#2196F3', NOW(), NOW());

-- 4. 礼物
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-gift-001', '礼物', 4, '#FF9800', NOW(), NOW());

-- 5. 数码
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-digital-001', '数码', 5, '#9C27B0', NOW(), NOW());

-- 6. 游戏
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-game-001', '游戏', 6, '#F44336', NOW(), NOW());

-- 7. 饮料
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-drink-001', '饮料', 7, '#00BCD4', NOW(), NOW());

-- 8. 交通
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-trans-001', '交通', 8, '#CDDC39', NOW(), NOW());

INSERT INTO tags (id, name, "parentId", sort, color, "createdAt", "updatedAt")
VALUES
  ('tag-trans-001-001', '出租车', 'tag-trans-001', 1, NULL, NOW(), NOW()),
  ('tag-trans-001-002', '火车', 'tag-trans-001', 2, NULL, NOW(), NOW()),
  ('tag-trans-001-003', '公交', 'tag-trans-001', 3, NULL, NOW(), NOW()),
  ('tag-trans-001-004', '地铁', 'tag-trans-001', 4, NULL, NOW(), NOW());

-- 9. 服务
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-service-001', '服务', 9, '#3F51B5', NOW(), NOW());

INSERT INTO tags (id, name, "parentId", sort, color, "createdAt", "updatedAt")
VALUES
  ('tag-service-001-001', '域名', 'tag-service-001', 1, NULL, NOW(), NOW()),
  ('tag-service-001-002', '云服务器', 'tag-service-001', 2, NULL, NOW(), NOW()),
  ('tag-service-001-003', 'VPN', 'tag-service-001', 3, NULL, NOW(), NOW()),
  ('tag-service-001-004', '会员', 'tag-service-001', 4, NULL, NOW(), NOW());

-- 10. 餐饮
INSERT INTO tags (id, name, sort, color, "createdAt", "updatedAt")
VALUES ('tag-food-001', '餐饮', 10, '#E91E63', NOW(), NOW());

-- ============ 验证导入 ============
SELECT COUNT(*) as "分类总数" FROM categories WHERE "deletedAt" IS NULL;
SELECT COUNT(*) as "标签总数" FROM tags WHERE "deletedAt" IS NULL;
