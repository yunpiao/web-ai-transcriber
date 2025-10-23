# AI Studio 自动关闭侧边栏功能

## 功能概述

在 Google AI Studio (`aistudio.google.com`) 上，当扩展自动填入文本并发送后，会自动检测并关闭 "Run Settings" 侧边栏面板，提供更好的用户体验。

## 使用场景

当用户使用扩展在 AI Studio 上：
1. 点击扩展图标或右键菜单
2. 自动打开 AI Studio 页面
3. 自动填入选中的文本
4. 自动点击发送按钮
5. **✨ 新增：自动关闭 "Run Settings" 侧边栏**

## 实现细节

### 代码位置

**文件**: `smart-search-extension/content.js`

**位置**: 第172-186行

```javascript
// 如果是 AI Studio，尝试关闭 "Run settings panel"
if (hostname === 'aistudio.google.com') {
  console.log('[智能搜索扩展] 检查是否需要关闭 Run Settings 面板...');
  // 等待一小段时间，让页面稳定
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const closeButton = document.querySelector('button[aria-label="Close run settings panel"]');
  if (closeButton) {
    console.log('[智能搜索扩展] 成功找到 "Close run settings panel" 按钮，正在关闭...');
    closeButton.click();
    console.log('[智能搜索扩展] Run Settings 面板已关闭');
  } else {
    console.log('[智能搜索扩展] 未找到 "Close run settings panel" 按钮（可能已经关闭或页面结构已更新）');
  }
}
```

### 工作流程

1. **检测网站**: 只在 `aistudio.google.com` 上生效
2. **等待页面稳定**: 延迟 500ms 确保页面元素加载完成
3. **查找关闭按钮**: 使用选择器 `button[aria-label="Close run settings panel"]`
4. **点击关闭**: 如果找到按钮，自动点击
5. **日志记录**: 记录详细的执行信息

### 执行时机

在 `content.js` 完成以下操作后执行：
1. ✅ 填入文本到输入框
2. ✅ 点击发送按钮
3. ✅ 等待 markdown 面板出现
4. ✅ 滚动到内容区域
5. ✨ **关闭侧边栏**（新增）
6. ✅ 清理临时数据

## 技术特点

### 1. 选择器稳定性

使用 `aria-label` 属性作为选择器：
```javascript
button[aria-label="Close run settings panel"]
```

**优点**：
- ✅ 语义化，可读性强
- ✅ 更稳定，不受 CSS class 变化影响
- ✅ 遵循无障碍规范

### 2. 防御性编程

```javascript
const closeButton = document.querySelector('...');
if (closeButton) {
  closeButton.click();
} else {
  console.log('未找到按钮');
}
```

**优点**：
- ✅ 不会因为按钮不存在而报错
- ✅ 优雅降级
- ✅ 详细的日志输出

### 3. 网站特定功能

```javascript
if (hostname === 'aistudio.google.com') {
  // 只在 AI Studio 上执行
}
```

**优点**：
- ✅ 不影响其他网站
- ✅ 代码清晰，易于维护
- ✅ 可扩展（未来可添加其他网站的特定功能）

### 4. 延迟执行

```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```

**优点**：
- ✅ 确保页面元素加载完成
- ✅ 避免过早查找导致失败
- ✅ 500ms 延迟不影响用户体验

## 测试覆盖

### 新增测试文件

**文件**: `tests/unit/close-sidebar.test.js`

### 测试用例

✅ **8个测试用例，100%通过**：

1. 应该能够找到并点击关闭按钮
2. 应该只在 aistudio.google.com 上执行关闭操作
3. 不应该在其他网站上执行关闭操作
4. 应该正确处理按钮不存在的情况
5. 应该使用正确的选择器
6. 应该在页面稳定后执行（模拟延迟）
7. 应该记录日志信息
8. 当按钮不存在时应该记录相应日志

### 测试结果

```bash
Test Suites: 6 passed, 6 total
Tests:       106 passed, 106 total
```

