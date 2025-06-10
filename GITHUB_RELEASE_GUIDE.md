# GitHub Release 发布指南

完成代码推送后，您可以使用两种方式创建Release版本：通过GitHub网页手动创建，或使用配置好的GitHub Actions自动创建。

## 1. 创建GitHub仓库
1. 登录您的GitHub账户
2. 点击右上角的"+"图标，选择"New repository"
3. 填写仓库名称：`web-ai-transcriber`
4. 添加描述："一款智能的Chrome扩展，帮助用户将网页内容通过AI服务进行转写和优化"
5. 保持仓库为Public（公开）
6. 不要初始化仓库（不要添加README、.gitignore或许可证）
7. 点击"Create repository"

## 2. 推送代码到GitHub
1. 编辑`github-setup.sh`文件，将`YOUR_USERNAME`替换为您的GitHub用户名
2. 执行脚本：`./github-setup.sh`
3. 如果使用HTTPS方式，可能需要输入您的GitHub用户名和密码
4. 如果使用SSH方式，确保已经设置了SSH密钥

## 3. 自动创建Release版本（推荐）
该项目已配置GitHub Actions自动化工作流，可以自动打包扩展并创建Release。

1. 创建并推送一个带版本号的标签：
   ```bash
   git tag v4.2
   git push origin v4.2
   ```

2. 推送标签后，GitHub Actions会自动执行以下操作：
   - 打包扩展文件为zip格式
   - 创建新的Release版本
   - 将zip文件上传到Release
   - 使用RELEASE_NOTES.md的内容作为描述

3. 自动化过程完成后，您可以在GitHub仓库的"Releases"部分查看结果

## 4. 手动创建Release版本（备选方案）
如果您希望手动控制Release过程，可以按照以下步骤操作：

1. 在GitHub仓库页面，点击"Releases"（在右侧导航栏）
2. 点击"Create a new release"
3. 在"Tag version"中输入`v4.2`
4. 在"Release title"中输入"网页 AI 转写器 v4.2"
5. 在描述框中复制粘贴`RELEASE_NOTES.md`的内容
6. 点击"Attach binaries"上传`网页AI转写器_v4.2.zip`文件
7. 选择"This is a pre-release"如果这是测试版本
8. 点击"Publish release"完成发布

## 5. 验证Release
1. 发布完成后，您可以在Releases页面看到新创建的版本
2. 确认下载链接是否可用
3. 验证描述和附件是否正确显示

## 6. 分享Release链接
发布完成后，您可以分享Release页面的链接，用户可以直接从GitHub下载您的扩展。

链接格式通常为：`https://github.com/[用户名]/web-ai-transcriber/releases/tag/v4.2`

## 7. 修改和更新
如果需要更新扩展，请修改代码后：

1. 提交更改：`git commit -am "更新说明"`
2. 增加版本号并创建新标签：`git tag v4.3`
3. 推送代码和标签：
   ```bash
   git push origin master
   git push origin v4.3
   ```
4. GitHub Actions会自动为新版本创建Release 