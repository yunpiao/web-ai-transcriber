# DeepSeek和深度搜索功能计划

## 上下文
当前项目是一个Chrome扩展，用于捕获页面文本并发送至搜索引擎或AI工具。需要添加DeepSeek作为新的模型选项，并增加控制深度搜索功能的开关。

## 计划
1. **修改background.js**
   - 添加DeepSeek配置到SEARCH_ENGINES对象
   - 添加默认深度搜索设置

2. **修改options.html**
   - 在选择框中添加DeepSeek选项
   - 添加深度搜索功能复选框

3. **修改options.js**
   - 添加深度搜索设置的保存和读取功能

4. **修改content.js**
   - 添加DeepSeek的选择器配置
   - 实现点击深度搜索按钮的功能

## 预期结果
- 用户可以选择DeepSeek作为默认搜索引擎
- 用户可以通过复选框控制是否启用深度搜索功能 