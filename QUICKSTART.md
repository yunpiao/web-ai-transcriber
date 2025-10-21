# 快速开始指南

## 🚀 5分钟上手

### 步骤1：安装依赖（首次使用）

```bash
cd /Users/dongyunfei/go/src/zawx/chrome
npm install
```

预计安装时间：1-2分钟

### 步骤2：运行测试

```bash
# 快速验证（只运行单元测试，约5秒）
npm run test:unit

# 完整测试（所有测试，约30秒）
npm test
```

### 步骤3：查看测试结果

测试通过会显示：
```
PASS  tests/unit/db.test.js
PASS  tests/unit/utils.test.js
PASS  tests/integration/storage.test.js
PASS  tests/integration/messaging.test.js

Test Suites: 4 passed, 4 total
Tests:       47 passed, 47 total
```

---

## 🔍 测试扩展功能

### 方式A：在Chrome中手动测试

1. **加载扩展**
   ```
   Chrome → 扩展程序 → 开发者模式 → 加载已解压的扩展程序
   → 选择 smart-search-extension 文件夹
   ```

2. **启用浏览记录**
   ```
   点击扩展图标 → 设置 → 勾选"启用浏览记录功能" → 保存
   ```

3. **测试记录**
   ```
   访问任意网页 → 停留5秒 → 返回设置 → 点击"查看浏览历史记录"
   ```

### 方式B：运行E2E自动化测试

```bash
npm run test:e2e
```

会自动打开Chrome并执行所有测试场景。

---

## 📊 测试命令速查

| 命令 | 用途 | 速度 | 推荐场景 |
|------|------|------|---------|
| `npm run test:unit` | 单元测试 | ⚡ 快 | 开发时快速验证 |
| `npm run test:integration` | 集成测试 | ⚡ 快 | 验证模块交互 |
| `npm run test:e2e` | E2E测试 | 🐢 慢 | 完整功能验证 |
| `npm test` | 全部测试 | 🐢 慢 | 提交前完整检查 |
| `npm run test:watch` | 监听模式 | - | 开发时实时测试 |
| `npm run test:coverage` | 覆盖率报告 | 🐢 慢 | 查看测试覆盖 |

---

## 💡 常见问题

### Q: npm install 失败怎么办？

**A:** 尝试以下方法：
```bash
# 清除缓存
npm cache clean --force

# 使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 或使用yarn
yarn install
```

### Q: E2E测试失败，提示无法启动Chrome？

**A:** 确保：
1. Chrome浏览器已安装
2. Puppeteer正确安装（`npm install puppeteer`）
3. 在Mac上，可能需要授予权限

### Q: 测试通过但扩展不工作？

**A:** 检查：
1. 扩展是否正确加载（chrome://extensions/）
2. 控制台是否有错误
3. 是否启用了浏览记录功能
4. 页面是否停留超过5秒

### Q: 如何查看测试覆盖率？

**A:** 
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 📚 相关文档

- **功能使用**：查看 `smart-search-extension/FEATURE_USAGE.md`
- **测试完整指南**：查看 `docs/TESTING.md`
- **版本更新日志**：查看 `RELEASE_NOTES.md`
- **GitHub发布指南**：查看 `GITHUB_RELEASE_GUIDE.md`

---

## 🎯 推荐工作流

### 开发新功能时

```bash
# 1. 启动监听模式
npm run test:watch

# 2. 编写代码和测试
# 测试会自动运行

# 3. 提交前运行完整测试
npm test
```

### 提交代码前

```bash
# 1. 运行所有测试
npm test

# 2. 检查覆盖率
npm run test:coverage

# 3. 确认所有测试通过
# 4. 提交代码
```

### 发布新版本前

```bash
# 1. 完整测试
npm test

# 2. 手动测试关键功能
# 参考 TESTING_GUIDE.md

# 3. 更新版本号
# 修改 manifest.json

# 4. 更新更新日志
# 编辑 VERSION_X.X_CHANGELOG.md
```

---

## ✨ 下一步

1. ✅ 测试通过 → 可以开始使用
2. 📖 阅读文档 → 了解更多功能
3. 🔧 修改代码 → 添加新功能
4. 🧪 编写测试 → 保证质量

**祝开发愉快！** 🎉

