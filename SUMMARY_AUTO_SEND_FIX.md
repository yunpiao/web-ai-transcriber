# 总结今日浏览自动发送功能修复总结

## 问题描述

用户点击"总结今日浏览"按钮后，AI页面虽然打开了，但不会自动填入总结文本并发送。

## 问题根源

`history.js` 中的 `summarizeToday()` 函数直接使用 `window.open()` 或 `window.location.href` 打开AI页面，绕过了 `background.js` 的标准流程，导致：

1. `content.js` 没有被主动注入到新打开的页面
2. 自动填入和发送机制失效

## 修复方案

### 1. 修改 `history.js` 的 `summarizeToday()` 函数

**文件**: `smart-search-extension/history.js` (第656-681行)

**修改内容**:
- 保留生成总结文本和保存到 `chrome.storage.local` 的逻辑
- **删除**直接打开页面的代码 (`window.open()` / `window.location.href`)
- **改为**通过 `chrome.runtime.sendMessage()` 发送消息给 background.js:

```javascript
// 通过 background.js 打开AI页面，确保 content.js 正确注入
chrome.runtime.sendMessage({
  action: 'openSummaryPage',
  engineKey: settings.favoriteEngine
}, (response) => {
  if (response && !response.success) {
    console.error('[总结功能] 打开页面失败:', response.error);
    alert('打开转写界面失败：' + response.error);
  }
});
```

### 2. 在 `background.js` 中添加消息处理器

**文件**: `smart-search-extension/background.js` (第181-254行)

**新增内容**: 添加 `openSummaryPage` 消息处理器

```javascript
if (request.action === 'openSummaryPage') {
  (async () => {
    try {
      // 读取用户配置
      const settings = await chrome.storage.sync.get({
        favoriteEngine: 'qwen',
        useCurrentTab: false
      });
      
      // 确定引擎URL（带降级处理）
      const engineKey = request.engineKey || settings.favoriteEngine || 'qwen';
      const engine = SEARCH_ENGINES[engineKey];
      const engineUrl = engine ? engine.url : SEARCH_ENGINES['qwen'].url;
      
      // 打开/更新标签页
      let targetTabId;
      if (settings.useCurrentTab) {
        // 在当前标签页打开
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0]) {
          await chrome.tabs.update(tabs[0].id, { url: engineUrl });
          targetTabId = tabs[0].id;
        } else {
          // 降级：创建新标签页
          const newTab = await chrome.tabs.create({ url: engineUrl });
          targetTabId = newTab.id;
        }
      } else {
        // 在新标签页打开
        const newTab = await chrome.tabs.create({ url: engineUrl });
        targetTabId = newTab.id;
      }
      
      // 监听页面加载完成后注入content.js
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === targetTabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          
          chrome.scripting.executeScript({
            target: { tabId: targetTabId },
            files: ["content.js"]
          });
        }
      });
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // 异步响应
}
```

### 3. 验证 `content.js` 的自动发送逻辑

**文件**: `smart-search-extension/content.js`

**已验证的逻辑**:
- ✅ 第29行：正确读取 `tempSearchText` 和 `skipPromptTemplate`
- ✅ 第37-63行：当 `skipPromptTemplate` 为 `true` 时，跳过添加提示词模板
- ✅ 第108行：组装文本 `searchText = ${promptTemplate}${searchText}`
- ✅ 第110-116行：自动填入输入框
- ✅ 第119行：派发 `input` 事件触发框架更新
- ✅ 第124-126行：自动点击提交按钮
- ✅ 第160行：清理临时数据

## 完整工作流程

1. 用户在历史记录页面点击"总结今日浏览"按钮
2. `history.js` 生成总结文本并保存到 `chrome.storage.local`
3. `history.js` 通过消息通信告知 `background.js` 打开AI页面
4. `background.js` 根据用户配置打开新标签页或更新当前标签页
5. `background.js` 监听页面加载完成事件
6. 页面加载完成后，`background.js` 主动注入 `content.js`
7. `content.js` 自动读取总结文本并填入输入框
8. `content.js` 自动点击发送按钮
9. `content.js` 清理临时数据

## 测试验证

### 单元测试
- ✅ 所有97个单元测试通过
- ✅ 格式化、筛选、总结等核心功能测试通过

### 集成测试
- ✅ 所有56个集成测试通过
- ✅ Storage交互、消息通信、数据库操作测试通过

### E2E测试
- ✅ 所有7个E2E测试通过
- ✅ 总结按钮显示正确
- ✅ 总结文本生成正确
- ✅ Storage数据保存正确
- ✅ skipPromptTemplate 标识设置正确
- ✅ 总结文本格式验证通过

### 测试输出关键信息

```
📝 总结文本长度: 352
💬 提示信息: 已准备好今天的浏览总结（1 条记录），即将打开转写界面...
📦 点击后的storage: {
  skipPromptTemplate: true,
  tempSearchText: '请帮我总结一下今天（2025-10-21）的浏览记录...'
}
```

## 修改的文件

1. `smart-search-extension/history.js` - 修改 `summarizeToday()` 函数
2. `smart-search-extension/background.js` - 添加 `openSummaryPage` 消息处理器
3. `tests/e2e/summary.test.js` - 添加新的E2E测试验证修复

## 关键改进

1. **统一流程**: 总结功能现在使用与普通AI转写相同的标准流程
2. **可靠注入**: 通过 background.js 确保 content.js 正确注入
3. **防御性编程**: 添加了降级处理和错误处理
4. **完整测试**: 添加了专门的E2E测试验证修复

## 注意事项

- 总结文本已包含完整的提示词，因此设置 `skipPromptTemplate: true` 来避免重复添加
- content.js 会自动识别这个标识，直接使用总结文本而不添加默认提示词模板
- 修复后的功能支持所有配置的AI引擎（Gemini、Qwen、DeepSeek、AI Studio）
- 支持用户设置的"在当前标签页打开"选项

## 修复日期

2025-10-21

