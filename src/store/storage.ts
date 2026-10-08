import type { StateStorage } from "zustand/middleware";
const errors = new Map<string, string>();
const blocked = new Set<string>();
export function getStorageError() {
  return [...errors.values()].join(" ") || null;
}
function notify(key: string, message: string) {
  errors.set(key, message);
  window.dispatchEvent(new Event("garden-storage-error"));
}
export function reportCorruptStorage() {
  notify(
    "corrupt",
    "本地记录暂时无法读取，正在显示演示数据。原数据保留，请到设置导出备份。",
  );
}
export function blockedStorageKeys() {
  return [...blocked];
}
function valid(key: string, raw: string) {
  const data = JSON.parse(raw);
  if (
    !data ||
    !data.state ||
    typeof data.state !== "object" ||
    Array.isArray(data.state)
  )
    return false;
  const s = data.state;
  const schema = key.includes("garden") ? 4 : 1;
  if (
    data.version !== undefined &&
    (!Number.isInteger(data.version) ||
      data.version > schema ||
      data.version < 0)
  )
    return false;
  const fields = key.includes("garden")
    ? [
        "plants",
        "tasks",
        "records",
        "messages",
        "companionMessages",
        "companionEvents",
      ]
    : key.includes("community")
      ? [
          "userPosts",
          "comments",
          "followed",
          "liked",
          "favorites",
          "searchHistory",
        ]
      : [];
  if (
    key.includes("garden") &&
    ["plants", "tasks", "records"].some((f) => !Array.isArray(s[f]))
  )
    return false;
  for (const f of fields) {
    if (s[f] !== undefined && !Array.isArray(s[f])) return false;
    if (
      s[f]?.some(
        (item: unknown) =>
          item === null ||
          (typeof item !== "object" && typeof item !== "string"),
      )
    )
      return false;
  }
  const stringSets = ["followed", "liked", "favorites", "searchHistory"];
  if (stringSets.some((f) => s[f]?.some((v: unknown) => typeof v !== "string")))
    return false;
  const objectSets: Record<string, string[]> = {
    tasks: ["id", "plantId", "title"],
    records: ["id", "plantId", "text", "at"],
    messages: ["id", "plantId", "text", "at", "role"],
    companionMessages: ["id", "plantId", "text", "at", "role"],
    companionEvents: ["id", "plantId", "kind", "at"],
    userPosts: [
      "postId",
      "channelId",
      "authorId",
      "title",
      "content",
      "createdAt",
      "postType",
    ],
    comments: ["commentId", "postId", "authorId", "content", "createdAt"],
  };
  for (const [field, required] of Object.entries(objectSets))
    if (
      s[field]?.some(
        (v: Record<string, unknown>) =>
          typeof v !== "object" ||
          required.some((k) => typeof v[k] !== "string"),
      )
    )
      return false;
  if (
    s.userPosts?.some(
      (v: { images?: unknown; tags?: unknown }) =>
        !Array.isArray(v.images) || !Array.isArray(v.tags),
    )
  )
    return false;
  if (
    data.version === 4 &&
    s.plants?.some((v: Record<string, unknown>) =>
      ["speciesId", "stage", "goal", "location", "createdAt"].some(
        (k) => typeof v[k] !== "string",
      ),
    )
  )
    return false;
  if (
    fields.length &&
    Object.keys(s).some((f) => !fields.includes(f) && f !== "revision")
  )
    return false;
  if (
    s.plants?.some(
      (p: {
        id?: unknown;
        nickname?: unknown;
        name?: unknown;
        image?: unknown;
      }) =>
        typeof p.id !== "string" ||
        typeof p.nickname !== "string" ||
        typeof p.name !== "string" ||
        typeof p.image !== "string",
    )
  )
    return false;
  if (
    key.includes("preferences") &&
    (typeof s.name !== "string" ||
      typeof s.bio !== "string" ||
      typeof s.reminders !== "boolean")
  )
    return false;
  return true;
}
export const safeStorage: StateStorage = {
  getItem: (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null && !valid(key, raw)) throw new Error("invalid");
      return raw;
    } catch {
      blocked.add(key);
      notify(
        key,
        "本地记录暂时无法读取，原数据保留且已暂停覆盖。请到设置导出备份后恢复。",
      );
      return null;
    }
  },
  setItem: (key, value) => {
    if (blocked.has(key)) {
      notify(
        key,
        "本地记录暂时无法读取，原数据保留且已暂停覆盖。请到设置导出备份后恢复。",
      );
      return;
    }
    try {
      localStorage.setItem(key, value);
      errors.delete(key);
      window.dispatchEvent(new Event("garden-storage-error"));
    } catch {
      notify(key, "本次修改暂时无法保存，请检查浏览器存储权限或剩余空间。");
    }
  },
  removeItem: (key) => {
    if (blocked.has(key)) return;
    try {
      localStorage.removeItem(key);
    } catch {
      notify(key, "本地记录暂时无法删除。");
    }
  },
};
// Only invoked by the explicit recovery confirmation in Settings. Never deletes raw data.
export function recoverStorage(key: string, value: string) {
  if (!blocked.has(key) || !valid(key, value)) return false;
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null)
      localStorage.setItem(`${key}-recovery-${Date.now()}`, raw);
    localStorage.setItem(key, value);
    blocked.delete(key);
    errors.delete(key);
    errors.delete("corrupt");
    window.dispatchEvent(new Event("garden-storage-error"));
    return true;
  } catch {
    notify(key, "备份或恢复失败，原数据保留。请先释放存储空间。");
    return false;
  }
}
