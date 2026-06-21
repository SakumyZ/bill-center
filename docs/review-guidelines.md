# AI Code Review 核心观点与准则

## 1. 架构与状态管理
- **合理使用 Server Components**：禁止在页面顶层（如 `page.tsx`）无脑滥用 `'use client'`。应优先将数据获取逻辑保留在服务端的 Server Components 中，仅将需要复杂交互的部分抽离为 Client Components，以保障 SSR 性能与安全性。
- **拥抱现代数据请求方案**：弃用手写的 `useEffect` + `useState` 来维护请求的 `loading/data/error` 状态。统一使用 `swr` 接管数据流，利用其内置的缓存、重试和重新验证机制减少样板代码。
- **API 模块化**：严禁将所有接口请求堆砌在单一的 `api-client.ts` 中。必须按业务领域（如 `bills.ts`, `categories.ts`, `dashboard.ts`）拆分 API 客户端模块。

## 2. 组件拆分与复用
- **消除巨石组件 (Monolithic Components)**：当页面代码过于庞大且职责繁杂时（如 Dashboard 面板或多步骤的 Upload 页面），必须按职责边界将其拆分为独立子组件。
- **高度同构逻辑抽象**：对于高度同构的管理页面（如“分类管理”与“标签管理”的树形 CRUD），必须抽象为通用的底层组件（如 `ManagementTree`），通过 Props 注入差异化的配置，坚决杜绝整页复制粘贴。
- **通用 UI 与逻辑下沉**：
  - 具有复用价值的 UI（如 `IconPicker`, `CurrencyInput`）必须移动到 `src/components/` 目录下。
  - 多处用到的全局字典数据（如分类、标签），必须抽象为自定义 Hook（如 `useMetadata()`）配合 `swr` 全局缓存，避免多次发请求。

## 3. 编码习惯与代码规范
- **逻辑与视图分离**：禁止将复杂的业务逻辑直接写在 React 组件内。复杂逻辑必须下沉到 `services/` 或 `lib/` 目录中，组件仅负责调用和状态渲染。
- **样式规范 (Tailwind 优先)**：全面优先使用 Tailwind CSS v4 进行布局与样式编写，尽量避免滥用内联 `style={{ ... }}`（除非是为了对抗 Ant Design 组件极高优先级的特定样式）。
- **类型安全保障**：拒绝在接口返回处理处使用泛滥的强制类型断言（如 `as Record<string, unknown>[]`）。要求结合项目中已配置的 `zod`，在接口层进行 Schema 校验和严格的类型推导。
- **全局错误捕获**：禁止在每个请求的 catch 块中仅做简单的兜底。要求在基于 `fetch` 的统一请求封装（如 `request.ts`）中实施全局统一的错误拦截与提示处理。
- **代码整洁度与无用代码清理**：提交代码前必须在本地运行 `npm run lint` 审查是否存在未使用的导入（imports）、未被调用的变量/函数/类型定义，或者因重构而遗留的废弃代码段。所有无用代码和 Linter 警告必须在当次提交中彻底清除，保持代码库极度纯净。
