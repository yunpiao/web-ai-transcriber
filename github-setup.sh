#!/bin/bash

# 请将YOUR_USERNAME替换为您的GitHub用户名
USERNAME="yunpiao"
REPO_NAME="web-ai-transcriber"

# 设置远程仓库
git remote add origin git@github.com:$USERNAME/$REPO_NAME.git

# 推送代码到GitHub
git push -u origin master

echo "代码已推送到GitHub！"
echo "请访问 https://github.com/$USERNAME/$REPO_NAME 查看您的仓库"
echo "接下来您可以在GitHub网页上创建Release版本" 