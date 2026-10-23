# Cloudflare Pages 部署

连接 GitHub 仓库，选择待部署分支；框架选 Vite，构建命令 `npm run build`，输出目录 `dist`，Node.js 22。根目录留空，不需要 API 密钥或环境变量。`public/_redirects` 提供 SPA 深层路由回退，构建时自动复制到 dist。

本地：`npm ci`、`npm run typecheck`、`npm run lint`、`npm run build`。测试用 `npm test`，默认 Chromium 路径见 playwright.config.ts。

首次创建 Pages 项目须在 Cloudflare Workers & Pages 中连接该 GitHub 仓库并授权。构建成功后用平台返回的 pages.dev 地址验证首页、社区、植物详情及手机布局；构建成功不等于手机访问通过。保留旧部署以便回滚。

所有 AI、天气、设备和多人社区均为演示。数据在当前浏览器本地；换域名后旧数据不会自动迁移。不要清空旧域名的数据。无需把 Sites 的绑定或任何凭据复制到 Cloudflare。
