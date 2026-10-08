import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Send, Trash2 } from 'lucide-react';
import { useGarden } from '../../store/garden';
import { companionState, companionReply } from '../../services/companion';
import { CompanionPage } from './Companion';
import { Avatar } from '../../components/companion/Avatar';
import { Loading } from '../../components/care/Shared';
export function CompanionChat() {
    const { plantId } = useParams();
    const s = useGarden();
    const p = s.plants.find(p => p.id === plantId);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [clear, setClear] = useState(false);
    const [error, setError] = useState('');
    const lock = useRef(false);
    const generation = useRef(0);
    const end = useRef<HTMLDivElement>(null);
    useEffect(() => { setBusy(false); lock.current = false; return () => { generation.current++; }; }, [plantId]);
    useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [s.companionMessages, busy]);
    if (!p)
        return <CompanionPage title="找不到这位伙伴">
        <p>档案可能已移除，或链接不正确。</p>
        <Link className="button" to="/companion">返回植物伙伴</Link>
        </CompanionPage>;
    const state = companionState(p, s.records, s.tasks, s.companionEvents);
    const history = s.companionMessages.filter(m => m.plantId === p.id);
    async function send(text = input) {
        if (!p || !text.trim() || lock.current)
            return;
        lock.current = true;
        setBusy(true);
        setInput('');
        setError('');
        const token = generation.current;
        const plant = p;
        s.addCompanionMessage({ id: crypto.randomUUID(), plantId: plant.id, role: 'user', text: text.trim(), at: new Date().toISOString() });
        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            if (token !== generation.current)
                return;
            const current = useGarden.getState();
            const latest = current.plants.find(v => v.id === plant.id);
            if (!latest)
                return;
            const mood = companionState(latest, current.records, current.tasks, current.companionEvents).mood;
            s.addCompanionMessage({ id: crypto.randomUUID(), plantId: plant.id, role: 'assistant', text: companionReply(latest, text, mood), at: new Date().toISOString() });
        }
        catch {
            setError('演示回复暂时无法生成，请重试。');
        }
        finally {
            lock.current = false;
            if (token === generation.current)
                setBusy(false);
        }
    }
    return <CompanionPage title={`和${p.nickname}聊聊`}>
    <div className="partner-chat-grid">
    <section className="partner-hero">
    <Avatar speciesId={p.speciesId} mood={state.mood}/>
    <h2>{p.nickname}</h2>
    <p>{p.name} · {state.mood}</p>
    <Link className="text-link" to={`/companion?plant=${p.id}`}>查看伙伴状态</Link>
    <p className="form-note">聊天不会增加经验，可随时回来陪伴。</p>
    </section>
    <section className="chat-card">
    <div className="chat-heading">
    <h2>我们的日常</h2>
    <button className="button secondary-button" disabled={busy || !history.length} onClick={() => setClear(true)}>
    <Trash2 size={16}/>清空聊天记录</button>
    </div>
    <div className="chat-messages" role="log" aria-label="陪伴聊天历史" aria-live="polite">{!history.length && <div className="care-empty">你好，今天想聊点什么？</div>}{history.map(m => <article key={m.id} className={`chat-message ${m.role}`}>
        <span>{m.role === 'user' ? '你' : `${p.nickname} · 模拟`}</span>
        <p>{m.text}</p>
        </article>)}{busy && <Loading text="正在生成陪伴演示回复…"/>}<div ref={end}/>
    </div>
    <div className="quick-questions">{['今天心情怎么样？', '一起看看成长目标', '我今天有点疲惫', '需要浇水吗？'].map(q => <button key={q} disabled={busy} onClick={() => void send(q)}>{q}</button>)}</div>
    <form className="chat-composer" onSubmit={e => { e.preventDefault(); void send(); }}>
    <textarea aria-label="输入陪伴消息" maxLength={500} placeholder="把今天的小事讲给它听…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void send();
    } }}/>
    <button className="button" disabled={busy || !input.trim()} aria-label="发送陪伴消息">
    <Send size={20}/>
    </button>
    </form>{error && <p role="alert">{error}</p>}</section>
    </div>{clear && <div className="modal-backdrop">
        <section role="dialog" aria-modal="true" aria-label="清空聊天确认" className="care-dialog" onKeyDown={e => { if (e.key === 'Escape')
            setClear(false); }}>
        <h2>清空这株植物的聊天？</h2>
        <p>仅清空当前伙伴的本地对话，养护记录和经验会保留。</p>
        <button className="button secondary-button" onClick={() => setClear(false)}>取消</button>
        <button autoFocus className="button" onClick={() => { generation.current++; s.clearCompanionMessages(p.id); setClear(false); }}>确认清空</button>
        </section>
        </div>}</CompanionPage>;
}
