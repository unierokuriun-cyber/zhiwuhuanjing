# 设计系统

Modern Botanical UI：暖白、森林绿、鼠尾草绿、真实植物摄影、轻盈卡片与统一 Lucide 线性图标。伙伴为原创 SVG，不使用 Emoji 替代。

| Token | 值 |
|---|---|
| Primary | #315F45 |
| Secondary | #82A96A |
| Light Green | #B5D6A4 |
| Background | #F6F8F3 |
| Card | #FFFFFF |
| Surface | #E7F0E5 |
| Text | #26352B |
| Muted | #829087 |
| Warning | #E5A35A |

原 palette 保留；新增 readable-muted #5D7061 用于小字号文字，主视觉浅绿背景文字 #566859，避免低对比度。8px 间距体系、20px 主卡片圆角、柔和阴影、统一至少44px关键操作。手机辅助文字提高至11–12px，重要信息清晰分层。

402×874 CSS px为移动验收基准，不固定页面宽度。320–430手机单列/植物双列，768平板精简侧栏，1024以上桌面完整侧栏与多列；内容最大宽度约1200px。顶部和底部使用 env 安全区，滚动内容预留固定导航空间。

图片 object-fit 统一裁切，不拉伸。系统摄影默认 WebP，保留 JPG 兼容旧档案；非主视觉懒加载，主视觉高优先级与预加载。来源见 image-sources.md；WebP 为已有授权摄影的技术压缩版本。

按钮/链接/输入保留键盘焦点轮廓，模态焦点陷阱与返回焦点，输入有可访问名称。动画尊重 prefers-reduced-motion。空、加载、失败、成功状态有明确文案；生产版本未知链接不再显示旧阶段占位。
