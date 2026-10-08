import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, Eye, Droplets, Plus, MessageCircle, Trophy, Sprout, Check, ArrowLeft } from 'lucide-react';
import { useGarden } from '../../store/garden';
import { companionState, growth, achievements, companionReply } from '../../services/companion';
import { PlantImage } from '../../components/common/PlantImage';
import { Avatar } from '../../components/companion/Avatar';
import { PlantSelect, NoPlants } from '../../components/care/Shared';
import { dateKey } from '../../utils/dates';
import { getStorageError } from '../../store/storage';
import type { ReactNode } from 'react';
import { CommunityMilestone } from "../../components/community/Recommendations";
export function CompanionPage({ title, children }: {
    title: string;
    children: ReactNode;
}) {
    const [error, setError] = useState(getStorageError);
    useEffect(() => { const update = () => setError(getStorageError()); window.addEventListener("garden-storage-error", update); return () => window.removeEventListener("garden-storage-error", update); }, []);
    return <div className="care-page companion-page">{error && <p className="form-error" role="alert">{error}</p>}<Link className="text-link back-link" to="/companion">
    <ArrowLeft size={17}/>植物伙伴</Link>
    <span className="eyebrow">GROW TOGETHER, A LITTLE EVERY DAY</span>
    <h1>{title}</h1>
    <p className="management-subtitle">一株植物，一段属于你的陪伴。</p>
    <p className="simulation-note">
    <Heart size={16}/>数字分身与对话为规则演示，不代表植物真实感知或真实 AI 推理。</p>{children}</div>;
}
export function Companion() {
    const s = useGarden();
    const [params, setParams] = useSearchParams();
    const p = s.plants.find(p => p.id === params.get('plant')) || s.plants[0];
    const [feedback, setFeedback] = useState('今天，想和你一起慢慢生长。');
    const [note, setNote] = useState('');
    const [care, setCare] = useState<'water' | 'fertilize' | null>(null);
    const operation = useRef('');
    if (!p)
        return <CompanionPage title="植物伙伴">
        <NoPlants />
        </CompanionPage>;
    const state = companionState(p, s.records, s.tasks, s.companionEvents);
    const g = growth(p.id, s.records, s.companionEvents);
    const today = dateKey();
    function act(kind: 'greet' | 'observe' | 'growth') { const ok = s.companionAction(p.id, kind, note); setFeedback(ok ? `${kind === 'growth' ? '成长记录已保存，+10 XP' : '陪伴已记录，+5 XP'}。${companionReply(p, kind === 'growth' ? '成长' : '你好', state.mood)}` : '今天这项奖励已领取；仍然可以继续观察与陪伴。'); if (ok)
        setNote(''); }
    return <CompanionPage title="植物伙伴">
    <div className="partner-toolbar">
    <PlantSelect value={p.id} onChange={id => { setParams({ plant: id }); setFeedback("今天，想和你一起慢慢生长。"); setNote(""); setCare(null); }}/>
    <Link className="text-link" to="/companion/garden">
    <Sprout size={17}/>虚拟花园</Link>
    <Link className="text-link" to="/companion/achievements">
    <Trophy size={17}/>我的成就</Link>
    </div>
 <div className="partner-grid">
    <section className="partner-hero">
    <span className="status-pill">{state.mood} · 数字心情</span>
    <Avatar speciesId={p.speciesId} mood={state.mood}/>
    <h2>{p.nickname}</h2>
    <p>{p.name} · {p.stage}</p>
    <div className="partner-photo">
    <PlantImage src={p.image} alt={`${p.nickname}的档案照片`}/>
    <div>现实中的你<small>{state.health}</small>
    </div>
    <Link to={`/plants/${p.id}`}>档案</Link>
    </div>
    <div className="partner-level">
    <strong>Lv. {g.level}</strong>
    <span>{g.xp} XP · 距下一级 {g.remaining} XP</span>
    </div>
    <progress aria-label="等级经验进度" max={100} value={g.progress}/>
    <p className="form-note">{state.vitality} · 活力仅表示本地陪伴状态</p>
    </section>
 <section className="partner-side">
    <div key={feedback} className="partner-bubble" role="status">{feedback}</div>
    <div className="partner-actions">
    <button onClick={() => act('greet')}>
    <Heart />打招呼</button>
    <button onClick={() => act('observe')}>
    <Eye />观察植物</button>
    <button onClick={() => setFeedback(state.reasons.join(' '))}>
    <Sprout />查看心情</button>{(['water', 'fertilize'] as const).map(k => <button key={k} onClick={() => { operation.current = crypto.randomUUID(); setCare(k); }}>{k === 'water' ? <Droplets /> : <Plus />}记录{k === 'water' ? '浇水' : '施肥'}</button>)}<Link to={`/companion/chat/${p.id}`}>
    <MessageCircle />陪我聊聊</Link>
    </div>
 <details className="partner-reasons">
    <summary>为什么是这个心情？</summary>{state.reasons.map(r => <p key={r}>{r}</p>)}</details>
 <div className="partner-panel">
    <h2>每日陪伴任务</h2>{(['greet', 'observe', 'growth'] as const).map(k => <div className="partner-daily" key={k}>
        <Check size={18}/>
        <span>{k === 'greet' ? '和它打个招呼' : k === 'observe' ? '观察叶片与盆土' : '留下一条成长记录'}</span>
        <small>{s.companionEvents.some(e => e.id === `companion:${p.id}:${k}:${today}`) ? '已完成' : k === 'growth' ? '+10 XP' : '+5 XP'}</small>
        </div>)}<label className="plant-select">成长观察<textarea aria-label="成长观察" maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder="比如：今天发现了一片新叶…"/>
    </label>
    <button className="button" disabled={!note.trim()} onClick={() => act('growth')}>保存成长记录</button>
    <Link className="text-link" to={`/plants/${p.id}`}>查看成长变化与养护历史</Link>
    </div>
 <div className="partner-panel">
    <h2>今天的照顾</h2>{s.tasks.filter(t => t.plantId === p.id && t.date === today && t.status !== 'skipped').map(t => <div className="partner-daily" key={t.id}>
        <span>{t.title}</span>
        <button className="button secondary-button" disabled={t.done} onClick={() => { s.completeTask(t.id); setFeedback('养护任务已完成，成长经验已同步。'); }}>{t.done ? '已完成' : '完成任务'}</button>
        </div>)}<Link className="text-link" to="/care/calendar">打开养护日历</Link>
    </div>
    </section>
    </div>
 {care && <div className="modal-backdrop">
        <section className="care-dialog" role="dialog" aria-modal="true" aria-label="确认养护记录" onKeyDown={e => { if (e.key === 'Escape')
            setCare(null); }}>
        <h2>已实际完成{care === 'water' ? '浇水' : '施肥'}吗？</h2>
        <p>先检查植物实际需要，再记录照顾。同株同种操作每日仅奖励一次，记录仍可保存。</p>
        <button className="button secondary-button" onClick={() => setCare(null)}>取消</button>
        <button autoFocus className="button" onClick={() => { s.recordCare(p.id, care, operation.current); setCare(null); setFeedback('养护记录已保存，成长数据已同步。'); }}>确认记录</button>
        </section>
        </div>}
 </CompanionPage>;
}
export function Achievements() {
    const s = useGarden();
    const items = achievements(s.plants, s.records, s.companionEvents);
    return <CompanionPage title="每一份照顾，都有回响"><CommunityMilestone />
    <p className="form-note">基于真实本地操作解锁；示例档案不算创建奖励。账号进度仅保存在当前浏览器，删除植物会移除关联进度。</p>
    <p className="partner-account">整体陪伴经验：{s.records.reduce((n, r) => n + r.xp, 0) + s.companionEvents.reduce((n, e) => n + e.xp, 0)} XP · 已解锁 {items.filter(a => a.unlocked).length} / {items.length}</p>
    <div className="achievement-grid">{items.map(a => <section key={a.id} className={`partner-panel achievement ${a.unlocked ? 'unlocked' : ''}`}>
        <Trophy size={30}/>
        <h2>{a.name}</h2>
        <p>{a.condition}</p>
        <progress aria-label={`${a.name}进度`} max={a.target} value={a.progress}/>
        <p>{a.progress} / {a.target}</p>
        <small>{a.unlocked ? `已解锁 · ${new Date(a.at!).toLocaleString('zh-CN')}` : '等待你的下一份照顾'}</small>
        </section>)}</div>
    </CompanionPage>;
}
export function VirtualGarden() {
    const s = useGarden();
    return <CompanionPage title="我的虚拟花园">{!s.plants.length ? <NoPlants /> : <div className="virtual-garden">{s.plants.map(p => {
                const state = companionState(p, s.records, s.tasks, s.companionEvents);
                const g = growth(p.id, s.records, s.companionEvents);
                return <Link className="virtual-plant" to={`/companion?plant=${p.id}`} key={p.id}>
                <Avatar small speciesId={p.speciesId} mood={state.mood}/>
                <h2>{p.nickname}</h2>
                <p>{p.name} · Lv. {g.level}</p>
                <span className="status-pill">{state.mood}</span>
                </Link>;
            })}</div>}</CompanionPage>;
}
