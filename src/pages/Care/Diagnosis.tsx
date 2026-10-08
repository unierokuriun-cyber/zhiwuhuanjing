import { useRef, useState } from "react";
import {
  CarePage,
  PlantSelect,
  NoPlants,
  Loading,
} from "../../components/care/Shared";
import { PhotoUpload } from "../../components/care/PhotoUpload";
import { useGarden } from "../../store/garden";
import { careService } from "../../services/care";
import { getStorageError } from "../../store/storage";
export function Diagnosis() {
  const plants = useGarden((s) => s.plants);
  const save = useGarden((s) => s.addObservation);
  const [id, setId] = useState(plants[0]?.id || "");
  const [photo, setPhoto] = useState("");
  const [symptom, setSymptom] = useState("叶片发黄");
  const [environment, setEnvironment] = useState("");
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof careService.diagnose>
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const token = useRef("");
  const snapshot = useRef({ id: "", symptom: "", environment: "" });
  function reset() {
    setResult(null);
    setSaved(false);
  }
  async function run() {
    setBusy(true);
    setError("");
    snapshot.current = { id, symptom, environment };
    try {
      setResult(await careService.diagnose(symptom, environment));
      token.current = crypto.randomUUID();
      setSaved(false);
    } catch {
      setError("演示分析失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  function record() {
    if (!result || saved) return;
    const s = snapshot.current;
    save(
      s.id,
      `观察记录：${s.symptom}。环境：${s.environment || "未补充"}。演示可能原因：${result.cause}`,
      token.current,
    );
    if (getStorageError()) setError(getStorageError()!);
    else setSaved(true);
  }
  return (
    <CarePage
      title="病虫害辅助观察"
      subtitle="记录异常，再慢慢找到需要进一步检查的方向。"
    >
      {!plants.length ? (
        <NoPlants />
      ) : (
        <>
          <div className="diagnosis-warning">
            当前为演示分析，不构成确定诊断。不会分析照片，不提供农药使用方案。
          </div>
          <div className="care-two-columns">
            <section className="care-card">
              <PlantSelect
                disabled={busy}
                value={id}
                onChange={(v) => {
                  setId(v);
                  reset();
                }}
              />
              <PhotoUpload
                value={photo}
                disabled={busy}
                onChange={(v) => {
                  setPhoto(v);
                  reset();
                }}
              />
              <fieldset disabled={busy} className="diagnosis-fields">
                <label>
                  异常症状
                  <select
                    value={symptom}
                    onChange={(e) => {
                      setSymptom(e.target.value);
                      reset();
                    }}
                  >
                    {[
                      "叶片发黄",
                      "叶片黑斑",
                      "叶片卷曲",
                      "叶片萎蔫",
                      "虫洞",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  补充养护环境
                  <textarea
                    maxLength={300}
                    value={environment}
                    placeholder="例如：阳台、盆土较湿、近期换盆"
                    onChange={(e) => {
                      setEnvironment(e.target.value);
                      reset();
                    }}
                  />
                </label>
              </fieldset>
              <button
                className="button save-button"
                disabled={!photo || busy}
                onClick={() => void run()}
              >
                {busy ? "演示分析中…" : "开始模拟分析"}
              </button>
            </section>
            <section className="care-card">
              <h2>观察与下一步</h2>
              {busy ? (
                <Loading />
              ) : result ? (
                <>
                  <article className="diagnosis-result">
                    <h3>可能原因</h3>
                    <p>{result.cause}</p>
                    <h3>进一步检查</h3>
                    <p>{result.check}</p>
                    <h3>处理建议</h3>
                    <p>{result.action}</p>
                  </article>
                  <button
                    className="button save-button"
                    disabled={saved}
                    onClick={record}
                  >
                    {saved ? "观察记录已保存" : "保存观察记录"}
                  </button>
                  <p className="form-note">
                    保存文字观察到关联植物的历史，不保存诊断照片，不发放养护经验。
                  </p>
                </>
              ) : (
                <p className="care-empty">补充照片和症状，体验模拟观察流程。</p>
              )}
              {saved && (
                <p role="status" className="success-message">
                  已保存，可在植物详情查看。
                </p>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </CarePage>
  );
}
