# Chrome扩展测试完整指南

## 📋 概述

本项目采用完整的三层测试架构（单元测试、集成测试、E2E测试），确保扩展功能的质量和稳定性。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试（快速，推荐开发时使用）
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行E2E测试（较慢，会打开浏览器）
npm run test:e2e

# 运行E2E测试（后台模式，不显示浏览器）
npm run test:e2e:headless

# 监听模式（开发时实时测试）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI/CD完整测试
npm run test:ci:all
```

## 📊 测试命令对比

| 命令 | 模式 | 用途 | 速度 | 场景 |
|------|------|------|------|------|
| `npm run test:unit` | - | 单元测试 | ⚡ 快 | 开发验证 |
| `npm run test:integration` | - | 集成测试 | ⚡ 快 | 模块交互 |
| `npm run test:e2e` | 前台 | E2E测试 | 🐢 慢 | 开发调试 |
| `npm run test:e2e:headless` | 后台 | E2E测试 | 🐢 较快 | 快速验证 |
| `npm run test:ci:all` | 后台 | 完整测试 | 🐢 慢 | CI流水线 |

## 🧪 测试类型

### 单元测试 (Unit Tests)

测试独立的函数和模块，不依赖外部环境。

**覆盖范围**：
- ✅ 数据库操作（增删改查）
- ✅ 时间格式化函数
- ✅ 日期分组逻辑
- ✅ 搜索过滤功能
- ✅ 时长格式化
- ✅ UI逻辑函数

**测试文件**：
- `tests/unit/db.test.js` - 数据库操作
- `tests/unit/utils.test.js` - 工具函数
- `tests/unit/duration.test.js` - 时长功能
- `tests/unit/history-ui.test.js` - UI逻辑

**运行**：
```bash
npm run test:unit
```

### 集成测试 (Integration Tests)

测试多个模块之间的交互。

**覆盖范围**：
- ✅ Chrome Storage API交互
- ✅ 消息通信机制
- ✅ 数据持久化
- ✅ 模块协调

**测试文件**：
- `tests/integration/messaging.test.js` - 消息通信
- `tests/integration/storage.test.js` - 存储功能
- `tests/integration/duration.test.js` - 时长集成
- `tests/integration/history-ui.test.js` - UI集成

**运行**：
```bash
npm run test:integration
```

### E2E测试 (End-to-End Tests)

在真实浏览器环境中测试完整的用户流程。

**覆盖范围**：
- ✅ 设置页面交互
- ✅ 历史记录页面功能
- ✅ 扩展功能启用/禁用
- ✅ 页面追踪功能
- ✅ 浏览时长记录
- ✅ UI优化功能

**测试文件**：
- `tests/e2e/options.test.js` - 设置页面
- `tests/e2e/history.test.js` - 历史记录页面
- `tests/e2e/tracking.test.js` - 追踪功能
- `tests/e2e/duration.test.js` - 时长功能
- `tests/e2e/summary.test.js` - 摘要功能

**运行**：
```bash
# 前台模式（可以看到浏览器）
npm run test:e2e

# 后台模式（推荐）
npm run test:e2e:headless
```

## 🎯 Headless模式详解

### 什么是Headless模式？

Chrome 96+ 引入的**新headless模式**（`headless: 'new'`），支持：
- ✅ **完整支持扩展** - 可以正常加载和运行Chrome扩展
- ✅ **真实环境** - 行为与普通Chrome一致
- ✅ **后台运行** - 不显示窗口，不干扰其他工作
- ✅ **速度更快** - 减少GPU渲染开销

### 使用方法

```bash
# 后台运行，不显示浏览器窗口
npm run test:e2e:headless

# 或使用环境变量
HEADLESS=true npm run test:e2e

# 指定测试文件
HEADLESS=true npm run test:e2e -- tests/e2e/history.test.js

# 结合调试日志
DEBUG=true HEADLESS=true npm run test:e2e
```

### 适用场景

**后台模式（headless）**：
- ⚡ 快速验证
- 🔁 CI/CD流水线
- 🖥️ 远程服务器
- 🎯 批量测试

**前台模式（默认）**：
- 🐛 调试测试失败
- 👀 观察UI交互
- 📝 编写新测试

### 环境变量

**HEADLESS**：
```bash
# 前台模式（默认）
HEADLESS=false npm run test:e2e

# 新headless模式（推荐）
HEADLESS=true npm run test:e2e
```

**DEBUG**：
```bash
# 开启调试日志
DEBUG=true npm run test:e2e

# 组合使用
DEBUG=true HEADLESS=true npm run test:e2e
```

## 📖 手动测试指南

### 安装和加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `smart-search-extension` 文件夹

### 测试浏览记录功能

#### 1. 启用功能
- 点击扩展图标，进入设置页面
- 勾选"启用浏览记录功能（停留5秒自动记录网页内容）"
- 点击"保存"按钮
- ✅ 应该看到"选项已保存"的提示

#### 2. 自动记录功能
- 打开任意网页（如：https://www.baidu.com）
- 保持页面可见，等待至少5秒
- 打开浏览器控制台（F12）
- ✅ 应该看到类似"[页面追踪] 页面停留超过5秒，开始记录"的日志

#### 3. 查看历史记录
- 访问多个不同的网页（每个停留5秒以上）
- 回到扩展设置页面
- 点击"📖 查看浏览历史记录"链接
- ✅ 应该看到所有访问过的页面列表

#### 4. 搜索功能
- 在历史记录页面的搜索框输入关键词
- ✅ 记录列表应该实时筛选

#### 5. 删除功能
- 点击任意记录的"删除"按钮
- 确认删除对话框
- ✅ 该记录应该从列表中消失

#### 6. 导出数据
- 在历史记录页面点击"导出数据"按钮
- ✅ 应该下载一个JSON文件

### 验证数据存储

1. 打开Chrome DevTools（F12）
2. 切换到"Application"标签
3. 展开"IndexedDB"
4. 找到"PageHistoryDB"数据库
5. 展开"pageHistory"对象存储
6. ✅ 应该看到所有保存的记录

## 🛠️ 测试工具和Mock

### Chrome API Mock

```javascript
const { setupChromeMock, resetChromeMock } = require('./tests/helpers/chrome-mock');