## 用户体验

### 优化前

1. 用户使用扩展自动填入文本 ✅
2. AI Studio 自动开始生成回复 ✅
3. **Run Settings 侧边栏遮挡内容** ❌
4. 用户需要手动点击关闭按钮 ❌

### 优化后

1. 用户使用扩展自动填入文本 ✅
2. AI Studio 自动开始生成回复 ✅
3. **侧边栏自动关闭** ✨
4. **内容区域完整显示** ✨
5. 用户体验更流畅 ✅

## 兼容性

### 支持的网站

- ✅ Google AI Studio (`aistudio.google.com`)

### 不受影响的网站

- ✅ Gemini (`gemini.google.com`)
- ✅ Qwen (`chat.qwen.ai`)
- ✅ DeepSeek (`chat.deepseek.com`)

### 浏览器兼容性

- ✅ Chrome
- ✅ Edge
- ✅ 其他基于 Chromium 的浏览器

## 配置选项

**无需配置**，功能自动生效：
- 只在 AI Studio 上生效
- 自动检测并执行
- 无需用户干预

## 日志输出

### 成功执行时

```
[智能搜索扩展] 检查是否需要关闭 Run Settings 面板...
[智能搜索扩展] 成功找到 "Close run settings panel" 按钮，正在关闭...
[智能搜索扩展] Run Settings 面板已关闭
```

### 按钮不存在时

```
[智能搜索扩展] 检查是否需要关闭 Run Settings 面板...
[智能搜索扩展] 未找到 "Close run settings panel" 按钮（可能已经关闭或页面结构已更新）
```

## 常见问题

### Q1: 为什么有时候侧边栏没有自动关闭？

**A**: 可能的原因：
1. 页面加载较慢，500ms 延迟不够（可调整）
2. AI Studio 更新了页面结构，按钮选择器变化
3. 用户手动关闭了侧边栏，按钮已经不存在

**解决方案**: 查看控制台日志，了解具体情况

### Q2: 这个功能会影响其他网站吗？

**A**: 不会。功能被限制在 `if (hostname === 'aistudio.google.com')` 条件内，只在 AI Studio 上生效。

### Q3: 如果不想自动关闭侧边栏怎么办？

**A**: 目前没有开关选项。如果需要，可以：
1. 临时：在 DevTools 中设置断点阻止执行
2. 永久：修改 `content.js`，删除或注释相关代码

### Q4: 如果 AI Studio 更新了页面结构怎么办？

**A**: 
1. 查看控制台日志，确认是否找到按钮
2. 使用 DevTools 检查新的按钮选择器
3. 更新 `content.js` 中的选择器
4. 提交 issue 或 PR

## 未来增强

### 可能的改进

1. **添加配置选项**：允许用户选择是否自动关闭
2. **支持更多网站**：其他 AI 网站的侧边栏自动关闭
3. **智能检测**：根据侧边栏是否遮挡内容决定是否关闭
4. **自适应延迟**：根据页面加载速度动态调整延迟时间

### 扩展性

代码结构设计便于扩展，可以轻松添加其他网站的特定功能：

```javascript
// 未来可以这样扩展
if (hostname === 'aistudio.google.com') {
  // AI Studio 特定功能
  await closeRunSettingsPanel();
} else if (hostname === 'chat.openai.com') {
  // ChatGPT 特定功能
  await closeChatGPTSidebar();
}
```

## 相关文件

- `smart-search-extension/content.js` - 功能实现（第172-186行）
- `tests/unit/close-sidebar.test.js` - 单元测试
- 本文档 `AISTUDIO_SIDEBAR_CLOSE_FEATURE.md` - 功能文档

## 版本信息

- 添加日期：2025-10-23
- 相关版本：4.7.0+
- 状态：✅ 已完成并测试

## 贡献者

感谢用户反馈和建议，帮助我们不断改进用户体验！

---

**提示**: 如果遇到任何问题或有改进建议，欢迎提交 issue 或 PR！


