import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  MessageCircle,
  Droplets,
  Leaf,
  Scissors,
  ScanLine,
  CalendarDays,
  ArrowUpRight,
  CloudSun,
  Sparkles,
  Sun,
} from "lucide-react";
import { useGarden } from "../../store/garden";
import { adviceFor, demoWeather } from "../../services/care";
import { PlantSelect, NoPlants } from "../../components/care/Shared";
import { CareCommunityRecommendations } from "../../components/community/Recommendations";
const entries = [
  {
    to: "/care/identify",
    title: "拍照识别",
    text: "确认候选，为植物建档",
    icon: Camera,
  },
  {
    to: "/care/chat",
    title: "养护问答",
    text: "聊聊你的植物小问题",
    icon: MessageCircle,
  },
  {
    to: "/care/watering",
    title: "浇水管理",
    text: "先检查盆土，再决定",
    icon: Droplets,
  },
  {
    to: "/care/fertilizing",
    title: "施肥管理",
    text: "按阶段，补充刚好的养分",
    icon: Leaf,
  },
  {
    to: "/care/pruning",
    title: "修剪指导",
    text: "留住每一枝生长的可能",
    icon: Scissors,
  },
  {
    to: "/care/diagnosis",
    title: "异常观察",
    text: "辅助分析，记录变化",
    icon: ScanLine,
  },
  {
    to: "/care/calendar",
    title: "养护日历",
    text: "安排每一天的小照顾",
    icon: CalendarDays,
  },
];
export function Care() {
  const plants = useGarden((s) => s.plants);
  const records = useGarden((s) => s.records);
  const [id, setId] = useState(plants[0]?.id || "");
  const p = plants.find((p) => p.id === id);
  const a = p ? adviceFor(p, records) : null;
  return (
    <div className="care-page">
      <span className="eyebrow">YOUR BOTANICAL ASSISTANT</span>
      <h1>智能养护</h1>
      <p className="management-subtitle">
        让每一次照顾，都更接近它需要的样子。
      </p>
      <section className="care-hero">
        <div>
          <span className="tip-label">
            <Sparkles size={16} /> AI 植物助手 · 模拟服务
          </span>
          <h2>
            把养护的小疑问，
            <br />
            交给你的绿色助手。
          </h2>
          <p>
            从认识植物，到记录成长，
            <br />
            陪你找到适合它的照顾方式。
          </p>
          <Link to="/care/chat" className="button">
            开始养护问答 <ArrowUpRight size={17} />
          </Link>
        </div>
        <img src="/images/hero.webp" alt="室内植物摄影" />
      </section>
      <div className="simulation-note">
        演示模式 · 识别不分析照片，问答为规则生成，天气为固定示例。
      </div>
      <section className="care-entry-grid">
        {entries.map(({ to, title, text, icon: Icon }) => (
          <Link to={to} key={to} className="care-entry">
            <span>
              <Icon size={24} />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </section>
      <div className="section-heading">
        <h2>今天，给它刚刚好的关心</h2>
      </div>
      {!p ? (
        <NoPlants />
      ) : (
        <>
          <PlantSelect value={id} onChange={setId} />
          <section className="advice-grid">
            {[
              { icon: Droplets, title: "浇水建议", text: a!.water },
              { icon: Leaf, title: "施肥建议", text: a!.fertilize },
              { icon: Scissors, title: "修剪建议", text: a!.prune },
              { icon: Sun, title: "光照建议", text: a!.light },
            ].map(({ icon: Icon, title, text }) => (
              <article className="advice-card" key={title}>
                <Icon size={21} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </section>
          <CareCommunityRecommendations speciesId={p.speciesId} />
          <div className="stage-note">
            <Leaf size={18} />
            <p>{a!.stage}</p>
            <Link to={`/plants/${p.id}`} className="text-link">
              植物档案 <ArrowUpRight size={16} />
            </Link>
          </div>
        </>
      )}
      <section className="weather-risk">
        <CloudSun size={38} />
        <div>
          <h2>
            {demoWeather.temperature}°C <span>{demoWeather.condition}</span>
          </h2>
          <p>
            空气湿度 {demoWeather.humidity}% · {demoWeather.city} · 模拟天气
          </p>
          <p>
            {a?.weather ||
              "先添加植物，获取按物种与摆放环境区分的模拟风险提醒。"}
          </p>
        </div>
      </section>
    </div>
  );
}
