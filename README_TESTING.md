# 自动化测试文档

## 概述

本项目使用 Jest + Puppeteer 实现了完整的自动化测试体系，包括单元测试、集成测试和端到端(E2E)测试。

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行E2E测试
npm run test:e2e

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 测试结构

```
tests/
├── unit/                    # 单元测试
│   ├── db.test.js          # 数据库操作测试
│   └── utils.test.js       # 工具函数测试
├── integration/             # 集成测试
│   ├── messaging.test.js   # 消息通信测试
│   └── storage.test.js     # 存储测试
├── e2e/                     # 端到端测试
│   ├── setup.js            # E2E测试配置
│   ├── options.test.js     # 设置页面测试
│   └── history.test.js     # 历史页面测试
├── helpers/                 # 测试辅助工具
│   ├── chrome-mock.js      # Chrome API模拟
│   └── fixtures.js         # 测试数据生成器
└── fixtures/                # 测试固件
    └── test-page.html      # 测试用HTML页面
```

## 测试类型

### 单元测试

测试独立的函数和模块，不依赖外部环境。

**覆盖范围：**
- 数据库操作（增删改查）
- 时间格式化函数
- 日期分组逻辑
- 搜索过滤功能

**运行：**
```bash
npm run test:unit
```

### 集成测试

测试多个模块之间的交互。

**覆盖范围：**
- Chrome Storage API 交互
- 消息通信机制
- 数据持久化

**运行：**
```bash
npm run test:integration
```

### E2E测试

在真实浏览器环境中测试完整的用户流程。

**覆盖范围：**
- 设置页面交互
- 历史记录页面功能
- 扩展功能启用/禁用

**运行：**
```bash
npm run test:e2e
```

**注意：** E2E测试需要启动真实浏览器（非headless模式），因此会打开Chrome窗口。

## Mock工具

### Chrome API Mock

项目提供了完整的Chrome API模拟：

```javascript
const { setupChromeMock, resetChromeMock } = require('./tests/helpers/chrome-mock');

beforeEach(() => {
  setupChromeMock(); // 设置mock
});

afterEach(() => {
  resetChromeMock(); // 重置mock
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

// 生成配置数据
const settings = createMockSettings({ enablePageTracking: true });
```

## 覆盖率目标

- **单元测试**：>80% 代码覆盖率
- **集成测试**：100% 关键流程覆盖
- **E2E测试**：100% 主要用户场景覆盖

查看覆盖率报告：
```bash
npm run test:coverage
# 报告生成在 coverage/ 目录
# 打开 coverage/lcov-report/index.html 查看详细报告
```

## CI/CD集成

项目配置了GitHub Actions自动测试：

- 触发条件：push 到 master/main/develop 分支，或创建 PR
- 测试环境：Ubuntu Latest
- Node版本：18.x, 20.x
- 自动运行所有测试
- 生成并上传覆盖率报告

配置文件：`.github/workflows/test.yml`

## 常见问题

### E2E测试失败

**问题：** E2E测试无法启动浏览器

**解决：** 
- 确保安装了Chrome浏览器
- 检查Puppeteer是否正确安装
- 在CI环境中使用xvfb

### IndexedDB Mock问题

**问题：** 数据库测试失败

**解决：**
- 确保安装了`fake-indexeddb`
- 在测试前清空数据库
- 检查异步操作是否正确处理

### Chrome API Mock问题

**问题：** Chrome API调用失败

**解决：**
- 在每个测试前调用`setupChromeMock()`
- 在每个测试后调用`resetChromeMock()`
- 确保使用正确的API

## 编写新测试

### 单元测试示例

```javascript
// tests/unit/my-function.test.js
describe('My Function', () => {
  test('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### 集成测试示例

```javascript
// tests/integration/my-integration.test.js
const { setupChromeMock, resetChromeMock } = require('../helpers/chrome-mock');

describe('My Integration', () => {
  beforeEach(() => setupChromeMock());
  afterEach(() => resetChromeMock());
  
  test('should integrate correctly', async () => {
    await chrome.storage.sync.set({ key: 'value' });
    const result = await chrome.storage.sync.get('key');
    expect(result.key).toBe('value');
  });
});
```

### E2E测试示例

```javascript
// tests/e2e/my-e2e.test.js
const { launchBrowserWithExtension, getExtensionId } = require('./setup');

describe('My E2E Test', () => {
  let browser;
  let extensionId;
  
  beforeAll(async () => {
    browser = await launchBrowserWithExtension();
    extensionId = await getExtensionId(browser);
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('should work in browser', async () => {
    // 测试逻辑
  });
});
```

## 最佳实践

1. **保持测试独立**：每个测试应该能独立运行
2. **使用有意义的测试名称**：描述测试的行为和期望
3. **遵循AAA模式**：Arrange（准备）、Act（执行）、Assert（断言）
4. **清理测试数据**：在afterEach中清理
5. **避免测试内部实现**：测试行为而非实现细节

## 资源

- [Jest文档](https://jestjs.io/)
- [Puppeteer文档](https://pptr.dev/)
- [Chrome Extension测试指南](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)

## 贡献

欢迎提交测试用例！请确保：
1. 所有测试通过
2. 保持或提高代码覆盖率
3. 遵循项目的测试规范

