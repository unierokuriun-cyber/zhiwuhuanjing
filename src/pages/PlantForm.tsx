import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Leaf, Upload, Plus } from "lucide-react";
import { useGarden } from "../store/garden";
import { species, stages, goals } from "../mock/species";
import type { PlantDraft } from "../types";
import { PlantImage } from "../components/common/PlantImage";
import { getStorageError } from "../store/storage";
export function PlantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plant = useGarden((s) => s.plants.find((p) => p.id === id));
  const add = useGarden((s) => s.addPlant);
  const edit = useGarden((s) => s.editPlant);
  const [draft, setDraft] = useState<PlantDraft>(
    plant
      ? {
          speciesId: plant.speciesId,
          nickname: plant.nickname,
          category: plant.category,
          location: plant.location,
          stage: plant.stage,
          goal: plant.goal,
          image: plant.image,
        }
      : {
          speciesId: "monstera",
          nickname: "",
          category: "观赏性",
          location: "客厅",
          stage: "生长期",
          goal: "保持健康",
          image: species[0].image,
        },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const submissionId = useRef(crypto.randomUUID());
  const update = <K extends keyof PlantDraft>(key: K, value: PlantDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("请选择 JPG、PNG 或 WebP 图片。");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("图片不能超过 5MB。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas
        .getContext("2d")!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg", 0.8);
      bitmap.close();
      if (image.length > 256 * 1024) {
        setError("压缩后的图片仍过大，请选择较小的图片（保存上限 256KB）。");
        return;
      }
      update("image", image);
    } catch {
      setError("图片无法读取，请选择另一张。");
    } finally {
      setBusy(false);
    }
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current || busy) return;
    if (!draft.nickname.trim()) {
      setError("请为植物取一个昵称。");
      return;
    }
    lock.current = true;
    setBusy(true);
    const clean = { ...draft, nickname: draft.nickname.trim() };
    try {
      if (id) edit(id, clean);
      else add(clean, submissionId.current);
      if (getStorageError()) {
        setError(getStorageError()!);
        lock.current = false;
        setBusy(false);
        return;
      }
      navigate("/garden", {
        state: { message: id ? "植物档案已更新" : "新植物已加入你的花园" },
      });
    } catch {
      setError("保存失败，请重试。");
      lock.current = false;
      setBusy(false);
    }
  }
  if (id && !plant)
    return (
      <div className="empty-state">
        <Leaf />
        <h1>没有找到这株植物</h1>
        <Link className="button" to="/garden">
          返回花园
        </Link>
      </div>
    );
  return (
    <div className="plant-management">
      <Link
        className="text-link back-link"
        to={id ? `/plants/${id}` : "/garden"}
      >
        <ArrowLeft size={18} /> {id ? "返回植物详情" : "回到我的花园"}
      </Link>
      <span className="eyebrow">A NEW LITTLE STORY</span>
      <h1>{id ? "编辑植物档案" : "让花园，多一点绿意"}</h1>
      <p className="management-subtitle">
        为它取个名字，一起开始新的生长故事。
      </p>
      <form className="plant-form" onSubmit={save}>
        <section className="form-photo">
          <PlantImage src={draft.image} alt="植物图片预览" />
          <div className="photo-controls">
            <label className="button secondary-button">
              <Upload size={16} /> 选择本地图片
              <input
                aria-label="选择植物图片"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              className="text-link"
              onClick={() =>
                update(
                  "image",
                  species.find((s) => s.id === draft.speciesId)!.image,
                )
              }
            >
              使用默认图片
            </button>
          </div>
          <p>
            图片仅保存在当前浏览器 · 最大
            5MB；三角梅、小番茄、薄荷的默认图为通用花园摄影
          </p>
        </section>
        <section className="form-fields">
          <h2>
            <Leaf size={18} /> 植物的小档案
          </h2>
          <label>
            植物品种
            <select
              value={draft.speciesId}
              onChange={(e) => {
                const s = species.find((s) => s.id === e.target.value)!;
                setDraft((d) => ({
                  ...d,
                  speciesId: s.id,
                  image: s.image,
                  category: s.category,
                }));
              }}
            >
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            植物昵称
            <input
              maxLength={24}
              placeholder="比如：小森"
              value={draft.nickname}
              onChange={(e) => update("nickname", e.target.value)}
              required
            />
          </label>
          <div className="form-grid">
            <label>
              植物分类
              <select
                value={draft.category}
                onChange={(e) =>
                  update("category", e.target.value as PlantDraft["category"])
                }
              >
                <option>观赏性</option>
                <option>实用性</option>
              </select>
            </label>
            <label>
              种植环境
              <select
                value={draft.location}
                onChange={(e) =>
                  update("location", e.target.value as PlantDraft["location"])
                }
              >
                {["客厅", "阳台", "书房", "庭院", "室内"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              生长阶段
              <select
                value={draft.stage}
                onChange={(e) => update("stage", e.target.value)}
              >
                {stages.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              主要养护目标
              <select
                value={draft.goal}
                onChange={(e) => update("goal", e.target.value)}
              >
                {goals.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="button save-button">
            {id ? <Check size={18} /> : <Plus size={18} />}{" "}
            {busy ? "正在处理…" : id ? "保存修改" : "保存植物档案"}
          </button>
          <p className="form-note">
            每株植物都有独立档案，同一品种也可以多次添加。
          </p>
        </section>
      </form>
    </div>
  );
}
