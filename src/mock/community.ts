import type {
  Channel,
  CommunityPost,
  CommunityComment,
} from "../types/community";
const definitions = [
  [
    "bougainvillea",
    "三角梅",
    "观赏性",
    "光照与花期之间，找到刚刚好的平衡。",
    ["bougainvillea"],
    ["开花", "修剪"],
  ],
  [
    "rose",
    "月季",
    "观赏性",
    "记录每一朵花，也交流水肥与通风。",
    ["rose"],
    ["月季", "花期"],
  ],
  [
    "monstera",
    "龟背竹",
    "观赏性",
    "新叶舒展，和大家聊聊室内绿意。",
    ["monstera"],
    ["散射光", "新叶"],
  ],
  [
    "pothos",
    "绿萝",
    "观赏性",
    "从第一盆绿萝开始，慢慢学会照顾。",
    ["pothos"],
    ["室内", "扦插"],
  ],
  [
    "succulents",
    "多肉植物",
    "观赏性",
    "认识休眠与生长，享受小小的叶片变化。",
    ["haworthia", "succulent"],
    ["多肉", "盆土"],
  ],
  [
    "orchid",
    "兰花",
    "观赏性",
    "交流介质、通风和花箭的日常观察。",
    ["orchid"],
    ["兰花", "介质"],
  ],
  [
    "foliage",
    "其他观叶植物",
    "观赏性",
    "银皇后、橡皮树等观叶植物的日常观察。",
    ["aglaonema", "rubber"],
    ["观叶", "室内"],
  ],
  [
    "tomato",
    "小番茄",
    "实用性",
    "从育苗到采收，记录阳台上的小小丰收。",
    ["tomato"],
    ["结果", "阳台种菜"],
  ],
  [
    "strawberry",
    "草莓",
    "实用性",
    "一起观察花、果与匍匐茎。",
    ["strawberry"],
    ["授粉", "采收"],
  ],
  [
    "mint",
    "薄荷",
    "实用性",
    "清新的叶片，轻快的种植日常。",
    ["mint"],
    ["香草", "叶片采收"],
  ],
  [
    "pepper",
    "辣椒",
    "实用性",
    "记录枝叶与花果，分享自己的种植经验。",
    ["pepper"],
    ["开花", "果实"],
  ],
  [
    "basil",
    "罗勒",
    "实用性",
    "从嫩叶到分枝，一起认识香草。",
    ["basil"],
    ["香草", "摘心"],
  ],
  [
    "herbs",
    "其他香草与蔬菜",
    "实用性",
    "为你的餐桌添一抹亲手种下的绿意。",
    ["herbs", "vegetables"],
    ["香草", "蔬菜"],
  ],
] as const;
export const mockChannels: Channel[] = definitions.map((d, i) => ({
  channelId: d[0],
  name: d[1],
  category: d[2],
  description: d[3],
  plantSpeciesIds: [...d[4]],
  tags: [...d[5]],
  cover:
    d[0] === "monstera"
      ? "/images/monstera.webp"
      : d[0] === "succulents"
        ? "/images/succulent.webp"
        : "/images/hero.webp",
  demoFollowers: 1200 + i * 187,
}));
const topics: Record<string, string[]> = {
  tomato: [
    "阳台小番茄，开花到结果的观察清单",
    "小番茄叶片发黄，应该先检查什么？",
    "第一颗小番茄慢慢变红了",
    "阳台里的小菜园日常",
  ],
  bougainvillea: [
    "三角梅不开花？先看光照与新枝",
    "三角梅花后修剪时机怎么判断？",
    "新枝上冒出了小花苞",
    "今天给三角梅找了一个通风角落",
  ],
  monstera: [
    "龟背竹的新叶，需要怎样的光照？",
    "叶缘发黄，先排查盆土与排水",
    "一片新叶展开的一周",
    "客厅的绿意角落",
  ],
  mint: [
    "薄荷的分枝与采叶观察",
    "薄荷叶片下垂，要立即浇水吗？",
    "薄荷冒出了一簇新芽",
    "香草陪我度过清晨",
  ],
};
const bodies = [
  "先观察植物实际状态，再决定照顾方式。记录光照、盆土干湿、排水和生长阶段，比机械地按固定天数浇水更有帮助。\n\n无设备时可以摸摸盆土、检查盆重与根部排水；结果期留意支撑与通风。施肥应结合长势和产品标签，不对弱株盲目加量。\n\n这是演示攻略，需结合品种与实际环境判断。欢迎留下你的观察。",
  "最近发现叶片有些变化，想请大家帮忙梳理检查顺序。种植环境是阳台，近几天有强光。\n\n我准备先检查盆土和排水，再观察新叶与老叶的差异。这是模拟求助，不代表有真实用户等待回复。",
  "这一周每天留意叶片与花果，把变化慢慢写下来。今天终于发现了新的生长迹象。\n\n示例成长故事与植物摄影仅用于展示社区布局，不代表真实种植记录。",
  "给植物留一个通风、光线合适的角落，也给自己一点观察的时间。示例内容，期待你写下自己的本地故事。",
];
export const mockPosts: CommunityPost[] = mockChannels.flatMap((c, i) =>
  bodies.map((body, j) => ({
    postId: `demo-${c.channelId}-${j}`,
    authorId: `demo-author-${j}`,
    channelId: c.channelId,
    plantSpeciesId: c.plantSpeciesIds[0],
    title:
      topics[c.channelId]?.[j] ||
      `${c.name} · ${["观察与养护入门", "遇到叶片变化怎么办", "记录今天的小小生长", "种植日常交流"][j]}`,
    content: body,
    images: [c.cover],
    tags: [c.name, ...c.tags],
    postType: (["养护攻略", "问题求助", "成长分享", "日常交流"] as const)[j],
    createdAt: `2026-10-${String(1 + ((i + j) % 7)).padStart(2, "0")}T02:00:00Z`,
    updatedAt: `2026-10-${String(1 + ((i + j) % 7)).padStart(2, "0")}T02:00:00Z`,
    likeCount: 16 + i * 3 + j,
    favoriteCount: 5 + i,
    commentCount: j === 0 ? 1 : 0,
    source: "demo",
  })),
);
export const mockComments: CommunityComment[] = mockPosts
  .filter((p) => p.postType === "养护攻略")
  .map((p) => ({
    commentId: `comment-${p.postId}`,
    postId: p.postId,
    authorId: "demo-author-1",
    content: "先检查实际盆土与通风，这个观察思路很实用。（示例评论）",
    createdAt: p.createdAt,
    source: "demo",
  }));
export const mockAuthors: Record<string, string> = {
  "demo-author-0": "林间笔记",
  "demo-author-1": "阳台观察员",
  "demo-author-2": "小叶日记",
  "demo-author-3": "绿意收藏家",
};
