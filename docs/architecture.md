# 架构与数据兼容


路由按页 lazy import，Suspense 提供统一加载状态；保留错误边界。未知路径显示页面未找到；浇水/施肥/修剪仅注册合法路径。AppLayout 提供五栏导航、桌面侧栏、页面标题、安全区和存储错误提示。

服务层：garden/care/companion/community。社区接口可替换为 REST；页面通过查询 Hook 使用服务。图片错误回退、object URL 回收和模态键盘焦点管理集中复用。

## 本地数据

- plant-companion-garden-v1：schema 4；plants/tasks/records/messages/companionMessages/companionEvents。兼容 schema 1–3，保留原档案和记录，不向旧用户补发创建奖励。
- plant-companion-community-v1：schema 1；用户帖子/评论、关注/点赞/收藏集合及搜索历史。示例内容集中放置于 mock 层。
- plant-companion-preferences-v1：新增 schema 1；昵称、个人介绍、页面提醒开关。不会更改旧两个存储键或 schema。
- IndexedDB plant-companion-community-images schema 1：图片 Blob。每帖最多3张，单个原文件5MB，压缩后单图1MB，库最多40张/20MB；事务检查容量。
- 植物档案旧图片保留压缩 data URL；新上传压缩到800px且编码不超过256KB。社区图片不写入 localStorage。

档案 ID 标识某株植物；speciesId 标识物种，频道按 speciesId 推荐。同物种允许多株档案。改名后各模块读取同一植物数据；删除档案清除其任务、养护、聊天、伙伴事件，已发布社区快照保留，失效档案不再跳转。删除后迟到的聊天回复不会写入孤立数据。

经验从事件和养护记录确定计算。创建/每日互动/任务唯一 ID 去重，养护每日封顶规则集中于 garden store；页面刷新不发奖励，社区发布不另发可刷经验。

## 异常数据

safeStorage 校验 JSON 信封、版本、关键数组及条目。损坏或未来版本进入只读保护：原 key 不被演示数据覆盖，页面提示恢复入口。设置中先导出文本备份；用户确认恢复时，先保存原始 raw 到时间戳 recovery key，再写当前可用数据；任一步失败保留原始数据。不自动清空用户数据。文本备份不含 IndexedDB 图片，也不提供自动导入功能。

跨域预览拥有独立浏览器存储，不能自动复制原生产域名数据；更新相同域名保留既有存储。无服务器安全授权、跨设备同步或多人一致性保证。
