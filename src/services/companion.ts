import type { Plant, CareRecord, CareTask, CompanionEvent } from '../types';
import { dateKey, shiftDate } from '../utils/dates';
export type Mood = '开心' | '平静' | '口渴' | '疲惫' | '需要关注' | '成长中';
export function companionState(p: Plant, records: CareRecord[], tasks: CareTask[], events: CompanionEvent[], now = new Date()) {
    const own = records.filter(r => r.plantId === p.id);
    const recent = own.filter(r => dateKey(new Date(r.at)) === dateKey(now));
    const interacted = events.some(e => e.plantId === p.id && dateKey(new Date(e.at)) === dateKey(now) && e.kind !== 'create');
    const pending = tasks.filter(t => t.plantId === p.id && !t.done && t.status !== 'skipped' && (t.date || dateKey(now)) <= dateKey(now));
    const latest = own.filter(r => r.kind !== 'observation' && r.kind !== 'growth').sort((a, b) => b.at.localeCompare(a.at))[0];
    const inspectionDays = p.speciesId === 'mint' ? 3 : p.speciesId === 'haworthia' ? 14 : 7;
    const overdue = now.getTime() - new Date(latest?.at || p.createdAt).getTime() > inspectionDays * 86400000;
    const reasons = [`${p.name} · ${p.stage}，当前目标：${p.goal}`, '未连接传感器；不使用演示湿度判断真实健康。'];
    let mood: Mood = '平静';
    if (recent.some(r => r.kind === 'observation' && /盆土干|土壤干/.test(r.text))) {
        mood = '口渴';
        reasons.push('你今天记录了盆土干燥；这是拟人化提示，请复查盆土和植物需求后决定是否浇水。');
    }
    else if (pending.length || overdue) {
        mood = '需要关注';
        reasons.push(pending.length ? `还有 ${pending.length} 项待办，请检查实际情况。` : `超过 ${inspectionDays} 天没有养护记录，建议观察盆土；不代表已经缺水。`);
    }
    else if (p.stage.includes('休眠')) {
        mood = '疲惫';
        reasons.push('档案处于休眠阶段，以休息的拟人化形象呈现。');
    }
    else if (interacted || recent.length) {
        mood = '开心';
        reasons.push('今天已经留下照顾或陪伴记录。');
    }
    else if (/幼苗|生长|开花|结果/.test(p.stage)) {
        mood = '成长中';
        reasons.push('根据档案生长阶段展示成长主题，不代表检测到实际增长。');
    }
    else
        reasons.push('目前没有新的待办或互动提示。');
    return { mood, reasons, vitality: mood === '需要关注' || mood === '口渴' ? '等待观察' : mood === '疲惫' ? '休息时光' : '陪伴活跃', health: '真实健康待观察' };
}
export function growth(plantId: string, records: CareRecord[], events: CompanionEvent[]) {
    const xp = records.filter(r => r.plantId === plantId).reduce((n, r) => n + r.xp, 0) + events.filter(e => e.plantId === plantId).reduce((n, e) => n + e.xp, 0);
    return { xp, level: Math.floor(xp / 100) + 1, progress: xp % 100, remaining: 100 - xp % 100 };
}
export function achievements(plants: Plant[], records: CareRecord[], events: CompanionEvent[]) {
    const ordered = records.slice().sort((a, b) => a.at.localeCompare(b.at));
    const created = events.filter(e => e.kind === 'create').sort((a, b) => a.at.localeCompare(b.at));
    const growthRecords = ordered.filter(r => r.kind === 'growth');
    const actions = events.filter(e => e.kind === 'greet' || e.kind === 'observe').sort((a, b) => a.at.localeCompare(b.at));
    const dates = [...new Set(ordered.filter(r => r.kind !== 'observation' && r.kind !== 'growth').map(r => dateKey(new Date(r.at))))].sort();
    let best = 0, streak = 0, unlock = '';
    dates.forEach((d, i) => { streak = i && shiftDate(dates[i - 1], 1) === d ? streak + 1 : 1; best = Math.max(best, streak); if (streak >= 3 && !unlock)
        unlock = ordered.find(r => dateKey(new Date(r.at)) === d)?.at || ''; });
    return [
        { id: 'new', name: '新手园丁', condition: '亲手创建 1 株植物', progress: created.length, target: 1, at: created[0]?.at },
        { id: 'water', name: '第一次浇水', condition: '保存 1 次实际浇水记录', progress: ordered.filter(r => r.kind === 'water').length, target: 1, at: ordered.find(r => r.kind === 'water')?.at },
        { id: 'streak', name: '连续养护三天', condition: '连续 3 个自然日留下养护记录', progress: best, target: 3, at: unlock },
        { id: 'growth', name: '成长记录达人', condition: '保存 5 条成长记录（每日限 1 条奖励）', progress: growthRecords.length, target: 5, at: growthRecords[4]?.at },
        { id: 'collector', name: '植物收藏家', condition: '亲手创建 5 株植物（示例植物不计入）', progress: created.length, target: 5, at: created[4]?.at },
        { id: 'explorer', name: '陪伴探索者', condition: '完成 6 次每日陪伴动作', progress: actions.length, target: 6, at: actions[5]?.at },
    ].map(a => ({ ...a, progress: Math.min(a.progress, a.target), unlocked: !!a.at, owned: plants.length }));
}
export function companionReply(p: Plant, text: string, mood: Mood) {
    const voices: Record<string, string> = { bougainvillea: '今天也想和你一起迎接阳光！', tomato: '期待下一朵花、下一颗果实。', monstera: '慢慢来，生长有自己的节奏。', mint: '一阵清风，就是美好的一天。' };
    const topic = /浇水|口渴/.test(text) ? '先摸摸盆土、观察叶片吧，别只凭我的表情决定浇水。' : /成长|目标/.test(text) ? `我们的目标是${p.goal}，可以写下今天的新变化。` : /难过|疲惫|累/.test(text) ? '可以先休息一会儿，等你有空再来看看我。' : `谢谢你来陪我。档案里我是${p.stage}，今天的陪伴心情是${mood}。`;
    return `${p.nickname}：${voices[p.speciesId] || '很高兴与你一起度过今天。'} ${topic}（规则演示，不代表植物真实感知。）`;
}
