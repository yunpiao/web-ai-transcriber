# Project Context

## 1. Overview

- **摘要**：Chrome 扩展，通过右键菜单/图标将网页文本发送到 AI 服务（Gemini/Qwen/DeepSeek/AIStudio）自动转写优化，附带浏览历史追踪
- **领域**：Browser Extension / Frontend
- **核心价值**：多 AI 引擎自动填充、页面停留时长追踪、浏览历史管理与总结

## 2. Tech Stack (Auto-Detected)

- **Language/Runtime**：JavaScript (ES2020+, 原生无编译)
- **Frameworks**：Chrome Manifest V3 (无 UI 框架)
- **Data/State**：IndexedDB (via db.js) + chrome.storage.local/sync
- **Infra/Tooling**：Jest 29 + jsdom + Puppeteer 24 + GitHub Actions CI/CD
- **Package Manager**：npm (package.json v4.7.0, manifest v4.8)

## 3. Structure (ASCII Tree)

```
📂 smart-search-extension/    # 扩展源码（直接加载到 Chrome）
├── manifest.json             # MV3 配置，权限声明
├── background.js             # Service Worker：右键菜单、消息路由、动态注入 content.js
├── content.js                # AI 页面自动填充：DOM 轮询 + 输入框填充 + 提交
├── tracker.js                # 浏览追踪：停留时长计时、页面内容提取（manifest 自动注入）
├── db.js                     # IndexedDB 封装（ES Module，被 history.js import）
├── options.html/js           # 设置页：引擎选择、提示词模板、功能开关
├── history.html/js           # 历史记录页：日历筛选、搜索、导出、AI 总结
└── icons/                    # 扩展图标 (16~256px)
📂 tests/
├── setup.js                  # Jest 全局 setup
├── helpers/                  # chrome-mock.js + fixtures.js
├── unit/                     # 6 个单元测试
├── integration/              # 5 个集成测试
└── e2e/                      # 7 个 Puppeteer E2E 测试
📂 issues/                    # 待实现功能需求（3个）
📂 docs/                      # 文档（测试指南、结构说明）
📂 .github/workflows/         # CI：test.yml + release.yml
```

## 4. Development Guidelines

- **Idioms**：原生 JS，无框架。`db.js`/`history.js` 使用 ES Module (`import/export`)，其余为传统脚本
- **Naming**：camelCase 变量/函数，PascalCase 类名，UPPER_SNAKE 常量。UI 文案和注释中文，代码标识符英文
- **Structure**：`background.js` 和 `options.js` 使用 Class 模式（SRP 分离），`db.js`/`history.js` 函数式导出

## 5. Core Architecture

- **Flow**：
  ```
  右键菜单/图标点击 → background.js 获取页面文本
    → 存入 chrome.storage.local → 打开 AI 页面
    → chrome.scripting.executeScript 动态注入 content.js
    → content.js 轮询 DOM 就绪 → 自动填充输入框 → 提交

  tracker.js（manifest 自动注入所有页面）
    → 1s 计时器 + 30s 保存 → visibilitychange 暂停/恢复
    → 消息发送到 background.js → IndexedDB 持久化
  ```
- **Key Logic**：
  - `ENGINE_CONFIG` (content.js): 各 AI 引擎的 DOM 选择器映射，轮询 100ms × 50 次 = 5s 超时
  - `SEARCH_ENGINES` (background.js): AI 引擎 URL 注册表
  - `IndexedDBManager` (background.js): 独立的 IndexedDB 类（与 db.js 存在重复）
  - `DEFAULT_PROMPT` (background.js): 单一数据源的中文提示词模板

## 6. Critical Context

- **Environment**：无 .env，配置通过 `chrome.storage.sync` 持久化（引擎选择、提示词、功能开关）
- **Setup/Run**：
  ```bash
  # 开发：Chrome → chrome://extensions → 加载已解压扩展 → 选择 smart-search-extension/
  # 测试
  npm test              # unit + integration
  npm run test:e2e      # Puppeteer E2E（需要 Chrome）
  npm run test:all      # 全部测试
  npm run test:coverage # 覆盖率
  ```
- **CI/CD**：push master → test.yml 跑测试 → release.yml 打包 zip 发布 GitHub Release（版本号从 manifest.json 提取）

## 7. AI Behavior Rules

### 7.1 Must Do

- [ ] 修改后运行 `npm test` 确保 unit + integration 通过
- [ ] 新增 AI 引擎时同步更新 `SEARCH_ENGINES` (background.js) 和 `ENGINE_CONFIG` (content.js)
- [ ] content.js 的 DOM 选择器变更必须附带 E2E 测试验证
- [ ] 遵循现有的 Class 模式（background.js/options.js）或函数式模式（db.js/history.js）
- [ ] manifest.json 版本变更时同步 package.json

