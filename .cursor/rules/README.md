# Cursor Rules 说明

本目录包含了项目的 Cursor Rules，用于指导 AI 助手更好地理解和开发 Chrome 扩展项目。

## 规则文件列表

### 1. chrome-extension-dev.mdc
**类型**: 始终应用（alwaysApply: true）  
**描述**: Chrome扩展开发规范和架构模式

**涵盖内容**：
- 项目结构说明
- Manifest 配置要点
- Content Script 限制
- IndexedDB 数据操作基础
- 配置管理模式
- 消息通信基础
- 添加新功能的完整流程
- 调试技巧
- 代码质量要求

**使用场景**：所有开发工作都会自动应用这个规则

### 2. testing-pattern.mdc
**类型**: 按需调用（alwaysApply: false）  
**描述**: Chrome扩展测试套路和最佳实践 - 添加新功能时必须遵循的测试模式

**涵盖内容**：
- 三层测试架构（单元、集成、E2E）
- 测试文件组织
- 测试模板和示例
- Chrome扩展特有的测试限制
- IndexedDB 测试
- Jest 配置
- 测试数据管理
- E2E 测试最佳实践

**使用场景**：添加新功能、编写测试时调用

**调用方式**：
```
请按照 testing-pattern 规则为新功能编写测试
```

### 3. messaging-patterns.mdc
**类型**: 按文件自动应用（globs: background.js,content.js,tracker.js,options.js,history.js）  
**描述**: Chrome扩展消息通信模式和最佳实践

**涵盖内容**：
- 消息通信架构
- 标准消息格式（请求/响应）
- Content Script ↔ Background 通信
- Background ↔ Content Script 通信
- 扩展页面之间的通信
- 异步响应处理
- 错误处理
- 调试技巧
- 性能优化
- 常见问题解决

**使用场景**：编辑涉及消息通信的文件时自动应用

### 4. indexeddb-patterns.mdc
**类型**: 按文件自动应用（globs: db.js,**/db.*.js）  
**描述**: IndexedDB操作模式和最佳实践

**涵盖内容**：
- 数据库初始化
- CRUD 操作（增删改查）
- 索引使用
- 游标查询
- 范围查询
- 批量操作和事务
- 统计和聚合
- 性能优化
- 错误处理
- 数据库版本升级
- 测试方法

**使用场景**：编辑数据库相关文件时自动应用

### 5. git-commit-convention.mdc
**类型**: 按需调用（alwaysApply: false）  
**描述**: Git提交规范和发布流程

**涵盖内容**：
- 提交信息格式（Conventional Commits）
- Type 和 Scope 规范
- 分支管理策略
- 提交流程
- 发布流程
- 版本号规则（Semantic Versioning）
- 回退操作
- 团队协作（Pull Request）
- 紧急修复流程
- 有用的 Git 命令

**使用场景**：准备提交代码、发布版本时调用

**调用方式**：
```
请按照 git-commit-convention 规则生成提交信息
我要发布新版本，请按照规范指导流程
```

