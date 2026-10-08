# 静态部署指南

Node.js 20.19+。先运行 npm install、npm run typecheck、npm run lint、npm test、npm run build。输出目录 dist；开发端口5173，生产预览 npm run preview -- --port 5175。

Cloudflare Pages：连接仓库开发分支，框架Vite，构建命令npm run build，输出目录dist。确保深层路由回退index.html，资源URL返回正确资源类型。正式发布前验证五个模块、图片上传、本地存储、聊天与社区互动，以及402×874和1440×900布局。

当前线上浏览器验收仍受网络限制；不能将构建成功等同于线上验收。私有预览地址、项目标识、源码凭据和内部部署记录不在公开仓库发布。发布正式版本前需所有者确认，保留上一可用部署用于回滚。

新域名具有独立浏览器存储，不自动迁移用户数据。没有真实后端认证或多人数据共享；不要在前端放API密钥。文本备份不含IndexedDB图片。
