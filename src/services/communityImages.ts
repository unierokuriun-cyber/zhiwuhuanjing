const DB = "plant-companion-community-images";
const LIMIT = 20 * 1024 * 1024;
const MAX_IMAGES = 40;
type StoredImage = { id: string; blob: Blob; createdAt: string };
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("images", { keyPath: "id" });
    request.onerror = () =>
      reject(new Error("图片存储不可用，请检查浏览器权限"));
    request.onsuccess = () => resolve(request.result);
    request.onblocked = () =>
      reject(new Error("图片数据库被其他页面占用，请关闭其他页面重试"));
  });
}
export async function saveCommunityImages(files: File[]): Promise<string[]> {
  if (files.length > 3) throw new Error("每篇帖子最多 3 张图片");
  const images: StoredImage[] = [];
  for (const file of files) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      throw new Error("请选择不超过 5MB 的 JPG、PNG 或 WebP 图片");
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error("图片无法读取，请重新选择");
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("图片压缩失败"))),
        "image/jpeg",
        0.8,
      ),
    );
    if (blob.size > 1024 * 1024)
      throw new Error("压缩后的单张图片仍超过 1MB，请换用较小图片");
    images.push({
      id: crypto.randomUUID(),
      blob,
      createdAt: new Date().toISOString(),
    });
  }
  if (!images.length) return [];
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      const store = tx.objectStore("images");
      const request = store.getAll();
      let reason = "图片保存失败，存储空间可能不足";
      request.onsuccess = () => {
        const existing = request.result as StoredImage[];
        if (
          existing.length + images.length > MAX_IMAGES ||
          existing.reduce((n, i) => n + i.blob.size, 0) +
            images.reduce((n, i) => n + i.blob.size, 0) >
            LIMIT
        ) {
          reason =
            "图片库达到上限（40 张或 20MB），请减少图片或先清理未使用图片";
          tx.abort();
          return;
        }
        images.forEach((i) => store.put(i));
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(reason));
      tx.onabort = () => reject(new Error(reason));
    });
    return images.map((i) => `idb:${i.id}`);
  } finally {
    db.close();
  }
}
export async function readCommunityImage(ref: string): Promise<Blob | null> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("images");
      const r = tx.objectStore("images").get(ref.slice(4));
      r.onsuccess = () => resolve(r.result?.blob || null);
      r.onerror = () => reject(new Error("图片读取失败"));
    });
  } finally {
    db.close();
  }
}
export async function removeCommunityImages(refs: string[]) {
  if (!refs.length) return;
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      refs
        .filter((r) => r.startsWith("idb:"))
        .forEach((r) => tx.objectStore("images").delete(r.slice(4)));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("图片清理失败"));
    });
  } finally {
    db.close();
  }
}
/** Remove only unreferenced blobs older than five minutes, preserving active drafts. */
export async function cleanupUnusedCommunityImages(
  usedRefs: string[],
): Promise<number> {
  const db = await openDatabase();
  let removed = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      const store = tx.objectStore("images");
      const r = store.getAll();
      r.onsuccess = () => {
        (r.result as StoredImage[])
          .filter(
            (i) =>
              !usedRefs.includes(`idb:${i.id}`) &&
              Date.now() - new Date(i.createdAt).getTime() > 5 * 60000,
          )
          .forEach((i) => {
            store.delete(i.id);
            removed++;
          });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("图片清理失败"));
    });
    return removed;
  } finally {
    db.close();
  }
}
