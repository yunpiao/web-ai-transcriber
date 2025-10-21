# 版本 4.8 更新日志

## 🎉 新增功能：浏览时长记录

### 功能描述
在原有浏览记录功能基础上，新增**智能时长追踪**，自动记录您在每个页面的实际停留时间。

### 主要特性

1. **前台时长计时** ⏱️
   - 只计算页面在前台可见的时间
   - 切换标签页时自动暂停计时
   - 返回页面时继续累加时长
   - 精确到秒级

2. **智能累加** 🔄
   - 同一页面多次查看会累加总时长
   - 刷新页面后继续追踪（同一标签页内）
   - 使用sessionStorage维持追踪状态

3. **定期保存** 💾
   - 每30秒自动保存一次当前时长
   - 页面关闭时保存最终时长
   - 防止数据丢失

4. **时长显示** 📊
   - 历史记录页面显示停留时长
   - 智能格式化：秒/分秒/小时分
   - 视觉标识：⏱️ 图标 + 绿色标签
   - 旧记录显示"未记录"

### 数据结构变化

#### 数据库升级

- **版本**: 1 → 2
- **新增字段**:
  - `duration`: 停留时长（秒）
  - `lastUpdateTime`: 最后更新时间

#### 示例记录

```json
{
  "id": 1729512345678,
  "url": "https://example.com/tutorial",
  "title": "Chrome扩展开发教程",
  "visitTime": 1729512345678,
  "duration": 930,              // 新增：15分30秒
  "lastUpdateTime": 1729512875678,  // 新增
  "domain": "example.com",
  "favicon": "https://example.com/favicon.ico",
  "content": "页面内容..."
}
```

### 时长格式化规则

| 时长范围 | 显示格式 | 示例 |
|---------|---------|------|
| < 60秒 | X秒 | 30秒 |
| 60秒 - 1小时 | X分Y秒 | 2分30秒 |
| >= 1小时 | X小时Y分 | 1小时15分 |

### 使用场景

1. **了解浏览习惯** 📈
   - 查看哪些页面停留时间最长
   - 分析内容阅读深度

2. **时间管理** ⏰
   - 统计每天在各网站的时间
   - 发现时间黑洞

3. **学习追踪** 📚
   - 记录学习材料的阅读时长
   - 评估学习投入

## 🐛 重要Bug修复

### Bug: 搜索引擎配置不一致导致总结功能崩溃

**严重程度**: 🔴 高（P0）

**错误信息**:
```
TypeError: Cannot read properties of undefined (reading 'url')
at summarizeToday (history.js:677)
```

**根本原因**:
- `options.js` 默认值为 `'google'`
- `SEARCH_ENGINES` 对象中没有 `'google'`
- 导致 `SEARCH_ENGINES['google']` = undefined
- 访问 `undefined.url` 报错

**影响范围**:
- 全新安装扩展的用户
- 从未配置过引擎的用户
- 可能导致总结功能完全不可用

**修复措施**:

1. **统一默认值** (`options.js`)
   ```diff
   - favoriteEngine: 'google'
   + favoriteEngine: 'qwen'
   ```

2. **添加防御性检查** (`history.js`, `background.js`)
   ```javascript
   const engineKey = settings.favoriteEngine || 'qwen';
   const engine = SEARCH_ENGINES[engineKey];
   const engineUrl = engine?.url || SEARCH_ENGINES['qwen'].url;
   ```

3. **补充边界测试** (5个新测试)
   - 测试null/空字符串/无效引擎名
   - 验证降级逻辑
   - 确保默认值有效性

## 📊 测试覆盖

### 新增测试统计

| 类型 | 新增 | 总计 | 说明 |
|------|------|------|------|
| 单元测试 | +17 | 97 | 时长格式化、计算逻辑 |
| 集成测试 | +17 | 56 | 数据库、消息、边界测试 |
| E2E测试 | +4 | 32 | 真实环境验证 |
| **总计** | **+38** | **185** | 覆盖所有功能点 |

