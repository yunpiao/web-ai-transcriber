# 项目文档结构

## 📁 文档组织结构

```
chrome/
├── README.md                           # 项目主文档
├── QUICKSTART.md                       # 快速开始指南
├── RELEASE_NOTES.md                    # 版本更新日志（v4.6-4.8）
├── GITHUB_RELEASE_GUIDE.md             # GitHub发布指南
├── docs/                               # 文档目录
│   ├── TESTING.md                      # 测试完整指南 ⭐
│   └── DOCS_STRUCTURE.md               # 本文档
└── smart-search-extension/
    ├── FEATURE_USAGE.md                # 功能使用指南
    └── STORE_DESCRIPTION.txt           # Chrome商店描述

issues/                                 # 功能需求文档
├── DeepSeek和深度搜索功能.md
├── 图标点击和当前页面跳转功能.md
└── 自定义提示词功能.md
```

## 📖 文档说明

### 核心文档

| 文档 | 描述 | 受众 |
|------|------|------|
| `README.md` | 项目总览、功能介绍、快速开始 | 所有用户 |
| `QUICKSTART.md` | 5分钟快速上手指南 | 新用户、开发者 |
| `RELEASE_NOTES.md` | 所有版本的更新日志 | 所有用户 |

### 开发文档

| 文档 | 描述 | 受众 |
|------|------|------|
| `docs/TESTING.md` | 测试完整指南（单元/集成/E2E） | 开发者 |
| `GITHUB_RELEASE_GUIDE.md` | GitHub自动打包与发布流程 | 维护者 |

### 功能文档

| 文档 | 描述 | 受众 |
|------|------|------|
| `smart-search-extension/FEATURE_USAGE.md` | 功能详细使用指南 | 最终用户 |
| `smart-search-extension/STORE_DESCRIPTION.txt` | Chrome商店描述文本 | 维护者 |

### 需求文档

| 文档 | 描述 | 受众 |
|------|------|------|
| `issues/*.md` | 功能需求和实现方案 | 开发者、维护者 |

## 🔄 已合并的文档

以下文档已被合并精简，内容整合到新文档中：

### 测试文档（合并到 `docs/TESTING.md`）
- ✅ `HEADLESS_TESTING.md` - headless模式测试
- ✅ `TESTING_SUMMARY_UI_OPTIMIZATION.md` - UI优化测试总结
- ✅ `README_TESTING.md` - 测试总体文档
- ✅ `smart-search-extension/TESTING_GUIDE.md` - 手动测试指南

### 版本日志（合并到 `RELEASE_NOTES.md`）
- ✅ `smart-search-extension/VERSION_4.7_CHANGELOG.md`
- ✅ `smart-search-extension/VERSION_4.8_CHANGELOG.md`

### 其他
- ✅ `IMPLEMENTATION_SUMMARY.md` - 实施总结（内容覆盖在README和TESTING中）

## 📋 文档查找指南

### 我想了解...

**扩展是什么？有什么功能？**
→ 查看 `README.md`

**如何快速开始使用？**
→ 查看 `QUICKSTART.md`

**最新版本有什么新功能？**
→ 查看 `RELEASE_NOTES.md`

**如何使用浏览记录功能？**
→ 查看 `smart-search-extension/FEATURE_USAGE.md`

**如何运行测试？**
→ 查看 `docs/TESTING.md`

**如何发布新版本到GitHub？**
→ 查看 `GITHUB_RELEASE_GUIDE.md`

**某个功能是如何设计的？**
→ 查看 `issues/` 目录下的对应文档

## 🎯 文档维护原则

1. **简洁性** - 避免重复，一个主题只在一个地方详细说明
2. **关联性** - 相关文档之间使用链接互相引用
3. **层次性** - 从概览到细节，逐层深入
4. **时效性** - 及时更新版本号和功能说明
5. **可读性** - 使用清晰的标题、表格和代码示例

## ✨ 文档更新建议

### 新增功能时
1. 更新 `README.md` - 添加功能简介
2. 更新 `RELEASE_NOTES.md` - 添加版本日志
3. 更新 `smart-search-extension/FEATURE_USAGE.md` - 添加详细使用说明
4. （可选）在 `issues/` 添加功能设计文档

### 新增测试时
1. 更新 `docs/TESTING.md` - 更新测试统计和示例

### 发布新版本时
1. 更新 `README.md` - 更新版本号
2. 更新 `RELEASE_NOTES.md` - 添加新版本日志
3. 更新 `smart-search-extension/manifest.json` - 更新版本号

---

**最后更新**: 2025-10-21  
**文档版本**: 1.0

