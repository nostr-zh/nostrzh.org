# Nostr 中文社区官网

NostrZH.org 的官方网站，一个 Nostr 中文社区的聚集地。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 博客贡献指南

欢迎提交关于 Nostr 相关主题的博客文章！您可以按照以下指南来创建和提交您的文章。

### 提交流程

1. Fork 本仓库
2. 创建新分支：`git checkout -b blog/your-article-name`
3. 添加你的文章到 `blog/`
4. 本地查看效果：`npm run dev`
5. 提交 Pull Request

### 创建新文章

1. 在 `blog/` 目录下创建新的 `.mdx` 文件
2. 文件名将作为 URL slug（例如 `001-welcome.mdx` 对应 `https://nostrzh.org/blog/001-welcome`）
3. 添加 frontmatter 元数据和文章内容

### 文章格式

```mdx
---
title: 文章标题
date: 2025-12-12
authors:
  - name: 作者名字
    pubkey: 作者的 Nostr 公钥（可选）
description: 文章简短描述（可选）
tags: # 可选
  - 标签1
  - 标签2
---

您的 Markdown 内容...
```
