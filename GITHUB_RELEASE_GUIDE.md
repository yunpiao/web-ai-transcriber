# GitHub 自动打包与发布指南

本项目已配置GitHub Actions自动化工作流，可以在每次代码提交后自动打包扩展并更新Release。

## 1. 创建GitHub仓库
1. 登录您的GitHub账户
2. 点击右上角的"+"图标，选择"New repository"
3. 填写仓库名称：`web-ai-transcriber`
4. 添加描述："一款智能的Chrome扩展，帮助用户将网页内容通过AI服务进行转写和优化"
5. 保持仓库为Public（公开）
6. 不要初始化仓库（不要添加README、.gitignore或许可证）
7. 点击"Create repository"

## 2. 推送代码到GitHub
1. 设置远程仓库：
   ```bash
   git remote add origin https://github.com/你的用户名/web-ai-transcriber.git
   ```
2. 推送代码：
   ```bash
   git push -u origin master
   ```

## 3. 自动打包流程
一旦代码推送到GitHub，自动打包流程会立即启动：

1. GitHub Actions会自动执行以下操作：
   - 打包扩展文件为zip格式
   - 上传打包文件作为构建产物(Artifact)
   - 创建或更新名为"latest"的Release
   - 将zip文件附加到Release中

2. 自动化过程完成后，您可以在以下位置获取打包文件：
   - GitHub仓库的"Actions"标签页中，查看最新的工作流运行记录
   - "Artifacts"部分下载构建产物
   - 或在"Releases"部分下载最新版本

## 4. 查看构建结果
1. 在GitHub仓库页面，点击"Actions"标签
2. 查看最新的工作流运行状态
3. 如果构建成功，会显示绿色的对勾标记
4. 点击进入可以查看详细的构建日志

## 5. 下载构建产物
方法一：从Actions下载
1. 在工作流运行详情页面
2. 滚动到底部的"Artifacts"部分
3. 点击"extension-package"下载zip文件

方法二：从Releases下载
1. 在GitHub仓库页面，点击"Releases"
2. 找到"最新自动构建"版本
3. 下载附加的zip文件

## 6. 发布到Chrome商店
1. 登录[Chrome开发者控制台](https://chrome.google.com/webstore/devconsole/)
2. 点击"添加新项目"
3. 上传从GitHub下载的zip包
4. 填写商店页面信息，可参考`STORE_DESCRIPTION.txt`中的内容
5. 提交审核

## 7. 手动创建版本发布（可选）
如果需要创建特定版本的发布，可以手动操作：

1. 在GitHub仓库页面，点击"Releases"
2. 点击"Draft a new release"
3. 创建新标签，如`v1.0.0`
4. 填写发布标题和描述
5. 上传构建产物
6. 点击"Publish release" 