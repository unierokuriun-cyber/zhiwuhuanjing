import { useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Droplets,
  Sun,
  Thermometer,
  Leaf,
  Scissors,
  Sparkles,
  Check,
  Plus,
  MapPin,
} from "lucide-react";
import { useGarden } from "../store/garden";
import { PlantImage } from "../components/common/PlantImage";
import type { CareKind } from "../types";
import { growth } from "../services/companion";
import { getStorageError } from "../store/storage";
import { channelForSpecies } from "../services/community";
export function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [remove, setRemove] = useState(false);
  const events = useGarden(s=>s.companionEvents);
  const deletePlant = useGarden(s=>s.deletePlant);
  const plant = useGarden((s) => s.plants.find((p) => p.id === id));
  const records = useGarden((s) => s.records).filter((r) => r.plantId === id);
  const recordCare = useGarden((s) => s.recordCare);
  const [kind, setKind] = useState<CareKind | null>(null);
  const [message, setMessage] = useState("");
  const operation = useRef("");
  const lock = useRef(false);
  if (!plant)
    return (
      <div className="empty-state">
        <Leaf />
        <h1>没有找到这株植物</h1>
        <p>档案可能已移除，或链接不正确。</p>
        <Link className="button" to="/garden">
          返回花园
        </Link>
      </div>
    );
  const actions = [
    { kind: "water" as const, label: "浇水", icon: Droplets },
    { kind: "fertilize" as const, label: "施肥", icon: Plus },
    { kind: "prune" as const, label: "修剪", icon: Scissors },
  ];
  const label = actions.find((a) => a.kind === kind)?.label;
  function confirm() {
    if (!kind || lock.current) return;
    lock.current = true;
    recordCare(plant!.id, kind, operation.current);
    const saved = useGarden.getState().records.find(r=>r.id===operation.current);
    setMessage(getStorageError() || `已记录${label}，获得 ${saved?.xp || 0} 点养护经验`);
    setKind(null);
  }
  return (
    <div className="plant-management">
      <Link to="/garden" className="text-link back-link">
        <ArrowLeft size={18} /> 回到我的花园
      </Link>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">YOUR PLANT, YOUR COMPANION</span>
          <h1>{plant.nickname}</h1>
          <p className="management-subtitle">
            {plant.name} · {plant.latin}
          </p>
        </div>
        <Link className="button secondary-button" to={`/plants/${id}/edit`}>
          编辑档案 <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="detail-grid">
        <section className="detail-visual">
          <PlantImage src={plant.image} alt={plant.name} eager />
          <span className="detail-photo-label">
            <MapPin size={14} />
            {plant.location} · {plant.category}
          </span>
          <div className="detail-companionship">
            <Leaf size={19} />
            <div>
              与你一起生长
              <small>
                {Math.max(
                  0,
                  Math.floor(
                    (Date.now() - new Date(plant.createdAt).getTime()) /
                      86400000,
                  ),
                )}{" "}
                天的陪伴
              </small>
            </div>
          </div>
        </section>
        <section className="detail-info">
          <div className="section-heading">
            <h2>今天的状态</h2>
            <span
              className={`status-pill ${plant.status === "需要关注" ? "status-warning" : ""}`}
            >
              {plant.status}
            </span>
          </div>
          <p className="data-caption">未连接设备 · 以下环境数值为演示数据</p>
          <div className="detail-metrics">
            {[
              {
                icon: Droplets,
                value: `${plant.moisture}%`,
                label: "土壤湿度",
              },
              {
                icon: Thermometer,
                value: `${plant.temperature}°C`,
                label: "环境温度",
              },
              { icon: Sun, value: plant.light, label: "光照条件" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <Icon size={22} />
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <dl className="plant-facts">
            <div>
              <dt>生长阶段</dt>
              <dd>{plant.stage}</dd>
            </div>
            <div>
              <dt>主要养护目标</dt>
              <dd>{plant.goal}</dd>
            </div>
            <div>
              <dt>最近养护</dt>
              <dd>
                {plant.lastCareAt
                  ? new Date(plant.lastCareAt).toLocaleString("zh-CN")
                  : "还没有养护记录"}
              </dd>
            </div>
            <div>
              <dt>养护经验</dt>
              <dd>{growth(plant.id, records, events).xp} XP</dd>
            </div>
          </dl>
          <div className="detail-advice">
            <span className="tip-label">
              <Sparkles size={16} /> AI 养护建议 · 模拟
            </span>
            <h3>先观察，再给它刚刚好的照顾。</h3>
            <p>
              {plant.speciesId === "haworthia"
                ? "多肉适合明亮通风的位置。浇水前先检查盆土，避免长期积水。"
                : "保持明亮的散射光与适度通风。浇水前先检查盆土，而不是只按固定天数浇水。"}{" "}
              当前目标：{plant.goal}。建议仅为演示，需结合实际情况判断。
            </p>
          </div>
          <Link to="/care" className="text-link">
            查看完整个性化养护建议 <ArrowUpRight size={16} />
          </Link>
          <Link className="text-link" to={`/companion?plant=${plant.id}`}>查看这株植物的数字伙伴</Link>
          {channelForSpecies(plant.speciesId) && <Link className="text-link" to={`/community/channels/${channelForSpecies(plant.speciesId)!.channelId}`}>到{channelForSpecies(plant.speciesId)!.name}频道交流</Link>}
          <h3 className="care-action-title">记录今天的照顾</h3>
          <div className="care-actions">
            {actions.map((a) => (
              <button
                key={a.kind}
                onClick={() => {
                  operation.current = crypto.randomUUID();
                  lock.current = false;
                  setKind(a.kind);
                  setMessage("");
                }}
              >
                <a.icon size={21} />
                <span>记录{a.label}</span>
              </button>
            ))}
          </div>
          {message && (
            <p className="success-message" role="status">
              <Check size={16} />
              {message}
            </p>
          )}
        </section>
      </div>
      <section className="history-panel">
        <div className="section-heading">
          <h2>养护的每一个瞬间</h2>
          <span className="muted">{records.length} 条记录 · 本地保存</span>
        </div>
        {records.length ? (
          records.map((r) => (
            <article className="history-entry" key={r.id}>
              <span className="growth-icon">
                <Leaf size={18} />
              </span>
              <div>
                <h3>{r.text}</h3>
                <time dateTime={r.at}>
                  {new Date(r.at).toLocaleString("zh-CN")}
                </time>
              </div>
              {r.kind === "growth" && channelForSpecies(plant.speciesId) && <Link className="text-link" to={`/community/create?record=${encodeURIComponent(r.id)}`}>分享成长记录</Link>}
              <span className="record-xp">+{r.xp} XP</span>
            </article>
          ))
        ) : (
          <div className="history-empty">
            <Leaf size={25} />
            <p>还没有养护记录。第一份照顾，从今天开始。</p>
          </div>
        )}
      </section>
      <button className="button secondary-button" onClick={()=>setRemove(true)}>删除植物档案</button>
      {remove && <div className="modal-backdrop"><section className="care-dialog" role="dialog" aria-modal="true" aria-label="删除植物确认" onKeyDown={e=>{if(e.key==='Escape')setRemove(false);}}><h2>删除「{plant.nickname}」？</h2><p>将移除该植物的本地档案、养护记录、任务、聊天和伙伴成长数据。此操作无法恢复。</p><button className="button secondary-button" onClick={()=>setRemove(false)}>取消</button><button className="button" autoFocus onClick={()=>{deletePlant(plant.id);navigate('/garden');}}>确认删除</button></section></div>}
      {kind && (
        <div className="modal-backdrop" onClick={() => setKind(null)}>
          <section
            className="care-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="care-dialog-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setKind(null);
            }}
          >
            <span className="growth-icon">
              <Leaf size={23} />
            </span>
            <h2 id="care-dialog-title">记录一次{label}</h2>
            <p>
              确认你已为「{plant.nickname}」完成{label}
              。本次记录将保存到养护历史。
            </p>
            <div>
              <button
                className="button secondary-button"
                onClick={() => setKind(null)}
              >
                取消
              </button>
              <button className="button" autoFocus onClick={confirm}>
                确认记录
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