beforeEach(() => {
  setupChromeMock();
});

afterEach(() => {
  resetChromeMock();
});
```

支持的API：
- `chrome.storage.sync`
- `chrome.storage.local`
- `chrome.runtime.sendMessage`
- `chrome.tabs`

### 测试数据生成器

```javascript
const { 
  createMockHistoryRecord,
  createMockHistoryRecords,
  createMockSettings
} = require('./tests/helpers/fixtures');

// 生成单条记录
const record = createMockHistoryRecord();

// 生成多条记录
const records = createMockHistoryRecords(5);
```

## 📊 测试统计

### 总览
- **总测试用例**：80+
- **单元测试**：39个
- **集成测试**：30个
- **E2E测试**：25个

### 覆盖率目标
- **单元测试**：>80% 代码覆盖率
- **集成测试**：100% 关键流程覆盖
- **E2E测试**：100% 主要用户场景覆盖

查看覆盖率报告：
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 🔧 CI/CD集成

### GitHub Actions

项目配置了GitHub Actions自动测试：

- **触发条件**：push到master/main/develop分支，或创建PR
- **测试环境**：Ubuntu Latest
- **Node版本**：18.x, 20.x
- **自动运行**：所有测试
- **生成报告**：覆盖率报告

### 运行CI测试

```bash
# 本地模拟CI环境
npm run test:ci:all
```

## 💡 最佳实践

### 开发阶段

```bash
# 1. 编写测试时 - 前台模式，便于观察
npm run test:e2e -- tests/e2e/new-feature.test.js

# 2. 调试失败 - 前台+调试日志
DEBUG=true npm run test:e2e -- --testNamePattern="失败的测试"

# 3. 快速验证 - 后台模式
HEADLESS=true npm run test:e2e
```

### 提交前检查

```bash
# 1. 运行所有测试
npm test

# 2. 检查覆盖率
npm run test:coverage

# 3. 确认所有测试通过
# 4. 提交代码
```

### 测试编写原则

1. **保持测试独立**：每个测试应该能独立运行
2. **使用有意义的测试名称**：描述测试的行为和期望
3. **遵循AAA模式**：Arrange（准备）、Act（执行）、Assert（断言）
4. **清理测试数据**：在afterEach中清理
5. **避免测试内部实现**：测试行为而非实现细节

### 示例

#### 单元测试示例

```javascript
describe('formatDuration', () => {
  test('should format seconds', () => {
    expect(formatDuration(30)).toBe('30秒');
  });
  
  test('should format minutes', () => {
    expect(formatDuration(150)).toBe('2分30秒');
  });
});
```

#### 集成测试示例

```javascript
describe('Storage Integration', () => {
  beforeEach(() => setupChromeMock());
  afterEach(() => resetChromeMock());
  
  test('should save and retrieve settings', async () => {
    await chrome.storage.sync.set({ key: 'value' });
    const result = await chrome.storage.sync.get('key');
    expect(result.key).toBe('value');
  });
});
```

#### E2E测试示例

```javascript
describe('History Page', () => {
  let browser, page;
  
  beforeAll(async () => {
    browser = await launchBrowserWithExtension();
    page = await browser.newPage();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('should display history records', async () => {
    await page.goto(historyPageUrl);
    const records = await page.$$('.history-record');
    expect(records.length).toBeGreaterThan(0);
  });
});
```

## ❓ 常见问题

### Q: E2E测试失败，提示无法启动Chrome？
**A**: 确保：
1. Chrome浏览器已安装
2. Puppeteer正确安装（`npm install puppeteer`）
3. 使用headless模式：`HEADLESS=true npm run test:e2e`

### Q: headless模式下扩展功能异常？
**A**: 确保使用新headless模式：
```bash
HEADLESS=true npm run test:e2e  # ✅ 正确
HEADLESS=old npm run test:e2e   # ❌ 错误，不支持扩展
```

### Q: Linux服务器报错"cannot open display"？
**A**: 使用headless模式：
```bash
HEADLESS=true npm run test:e2e
```

### Q: IndexedDB Mock问题？
**A**: 
- 确保安装了`fake-indexeddb`
- 在测试前清空数据库
- 检查异步操作是否正确处理

### Q: 如何查看headless模式下的截图？
**A**: 在测试中添加截图：
```javascript
await page.screenshot({ path: 'test-screenshot.png' });
```

## 📚 相关资源

- [Jest文档](https://jestjs.io/)
- [Puppeteer文档](https://pptr.dev/)
- [Chrome Extension测试指南](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
- [功能使用指南](../smart-search-extension/FEATURE_USAGE.md)

## 🎯 总结

本项目采用完整的三层测试架构，确保扩展功能的质量和稳定性：

```
    E2E (25)         ← 真实环境，慢
      ↑
 集成测试 (30)      ← Chrome API交互
      ↑
 单元测试 (39)      ← 纯逻辑，快
```

**推荐配置**：
- 开发调试：`npm run test:e2e`
- 快速测试：`npm run test:e2e:headless` ⭐
- CI/CD：`npm run test:ci:all` ⭐

使用新headless模式，可以在后台快速运行完整的E2E测试，同时保证扩展功能正常工作！🎉

