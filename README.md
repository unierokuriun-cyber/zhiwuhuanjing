# 植伴 · Plant Companion

React + TypeScript + Vite + Tailwind CSS + React Router + Zustand 响应式植物养护 Web App，第六阶段 0.6.0。

## 功能

我的花园、植物添加/编辑/详情与养护记录、智能养护模拟识别/问答/日历、植物伙伴/经验/成就、植物兴趣频道/搜索/发帖/评论/收藏，以及个人资料与设置。

AI、天气、传感器、硬件和多用户社区均为演示；数据保存在当前浏览器的 localStorage 与容量受控的 IndexedDB，没有真实认证或云同步。私有预览地址与内部部署资料不在此公开仓库发布。

## 运行与验证

Node.js 20.19+。

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview -- --port 5175
```

开发地址 http://localhost:5173；生产产物 dist。Playwright 默认使用 /usr/bin/chromium，其他环境调整 playwright.config.ts。

本版本此前通过69项Playwright测试、七种视口检查、类型检查、Lint及构建；线上交互验收仍受网络访问限制，未完成。

## Cloudflare Pages

连接本仓库的开发分支，框架选择 Vite，构建命令 npm run build，输出目录 dist。深层路径需SPA fallback。公开部署不等于真实账号服务；新域名不会自动迁移旧域名的本地数据。

功能、架构、设计系统、测试报告、部署方法和已知问题见 docs/；摄影来源与授权见 docs/image-sources.md。
