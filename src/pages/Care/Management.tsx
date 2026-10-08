import { useState } from "react";
import { Link } from "react-router-dom";
import { CarePage, PlantSelect, NoPlants } from "../../components/care/Shared";
import { useGarden } from "../../store/garden";
import { adviceFor } from "../../services/care";
const names: Record<string, string> = {
  watering: "浇水管理",
  fertilizing: "施肥管理",
  pruning: "修剪指导",
};
export function Management({ kind }: { kind: string }) {
  const plants = useGarden((s) => s.plants);
  const records = useGarden((s) => s.records);
  const [id, setId] = useState(plants[0]?.id || "");
  const p = plants.find((p) => p.id === id);
  const a = p ? adviceFor(p, records) : null;
  return (
    <CarePage
      title={names[kind] || "个性化养护"}
      subtitle="建议依据档案生成，实际操作前请先观察植物。"
    >
      {!p ? (
        <NoPlants />
      ) : (
        <>
          <PlantSelect value={id} onChange={setId} />
          <div className="care-two-columns">
            <section className="care-card">
              <h2>{p.nickname}的照顾方式</h2>
              <p className="management-subtitle">
                {p.name} · {p.stage} · {p.goal}
              </p>
              <p className="management-advice">
                {kind === "watering"
                  ? a!.water
                  : kind === "fertilizing"
                    ? a!.fertilize
                    : a!.prune}
              </p>
              <p className="management-advice">{a!.stage}</p>
              <p className="management-advice">{a!.weather}</p>
              <Link className="button" to={`/plants/${p.id}`}>
                打开档案并记录养护
              </Link>
            </section>
            <section className="care-card">
              <h2>最近的养护与观察</h2>
              {records
                .filter((r) => r.plantId === id)
                .slice(0, 5)
                .map((r) => (
                  <article className="history-entry" key={r.id}>
                    <div>
                      <h3>{r.text}</h3>
                      <time>{new Date(r.at).toLocaleString("zh-CN")}</time>
                    </div>
                  </article>
                ))}
              {!records.some((r) => r.plantId === id) && (
                <p className="care-empty">
                  还没有记录。先观察实际状态，再决定是否操作。
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </CarePage>
  );
}
