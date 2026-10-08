import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage, reportCorruptStorage } from "./storage";
import { plants, tasks } from "../mock/garden";
import { dateKey, shiftDate } from "../utils/dates";
import { species } from "../mock/species";
import type { Plant, PlantDraft, CareTask, CareRecord, CareKind, ChatMessage, CompanionEvent, } from "../types";
type GardenState = {
    plants: Plant[];
    tasks: CareTask[];
    records: CareRecord[];
    messages: ChatMessage[];
    companionMessages: ChatMessage[];
    companionEvents: CompanionEvent[];
    companionAction: (plantId: string, kind: "greet" | "observe" | "growth", text?: string) => boolean;
    addCompanionMessage: (message: ChatMessage) => void;
    clearCompanionMessages: (plantId: string) => void;
    deletePlant: (plantId: string) => void;
    addMessage: (message: ChatMessage) => void;
    addTask: (plantId: string, title: string, date: string) => void;
    completeTask: (id: string) => void;
    deferTask: (id: string) => void;
    skipTask: (id: string) => void;
    addObservation: (plantId: string, text: string, id: string) => void;
    addPlant: (draft: PlantDraft, submissionId: string) => string;
    editPlant: (id: string, draft: PlantDraft) => void;
    toggleTask: (id: string) => void;
    recordCare: (plantId: string, kind: CareKind, submissionId: string) => boolean;
};
const labels = {
    water: "浇水",
    fertilize: "施肥",
    prune: "修剪",
    task: "养护任务",
    observation: "观察",
    growth: "成长",
};
function refreshLastCare(plants: Plant[], records: CareRecord[], id: string) {
    return plants.map((p) => p.id === id
        ? {
            ...p,
            lastCareAt: records
                .filter((r) => r.plantId === id && r.kind !== "observation" && r.kind !== "growth")
                .sort((a, b) => b.at.localeCompare(a.at))[0]?.at,
        }
        : p);
}
export const useGarden = create<GardenState>()(persist((set, get) => ({
    plants,
    tasks: tasks.map((t) => ({ ...t, date: dateKey(), status: "pending" })),
    records: [],
    messages: [],
    companionMessages: [],
    companionEvents: [],
    addCompanionMessage: (m) => set(s => !s.plants.some(p => p.id === m.plantId) || s.companionMessages.some(v => v.id === m.id) ? s : ({ companionMessages: [...s.companionMessages, m] })),
    clearCompanionMessages: (id) => set(s => ({ companionMessages: s.companionMessages.filter(m => m.plantId !== id) })),
    deletePlant: (id) => set(s => ({ plants: s.plants.filter(p => p.id !== id), tasks: s.tasks.filter(t => t.plantId !== id), records: s.records.filter(r => r.plantId !== id), messages: s.messages.filter(m => m.plantId !== id), companionMessages: s.companionMessages.filter(m => m.plantId !== id), companionEvents: s.companionEvents.filter(e => e.plantId !== id) })),
    companionAction: (plantId, kind, text) => {
        const id = `companion:${plantId}:${kind}:${dateKey()}`;
        if (!get().plants.some(p => p.id === plantId) || get().companionEvents.some(e => e.id === id) || (kind === 'growth' && !text?.trim()))
            return false;
        const at = new Date().toISOString();
        set(s => ({ companionEvents: [...s.companionEvents, { id, plantId, kind, at, xp: kind === 'growth' ? 0 : 5 }], records: kind === 'growth' ? [{ id, plantId, kind: 'growth' as const, at, text: text!.trim(), xp: 10 }, ...s.records] : s.records }));
        return true;
    },
    addMessage: (message) => set((s) => ({
        messages: !s.plants.some(p => p.id === message.plantId) || s.messages.some((m) => m.id === message.id)
            ? s.messages
            : [...s.messages, message],
    })),
    addTask: (plantId, title, date) => set((s) => ({
        tasks: [
            ...s.tasks,
            {
                id: crypto.randomUUID(),
                plantId,
                title: title.trim(),
                subtitle: "自定义养护任务",
                type: "water",
                done: false,
                date,
                status: "pending",
            },
        ],
    })),
    completeTask: (id) => {
        const t = get().tasks.find((t) => t.id === id);
        if (t && !t.done && t.status !== "skipped")
            get().toggleTask(id);
    },
    deferTask: (id) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id && !t.done && t.status !== "skipped"
            ? { ...t, date: shiftDate(t.date || dateKey(), 1) }
            : t),
    })),
    skipTask: (id) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id && !t.done ? { ...t, status: "skipped" } : t),
    })),
    addObservation: (plantId, text, id) => set((s) => s.records.some((r) => r.id === id)
        ? s
        : {
            records: [
                {
                    id,
                    plantId,
                    text,
                    at: new Date().toISOString(),
                    kind: "observation",
                    xp: 0,
                },
                ...s.records,
            ],
        }),
    addPlant: (draft, id) => {
        if (get().plants.some((p) => p.id === id)) {
            set((s) => ({
                plants: s.plants.map((p) => (p.id === id ? { ...p, ...draft } : p)),
            }));
            return id;
        }
        const item = species.find((s) => s.id === draft.speciesId);
        if (!item)
            throw new Error("请选择有效品种");
        const at = new Date().toISOString();
        set((s) => ({
            companionEvents: [...s.companionEvents, { id: `create:${id}`, plantId: id, kind: 'create', at, xp: 20 }],
            plants: [
                ...s.plants,
                {
                    ...draft,
                    id,
                    name: item.name,
                    latin: item.latin,
                    image: draft.image || item.image,
                    moisture: 45,
                    light: "散射光",
                    temperature: 24,
                    status: "健康",
                    days: 0,
                    createdAt: at,
                    deviceConnected: false,
                },
            ],
        }));
        return id;
    },
    editPlant: (id, draft) => set((s) => {
        const item = species.find((v) => v.id === draft.speciesId);
        if (!item)
            return s;
        return {
            plants: s.plants.map((p) => p.id === id
                ? { ...p, ...draft, name: item.name, latin: item.latin }
                : p),
        };
    }),
    toggleTask: (id) => set((s) => {
        const t = s.tasks.find((t) => t.id === id);
        if (!t)
            return s;
        const records = t.done
            ? s.records.filter((r) => r.id !== id)
            : [
                {
                    id,
                    plantId: t.plantId,
                    text: t.title,
                    at: new Date().toISOString(),
                    kind: "task" as const,
                    xp: s.records.some(r => r.plantId === t.plantId && r.kind === 'task' && r.id !== id && dateKey(new Date(r.at)) === dateKey()) ? 0 : 10,
                },
                ...s.records.filter((r) => r.id !== id),
            ];
        return {
            tasks: s.tasks.map((v) => v.id === id
                ? {
                    ...v,
                    done: !v.done,
                    status: v.done ? "pending" : "completed",
                }
                : v),
            records,
            plants: refreshLastCare(s.plants, records, t.plantId),
        };
    }),
    recordCare: (plantId, kind, id) => {
        if (!get().plants.some((p) => p.id === plantId) ||
            get().records.some((r) => r.id === id))
            return false;
        const at = new Date().toISOString();
        set((s) => {
            const records = [
                { id, plantId, kind, text: `记录${labels[kind]}`, at, xp: s.records.some(r => r.plantId === plantId && r.kind === kind && dateKey(new Date(r.at)) === dateKey()) ? 0 : 10 },
                ...s.records,
            ];
            return {
                records,
                plants: refreshLastCare(s.plants, records, plantId),
            };
        });
        return true;
    },
}), {
    name: "plant-companion-garden-v1",
    storage: createJSONStorage(() => safeStorage),
    version: 4,
    migrate: (saved) => {
        const s = saved as GardenState;
        return {
            ...s,
            messages: s.messages || [],
            companionMessages: s.companionMessages || [],
            companionEvents: s.companionEvents || [],
            tasks: s.tasks.map((t) => ({
                ...t,
                date: t.date || dateKey(),
                status: t.status || (t.done ? "completed" : "pending"),
            })),
            plants: s.plants.map((p) => ({
                ...p,
                category: p.category || "观赏性",
                stage: p.stage || "生长期",
                goal: p.goal || "观赏枝叶",
                createdAt: p.createdAt ||
                    new Date(Date.now() - p.days * 86400000).toISOString(),
                deviceConnected: false,
            })),
            records: s.records.map((r) => ({
                ...r,
                kind: r.kind || "task",
                xp: r.xp ?? 10,
            })),
        };
    },
    onRehydrateStorage: () => (_state, error) => {
        if (error)
            reportCorruptStorage();
    },
}));