### 7.2 Must NOT Do

- [ ] 不要引入构建工具（Webpack/Vite 等），项目设计为零构建直接加载
- [ ] 不要在 content.js 中硬编码 AI 页面 URL，统一在 `ENGINE_CONFIG` 常量中管理
- [ ] 不要在 tracker.js 中发起网络请求，所有数据通过消息传递给 background.js
- [ ] 不要删除或弱化测试来让 CI 通过
- [ ] 不要在 background.js 之外直接操作 IndexedDB（除 db.js ES Module 导出的函数）

### 7.3 Prefer

- [ ] 优先使用 `chrome.storage.local` 传递临时数据（content.js 填充文本），`chrome.storage.sync` 存储用户设置
- [ ] 优先扩展 `ENGINE_CONFIG` 常量而非写 if-else 分支来支持新 AI 引擎
- [ ] 优先 Puppeteer E2E 测试验证扩展行为，单元测试覆盖纯逻辑函数
- [ ] 优先小步提交，每个 commit 对应一个功能点或修复

## 8. Code Examples

| 场景 | 范本文件 | 说明 |
|------|----------|------|
| Class 模式 | `smart-search-extension/options.js` | 4 个类 SRP 分离：UI/FormData/Settings/Controller |
| 常量驱动配置 | `smart-search-extension/content.js` | ENGINE_CONFIG + TIMING 常量，数据驱动而非硬编码 |
| IndexedDB 封装 | `smart-search-extension/db.js` | ES Module 函数式导出，initDB/saveHistory/getAllHistory |
| E2E 测试 | `tests/e2e/options.test.js` | Puppeteer 启动扩展 + 页面交互验证 |
| Chrome Mock | `tests/helpers/chrome-mock.js` | 测试环境 Chrome API 模拟 |

## 9. Quality Gates

```bash
# 提交前检查清单
[ ] test:       npm test                    # unit + integration
[ ] e2e:        npm run test:e2e            # Puppeteer E2E（本地需 Chrome）
[ ] coverage:   npm run test:coverage       # 覆盖率报告
[ ] manifest:   检查 manifest.json 版本号   # CI release 依赖此版本
```

## 10. Common Pitfalls

| 坑 | 说明 | 正确做法 |
|----|------|----------|
| content.js 非静态注入 | manifest 中 content_scripts 只有 tracker.js，content.js 是 background.js 动态注入的 | 修改 content.js 注入逻辑在 background.js 的 `chrome.scripting.executeScript` |
| db.js 双重实现 | background.js 有独立的 `IndexedDBManager` 类，db.js 有函数式导出，两套并存 | 新代码优先用 db.js 的导出函数；background.js 因 Service Worker 限制使用自己的类 |
| ES Module 测试限制 | db.js 是 ES Module，Jest/jsdom 环境无法直接 import，单元测试复制了函数实现 | 接受现状或用 jest-environment-jsdom + transform 配置 |
| DOM 选择器频繁失效 | AI 网站（Gemini/Qwen/DeepSeek）经常改版导致选择器失效 | 更新 ENGINE_CONFIG 对应引擎的选择器，用 E2E 验证 |
| 版本号不同步 | manifest.json (4.8) vs package.json (4.7.0) | 发版时两处同步更新 |
| 根目录文档堆积 | 13 个 `*_SUMMARY.md` / `*_FIX.md` 历史文档 | 定期清理或移入 docs/ |

## 11. Task Decomposition Guide

### 新增 AI 引擎支持

1. `background.js`: 在 `SEARCH_ENGINES` 添加引擎 URL
2. `content.js`: 在 `ENGINE_CONFIG` 添加 DOM 选择器（input/submit/可选按钮）
3. `options.html`: 在引擎选择下拉框添加选项
4. `tests/e2e/content-script.test.js`: 添加新引擎的填充测试
5. 更新 manifest.json 版本号 + package.json 版本号

### 修改页面追踪逻辑

1. `tracker.js`: 修改计时/保存逻辑
2. `background.js`: 如涉及消息格式变更，同步修改 `onMessage` handler
3. `tests/unit/duration.test.js` + `tests/e2e/tracking.test.js`: 更新测试
4. `tests/e2e/duration.test.js`: E2E 验证

### 历史记录页功能变更

1. `smart-search-extension/db.js`: 如涉及数据结构变更，更新 schema + 版本号
2. `smart-search-extension/history.js`: 修改 UI 逻辑
3. `smart-search-extension/history.html`: 如需新 UI 元素
4. `tests/unit/history-ui.test.js` + `tests/e2e/history.test.js`: 更新测试

## ⚠️ 人工备注 (Manual Notes)

- _(开发者可在此处手动添加 AI 无法通过代码分析得出的业务背景或长期记忆，AI 请勿覆盖此区域内容)_