### 6. documentation-standards.mdc
**类型**: 按文件自动应用（globs: *.md,docs/**）  
**描述**: 文档编写规范和维护指南

**涵盖内容**：
- 文档类型（README、CHANGELOG、API文档等）
- Markdown 格式规范
- 代码示例编写
- 链接引用方式
- 表格和图标使用
- 文档维护策略
- 特殊文档（问题跟踪、会话总结等）
- 文档模板
- 最佳实践

**使用场景**：编辑 Markdown 文件或 docs 目录时自动应用

### 7. ui-development.mdc
**类型**: 按文件自动应用（globs: *.html,options.js,history.js）  
**描述**: 扩展UI开发规范和最佳实践

**涵盖内容**：
- HTML 页面结构
- CSS 样式规范（BEM命名、变量、响应式）
- 深色模式支持
- JavaScript UI 操作
- DOM 操作优化
- 表单处理和验证
- 加载状态和通知
- 列表和表格渲染
- 搜索和过滤
- 分页
- 性能优化（虚拟滚动、懒加载）
- 可访问性（A11y）
- UI 测试

**使用场景**：编辑 HTML 和 UI 相关的 JS 文件时自动应用

### 8. performance-optimization.mdc
**类型**: 按需调用（alwaysApply: false）  
**描述**: Chrome扩展性能优化指南

**涵盖内容**：
- 核心优化原则
- Background Script 优化（生命周期、缓存、批量操作）
- Content Script 优化（防抖节流、事件委托、DOM优化）
- IndexedDB 优化（索引、限制查询、事务）
- 内存管理（避免泄漏、清理资源、LRU缓存）
- 网络请求优化（请求合并、去重）
- 性能监控和测量
- 性能测试
- 常见性能问题解决

**使用场景**：性能优化、代码审查时调用

**调用方式**：
```
请按照 performance-optimization 规则优化这段代码
帮我分析性能瓶颈
```

## 规则使用指南

### 自动应用的规则

以下规则会在相应场景自动应用，无需手动调用：

1. **chrome-extension-dev.mdc** - 所有时候
2. **messaging-patterns.mdc** - 编辑 background.js、content.js、tracker.js、options.js、history.js 时
3. **indexeddb-patterns.mdc** - 编辑 db.js 或其他数据库文件时
4. **documentation-standards.mdc** - 编辑 .md 文件或 docs 目录时
5. **ui-development.mdc** - 编辑 .html、options.js、history.js 时

### 需要手动调用的规则

以下规则需要在对话中明确提及才会应用：

1. **testing-pattern** - 编写测试时
   ```
   请按照 testing-pattern 规则为这个功能编写完整测试
   ```

2. **git-commit-convention** - 提交代码或发布版本时
   ```
   请按照 git-commit-convention 规则生成提交信息
   ```

3. **performance-optimization** - 性能优化时
   ```
   请按照 performance-optimization 规则优化这段代码
   ```

## 规则维护

### 何时更新规则

- ✅ 发现新的最佳实践
- ✅ 项目架构发生变化
- ✅ 添加新的开发流程
- ✅ 发现规则中的错误或过时内容
- ✅ 团队达成新的编码规范

### 如何更新规则

1. 编辑对应的 .mdc 文件
2. 更新 frontmatter 中的描述（如果需要）
3. 确保引用的文件路径正确
4. 更新本 README.md 说明
5. 提交变更

### 添加新规则

1. 在 `.cursor/rules/` 目录创建新的 .mdc 文件
2. 添加合适的 frontmatter：
   ```markdown
   ---
   description: 规则描述
   alwaysApply: true/false
   globs: *.ext  # 可选
   ---
   ```
3. 编写规则内容
4. 在本 README.md 中添加说明
5. 提交变更

## 规则最佳实践

### 编写规则时

1. **使用清晰的标题和结构**
   - 使用 # 一级标题作为规则名称
   - 使用 ## 二级标题组织内容
   - 使用 ### 三级标题细分主题

2. **提供完整的代码示例**
   - ✅ 推荐做法
   - ❌ 不推荐做法
   - 使用 ```javascript 语法高亮

3. **引用项目文件**
   - 使用 `[filename](mdc:path/to/file)` 格式
   - 路径相对于项目根目录

4. **保持规则聚焦**
   - 每个规则专注一个主题
   - 避免规则之间重复
   - 适当交叉引用其他规则

5. **提供实用信息**
   - 最佳实践
   - 常见问题
   - 调试技巧
   - 性能建议

### 使用规则时

1. **明确调用规则**
   - 对于手动规则，在对话中明确提及
   - 例如："请按照 testing-pattern 规则..."

2. **提供上下文**
   - 说明你在做什么
   - 提供相关代码
   - 说明遇到的问题

3. **验证结果**
   - 检查生成的代码是否符合规则
   - 运行测试验证
   - 审查提交前的变更

## 规则优先级

当多个规则冲突时，按以下优先级：

1. **项目特定规则** > 通用规则
2. **明确的规则** > 推断的规则
3. **最近的规则** > 旧的规则
4. **专门的规则** > 通用规则

例如：
- `testing-pattern.mdc` 中的测试规范 > 通用的 JavaScript 测试规范
- 用户明确要求 > 自动应用的规则

## 贡献指南

欢迎改进规则！请遵循以下步骤：

1. 识别需要改进的地方
2. 编辑对应的 .mdc 文件
3. 更新本 README.md（如果需要）
4. 测试规则是否正常工作
5. 提交 Pull Request（如果是团队项目）

## 相关资源

- [Cursor Rules 文档](https://docs.cursor.com/context/rules)
- [Markdown Guide](https://www.markdownguide.org/)
- [Chrome Extension 文档](https://developer.chrome.com/docs/extensions/)
- [Jest 文档](https://jestjs.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 更新日志

### 2024-10-23
- ✅ 创建 chrome-extension-dev.mdc（已存在）
- ✅ 创建 testing-pattern.mdc（已存在）
- ✅ 创建 messaging-patterns.mdc
- ✅ 创建 indexeddb-patterns.mdc
- ✅ 创建 git-commit-convention.mdc
- ✅ 创建 documentation-standards.mdc
- ✅ 创建 ui-development.mdc
- ✅ 创建 performance-optimization.mdc
- ✅ 创建 README.md（本文件）

---

**注意**：本项目的规则会随着项目发展持续更新。请定期查看本文档以了解最新的规则和最佳实践。