### 测试时间

- **单元测试**: 0.7秒 ⚡
- **集成测试**: 0.6秒 ⚡
- **E2E测试**: 24.7秒 (headless模式)
- **完整套件**: ~26秒

### 测试通过率

- ✅ 单元测试: 100% (97/97)
- ✅ 集成测试: 100% (56/56)
- ✅ E2E测试: 100% (4/4 duration + 28/28 其他)

## 🔧 技术实现

### tracker.js 架构升级

**旧架构**:
```javascript
// 停留5秒 → 记录一次 → 结束
setTimeout(() => {
  recordPageVisit();
}, 5000);
```

**新架构**:
```javascript
// 持续计时
setInterval(() => {
  if (isPageVisible) currentDuration += 1;
}, 1000);

// 5秒创建记录
if (currentDuration >= 5 && !hasInitialRecord) {
  createInitialRecord();
}

// 30秒定期保存
setInterval(() => {
  updateDuration();
}, 30000);

// 页面卸载保存最终时长
window.addEventListener('beforeunload', () => {
  updateDuration();
});
```

### 数据库操作优化

**新增API**:
```javascript
// 查找同URL的记录
getHistoryByUrl(url) → Promise<record|null>

// 更新时长
updateHistoryDuration(id, duration, lastUpdateTime) → Promise<void>
```

**升级逻辑**:
```javascript
// 版本1 → 版本2
onupgradeneeded(event) {
  if (oldVersion < 2) {
    objectStore.createIndex('duration', 'duration', {unique: false});
    objectStore.createIndex('lastUpdateTime', 'lastUpdateTime', {unique: false});
  }
}
```

## 🎨 UI改进

### 历史记录卡片

**新增元素**:
```html
<span class="card-duration">⏱️ 15分30秒</span>
```

**样式**:
- 绿色背景 (#e8f5e9)
- 绿色文字 (#2e7d32)
- 圆角标签
- 时钟图标

**旧记录处理**:
```html
<span class="card-duration-empty">⏱️ 未记录</span>
```

## 🔐 向后兼容

- ✅ 旧记录自动添加 `duration: 0`
- ✅ 旧记录显示"未记录"而非报错
- ✅ 数据库自动升级，无需用户操作
- ✅ 不影响现有功能

## ⚡ 性能影响

| 指标 | 影响 | 说明 |
|------|------|------|
| CPU | 极小 | 每秒一次变量更新 |
| 内存 | <1KB | 几个简单变量 |
| 磁盘I/O | 低 | 每30秒一次写入 |
| 网络 | 无 | 纯本地操作 |

**结论**: 对用户体验无任何影响 ✅

## 📝 升级说明

1. **自动升级**: 扩展更新后自动升级数据库
2. **无需操作**: 用户完全无感知
3. **数据安全**: 旧数据完整保留
4. **功能增强**: 立即享受新功能

## 🎯 已知限制

1. **页面刷新**: 刷新后创建新记录（设计如此）
2. **多标签页**: 同URL在不同标签页分别计时
3. **精度**: 秒级精度（1秒误差）
4. **存储**: 不跨浏览器同步（localStorage限制）

## 📚 文档更新

- ✅ `FEATURE_USAGE.md` - 时长功能使用说明
- ✅ `BUG_FIX_SUMMARY.md` - Bug修复详细分析
- ✅ `HEADLESS_TESTING.md` - 后台测试指南
- ✅ `VERSION_4.8_CHANGELOG.md` - 本文档

## 🚀 下一步计划

未来版本可考虑：
- 统计分析（网站排行、时长分析）
- 导出带时长的报表
- 时长筛选（只看长时间停留的页面）
- 时长提醒（超过设定时间提示）

## 📅 发布信息

- **版本号**: 4.8.0
- **发布日期**: 2025-10-21
- **升级建议**: 强烈推荐（包含重要bug修复）
- **兼容性**: 完全向后兼容

---

**重要**: 本版本包含严重bug修复，建议所有用户升级！
