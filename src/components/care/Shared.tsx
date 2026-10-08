import { Link } from "react-router-dom";
import { ArrowLeft, Leaf } from "lucide-react";
import { useGarden } from "../../store/garden";
import { useEffect, useState, type ReactNode } from "react";
import { getStorageError } from "../../store/storage";
export function CarePage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [error, setError] = useState(getStorageError);
  useEffect(() => {
    const update = () => setError(getStorageError());
    window.addEventListener("garden-storage-error", update);
    return () => window.removeEventListener("garden-storage-error", update);
  }, []);
  return (
    <div className="care-page">
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <Link to="/care" className="text-link back-link">
        <ArrowLeft size={17} /> 智能养护
      </Link>
      <span className="eyebrow">A LITTLE CARE, EVERY DAY</span>
      <h1>{title}</h1>
      <p className="management-subtitle">{subtitle}</p>
      <div className="simulation-note">
        <Leaf size={16} /> 演示模式 · 未连接真实 AI、天气或传感器服务
      </div>
      {children}
    </div>
  );
}
export function PlantSelect({
  value,
  onChange,
  all = false,
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  all?: boolean;
  disabled?: boolean;
}) {
  const plants = useGarden((s) => s.plants);
  return (
    <label className="plant-select">
      关联植物
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {all && <option value="">全部植物</option>}
        {!plants.length && !all && <option value="">暂无植物</option>}
        {plants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nickname} · {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Loading({ text = "正在生成演示结果…" }: { text?: string }) {
  return (
    <div className="mock-loading" role="status">
      <div className="skeleton" />
      <div className="skeleton" />
      <p>{text}</p>
    </div>
  );
}
export function NoPlants() {
  return (
    <div className="empty-state">
      <Leaf />
      <h2>先为花园添加一株植物</h2>
      <p>建议和问答会关联你的植物档案。</p>
      <Link className="button" to="/plants/add">
        添加植物
      </Link>
    </div>
  );
}
