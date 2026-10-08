import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  Clock,
  Plus,
} from "lucide-react";
import { CarePage, PlantSelect, NoPlants } from "../../components/care/Shared";
import { useGarden } from "../../store/garden";
import { dateKey, shiftDate } from "../../utils/dates";
export function CareCalendar() {
  const plants = useGarden((s) => s.plants);
  const tasks = useGarden((s) => s.tasks);
  const records = useGarden((s) => s.records);
  const complete = useGarden((s) => s.completeTask);
  const defer = useGarden((s) => s.deferTask);
  const skip = useGarden((s) => s.skipTask);
  const add = useGarden((s) => s.addTask);
  const [date, setDate] = useState(dateKey());
  const [mode, setMode] = useState("month");
  const [filter, setFilter] = useState("");
  const [title, setTitle] = useState("");
  const [plantId, setPlantId] = useState(plants[0]?.id || "");
  const [taskDate, setTaskDate] = useState(dateKey());
  const [message, setMessage] = useState("");
  const selected = new Date(`${date}T12:00:00`);
  const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const weekStart = shiftDate(date, -((selected.getDay() + 6) % 7));
  const start =
    mode === "week"
      ? weekStart
      : shiftDate(dateKey(first), -((first.getDay() + 6) % 7));
  const dates = Array.from({ length: mode === "week" ? 7 : 42 }, (_, i) =>
    shiftDate(start, i),
  );
  const matches = tasks.filter((t) => !filter || t.plantId === filter);
  const todayTasks = matches.filter((t) => (t.date || dateKey()) === date);
  function change(dir: number) {
    const d = new Date(`${date}T12:00:00`);
    if (mode === "month") {
      d.setDate(1);
      d.setMonth(d.getMonth() + dir);
      setDate(dateKey(d));
    } else setDate(shiftDate(date, dir * 7));
  }
  return (
    <CarePage
      title="养护日历"
      subtitle="把照顾安排在生活里，让每一个小任务都有迹可循。"
    >
      {!plants.length ? (
        <NoPlants />
      ) : (
        <>
          <PlantSelect value={filter} onChange={setFilter} all />
          <div className="calendar-layout">
            <section className="care-card">
              <div className="calendar-toolbar">
                <button
                  className="icon-button"
                  aria-label="上一期"
                  onClick={() => change(-1)}
                >
                  <ChevronLeft />
                </button>
                <h2>
                  {selected.getFullYear()} 年 {selected.getMonth() + 1} 月
                </h2>
                <button
                  className="icon-button"
                  aria-label="下一期"
                  onClick={() => change(1)}
                >
                  <ChevronRight />
                </button>
              </div>
              <div className="calendar-modes">
                <button
                  aria-pressed={mode === "month"}
                  className={mode === "month" ? "selected" : ""}
                  onClick={() => setMode("month")}
                >
                  月视图
                </button>
                <button
                  aria-pressed={mode === "week"}
                  className={mode === "week" ? "selected" : ""}
                  onClick={() => setMode("week")}
                >
                  周视图
                </button>
                <button onClick={() => setDate(dateKey())}>今天</button>
              </div>
              <div className="calendar-grid">
                {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
                  <span className="calendar-weekday" key={d}>
                    {d}
                  </span>
                ))}
                {dates.map((key) => (
                  <button
                    key={key}
                    aria-label={`${key}${matches.some((t) => t.date === key) ? " 有任务" : ""}`}
                    aria-pressed={date === key}
                    className={`${date === key ? "selected" : ""} ${new Date(key + "T12:00:00").getMonth() !== selected.getMonth() ? "outside" : ""}`}
                    onClick={() => setDate(key)}
                  >
                    {Number(key.slice(-2))}
                    {matches.some((t) => (t.date || dateKey()) === key) && (
                      <i />
                    )}
                  </button>
                ))}
              </div>
            </section>
            <section className="care-card">
              <div className="section-heading">
                <h2>
                  <CalendarDays size={18} /> {date.slice(5).replace("-", " / ")}{" "}
                  的任务
                </h2>
                <span className="muted">{todayTasks.length} 项</span>
              </div>
              {!todayTasks.length ? (
                <p className="care-empty">
                  今天没有安排任务，留一点时间观察新叶吧。
                </p>
              ) : (
                todayTasks.map((t) => (
                  <article className="calendar-task" key={t.id}>
                    <h3>{t.title}</h3>
                    <p>
                      {plants.find((p) => p.id === t.plantId)?.nickname} ·{" "}
                      {t.done
                        ? "已完成"
                        : t.status === "skipped"
                          ? "已跳过"
                          : t.subtitle}
                    </p>
                    {!t.done && t.status !== "skipped" ? (
                      <div>
                        <button
                          onClick={() => {
                            complete(t.id);
                            setMessage("任务已完成，记录已同步");
                          }}
                        >
                          <Check size={14} />
                          完成
                        </button>
                        <button
                          onClick={() => {
                            defer(t.id);
                            setMessage("任务已延迟至次日");
                          }}
                        >
                          <Clock size={14} />
                          延迟一天
                        </button>
                        <button
                          onClick={() => {
                            skip(t.id);
                            setMessage("已跳过，不发放经验");
                          }}
                        >
                          跳过
                        </button>
                      </div>
                    ) : (
                      <span className="status-pill">
                        {t.done ? `已完成 · +${records.find(r=>r.id===t.id)?.xp || 0} XP` : "已跳过"}
                      </span>
                    )}
                  </article>
                ))
              )}
              {message && (
                <p className="success-message" role="status">
                  {message}
                </p>
              )}
            </section>
          </div>
          <form
            className="custom-task care-card"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim() || !plantId) return;
              add(plantId, title, taskDate);
              setTitle("");
              setDate(taskDate);
              setMessage("自定义任务已添加");
            }}
          >
            <h2>
              <Plus size={18} /> 添加自定义任务
            </h2>
            <div>
              <PlantSelect value={plantId} onChange={setPlantId} />
              <label>
                任务名称
                <input
                  required
                  maxLength={80}
                  value={title}
                  placeholder="比如：检查新叶"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                任务日期
                <input
                  type="date"
                  required
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                />
              </label>
              <button className="button">添加任务</button>
            </div>
          </form>
        </>
      )}
    </CarePage>
  );
}
