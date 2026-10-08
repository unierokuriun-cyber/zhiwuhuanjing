import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  Plus,
  Sun,
  Thermometer,
  Camera,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Sprout,
} from "lucide-react";
import { dateKey } from "../utils/dates";
import { useGarden } from "../store/garden";
import { getStorageError } from "../store/storage";
import { PlantImage } from "../components/common/PlantImage";
import { gardenService, type WeatherData } from "../services/garden";
import { GardenChannelRecommendations } from "../components/community/Recommendations";
const filters = ["全部植物", "客厅", "阳台", "书房"] as const;
import { usePreferences } from "../store/preferences";
export function Garden() {
  const profile = usePreferences();
  const { plants, tasks: allTasks, records, toggleTask } = useGarden();
  const tasks = allTasks.filter(
    (t) => (!t.date || t.date === dateKey()) && t.status !== "skipped",
  );
  const [storageError, setStorageError] = useState(getStorageError);
  useEffect(() => {
    const update = () => setStorageError(getStorageError());
    window.addEventListener("garden-storage-error", update);
    return () => window.removeEventListener("garden-storage-error", update);
  }, []);
  const [filter, setFilter] = useState<string>("全部植物");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [notices, setNotices] = useState(false);
  const fetchWeather = () => {
    setWeatherError(false);
    gardenService
      .getWeather()
      .then(setWeather)
      .catch(() => setWeatherError(true));
  };
  useEffect(() => {
    fetchWeather();
  }, []);
  const done = tasks.filter((t) => t.done).length;
  const visible = plants.filter(
    (p) => filter === "全部植物" || p.location === filter,
  );
  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">MY LITTLE GARDEN</span>
          <h1>
            早安，{profile.name}
            <span className="greeting-dot">.</span>
          </h1>
          <p>新的一天，让绿意陪你慢慢生长。</p>
        </div>
        <div className="header-actions">
          <span className="date-label">花园的每一天，都有新发现</span>
          <button
            className="icon-button notification"
            aria-label="查看提醒"
            aria-expanded={notices}
            onClick={() => setNotices(!notices)}
          >
            <Bell size={21} />
            {profile.reminders && <i />}
          </button>
          <Link to="/profile" className="avatar" aria-label="查看个人资料">
            {profile.name.slice(0, 1)}
          </Link>
        </div>
      </header>
      {notices && profile.reminders && (
        <div className="notice-panel" role="status">
          <Bell size={18} />
          <div>
            <strong>你有 {tasks.length - done} 项待完成的养护任务</strong>
            <p>下方「今日养护」可以查看并记录。所有提醒均为演示。</p>
          </div>
        </div>
      )}
      {notices && !profile.reminders && (
        <p role="status" className="notice-panel">
          页面内提醒已关闭，可在消息与隐私设置中开启。
        </p>
      )}
      {storageError && (
        <div className="notice-panel" role="alert">
          {storageError}
        </div>
      )}
      <section className="hero" aria-label="花园欢迎">
        <div className="hero-copy">
          <span className="hero-label">
            <span /> 与植物一起，过慢一点
          </span>
          <h2>
            把日子，
            <br />
            种成喜欢的样子。
          </h2>
          <p>
            关心每一片新叶，记录每一次成长。
            <br />
            你的专属花园，今天也生机盎然。
          </p>
          <Link to="/plants/add" className="button hero-button">
            <Plus size={18} /> 添加新植物 <ArrowUpRight size={18} />
          </Link>
        </div>
        <PlantImage
          className="hero-photo"
          src="/images/hero.webp"
          alt="阳光下的室内绿植与陶制花盆"
          eager
        />
        <div className="hero-stamp">
          <Leaf size={18} />
          <span>GROW WITH LOVE</span>
        </div>
      </section>
      <section className="overview" aria-label="花园概览">
        <div className="overview-stat">
          <span className="stat-icon">
            <Sprout size={23} />
          </span>
          <div>
            <span className="muted">花园成员</span>
            <p>
              <b>{String(plants.length).padStart(2, "0")}</b>
              <span>株植物</span>
            </p>
          </div>
        </div>
        <div className="overview-stat">
          <span className="stat-icon">
            <Leaf size={22} />
          </span>
          <div>
            <span className="muted">健康生长</span>
            <p>
              <b>
                {String(
                  plants.filter((p) => p.status === "健康").length,
                ).padStart(2, "0")}
              </b>
              <span>株状态良好</span>
            </p>
          </div>
        </div>
        <div className="overview-stat">
          <span className="stat-icon">
            <Check size={22} />
          </span>
          <div>
            <span className="muted">今日养护</span>
            <p>
              <b>
                {done}
                <em> / {tasks.length}</em>
              </b>
              <span>已完成</span>
            </p>
          </div>
        </div>
        <div className="weather">
          <CloudSun size={36} strokeWidth={1.4} />
          {weatherError ? (
            <div>
              <span>天气暂时无法加载</span>
              <button onClick={fetchWeather}>重试</button>
            </div>
          ) : weather ? (
            <>
              <div>
                <b>
                  {weather.temperature}°<span>{weather.condition}</span>
                </b>
                <p>
                  <MapPin size={12} />
                  {weather.city} <span className="demo-label">演示天气</span>
                </p>
              </div>
              <span className="weather-detail">
                适合与植物一起
                <br />
                享受好天气
              </span>
            </>
          ) : (
            <span role="status">天气加载中…</span>
          )}
        </div>
      </section>
      <div className="garden-columns">
        <section className="plants-section">
          <div className="section-heading">
            <div>
              <h2>
                我的植物 <span className="count">{plants.length}</span>
              </h2>
              <p>每一株，都有自己的生长节奏。</p>
            </div>
            <Link to="/plants/add" className="text-link">
              添加植物 <Plus size={16} />
            </Link>
          </div>
          <div className="filter-row">
            <div className="filters" role="group" aria-label="按摆放位置筛选">
              {filters.map((f) => (
                <button
                  key={f}
                  className={filter === f ? "selected" : ""}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <SlidersHorizontal
              size={18}
              className="filter-symbol"
              aria-hidden="true"
            />
          </div>
          <div className="plant-grid">
            {visible.map((p) => (
              <Link to={`/plants/${p.id}`} key={p.id} className="plant-card">
                <div className="plant-photo">
                  <PlantImage src={p.image} alt={p.name} />
                  <span className="location-label">
                    <MapPin size={11} />
                    {p.location}
                  </span>
                  <span
                    className={`health-dot ${p.status === "需要关注" ? "warning" : ""}`}
                    aria-label={p.status}
                  />
                </div>
                <div className="plant-info">
                  <div className="plant-title">
                    <h3>{p.nickname}</h3>
                    <ArrowUpRight size={18} />
                  </div>
                  <p className="latin">
                    {p.name} · {p.latin}
                  </p>
                  <div className="plant-metrics">
                    <span>
                      <Droplets size={14} />
                      {p.moisture}%
                    </span>
                    <span>
                      <Sun size={14} />
                      {p.light}
                    </span>
                    <span>
                      <Thermometer size={14} />
                      {p.temperature}°
                    </span>
                  </div>
                  <div
                    className={`plant-footer ${p.status === "需要关注" ? "attention" : ""}`}
                  >
                    <span>
                      <span className="tiny-dot" />
                      {p.status === "需要关注"
                        ? "演示偏低，请检查盆土"
                        : `健康生长 · 陪伴 ${p.days} 天`}
                    </span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {visible.length === 0 && (
            <div className="empty-state">
              <Leaf />
              <h3>这里还没有植物</h3>
              <p>为这个角落添一抹绿意吧。</p>
              <Link className="button" to="/plants/add">
                添加植物
              </Link>
            </div>
          )}
          <p className="data-caption">
            <span className="tiny-dot" /> 环境数值为演示数据，尚未连接传感器
          </p>
        </section>
        <aside className="garden-side">
          <GardenChannelRecommendations />
          <section className="task-panel">
            <div className="section-heading">
              <h2>
                今日养护 <span className="count">{tasks.length - done}</span>
              </h2>
              <Link to="/care/calendar" className="text-link">
                日历 <ChevronRight size={15} />
              </Link>
            </div>
            <div className="progress-copy">
              <span>给它们一点关心</span>
              <span>
                {done} / {tasks.length} 已完成
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={tasks.length}
              aria-label="今日养护完成进度"
            >
              <span
                style={{ width: `${(done / (tasks.length || 1)) * 100}%` }}
              />
            </div>
            <div className="task-list">
              {tasks.map((t) => {
                const Icon =
                  t.type === "water"
                    ? Droplets
                    : t.type === "sun"
                      ? Sun
                      : Camera;
                return (
                  <div className={`task ${t.done ? "is-done" : ""}`} key={t.id}>
                    <span className={`task-icon ${t.type}`}>
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3>{t.title}</h3>
                      <p>{t.subtitle}</p>
                    </div>
                    <button
                      className="task-check"
                      aria-label={`${t.done ? "撤销" : "完成"}${t.title}`}
                      aria-pressed={t.done}
                      onClick={() => toggleTask(t.id)}
                    >
                      {t.done && <Check size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="task-footnote">完成任务，让每一份照顾都有迹可循。</p>
          </section>
          <section className="tip-panel">
            <span className="tip-label">
              <Sparkles size={16} /> 植伴小提醒 <span>演示</span>
            </span>
            <h3>
              午后阳光正好，
              <br />
              也别忘了温柔的遮阴。
            </h3>
            <p>龟背竹喜欢明亮的散射光，强烈的直射阳光可能让叶片晒伤。</p>
            <Link to="/care" className="text-link">
              了解更多养护建议 <ArrowRight size={16} />
            </Link>
            <Sun className="tip-decoration" size={90} strokeWidth={0.7} />
          </section>
          <section className="growth-panel">
            <div className="section-heading">
              <h2>生长的足迹</h2>
              <Link
                to="/plants/plant-1"
                className="text-link"
                aria-label="查看成长记录"
              >
                <ArrowUpRight size={18} />
              </Link>
            </div>
            {records.length > 0 ? (
              records.slice(0, 2).map((r) => (
                <div className="growth-entry" key={r.id}>
                  <span className="growth-icon">
                    <Check size={19} />
                  </span>
                  <div>
                    <span className="small-label">养护记录 · 本地保存</span>
                    <h3>{r.text}</h3>
                    <p>一份照顾，一点成长。</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="growth-entry">
                <span className="growth-icon">
                  <Leaf size={19} />
                </span>
                <div>
                  <span className="small-label">示例成长记录 · 龟背竹</span>
                  <h3>一片新叶，悄悄展开了</h3>
                  <p>小森的第 128 天，生活又多了一点绿。</p>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
      <footer className="garden-footer">
        <Leaf size={14} />
        <span>让每一份绿意，都有人陪伴。</span>
        <span className="footer-en">PLANT COMPANION</span>
      </footer>
    </>
  );
}
