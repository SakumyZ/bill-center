/**
 * 树形结构工具函数
 * 用于分类和标签的树形数据处理
 */

export interface TreeNode {
  id: string
  parentId: string | null
  children?: TreeNode[]
  [key: string]: unknown
}

/**
 * 将扁平数据构建为树形结构
 */
export function buildTree<T extends TreeNode>(items: T[]): T[] {
  const map = new Map<string, T & { children: T[] }>()
  const roots: (T & { children: T[] })[] = []

  // 创建映射
  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }

  // 构建树
  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

/**
 * 获取节点的所有子孙节点ID（含自身）
 */
export function getAllDescendantIds<T extends TreeNode>(items: T[], parentId: string): string[] {
  const ids: string[] = [parentId]
  const queue = [parentId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    for (const item of items) {
      if (item.parentId === currentId) {
        ids.push(item.id)
        queue.push(item.id)
      }
    }
  }

  return ids
}
