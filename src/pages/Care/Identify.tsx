import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ScanLine } from "lucide-react";
import { CarePage, Loading } from "../../components/care/Shared";
import { PhotoUpload } from "../../components/care/PhotoUpload";
import { careService } from "../../services/care";
import { species } from "../../mock/species";
import { useGarden } from "../../store/garden";
import { getStorageError } from "../../store/storage";
export function Identify() {
  const [photo, setPhoto] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; confidence: number }[]>(
    [],
  );
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const add = useGarden((s) => s.addPlant);
  const navigate = useNavigate();
  const submission = useRef(crypto.randomUUID());
  const lock = useRef(false);
  async function run() {
    setBusy(true);
    setError("");
    setResults([]);
    try {
      setResults(await careService.identify());
      setSelected("");
    } catch {
      setError("演示服务暂时失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  function create() {
    if (lock.current || !selected) return;
    lock.current = true;
    const s = species.find((s) => s.id === selected)!;
    add(
      {
        speciesId: s.id,
        nickname: s.name,
        category: s.category,
        location: "阳台",
        stage: "生长期",
        goal: s.category === "实用性" ? "保持健康" : "观赏枝叶",
        image: photo,
      },
      submission.current,
    );
    if (getStorageError()) {
      setError(getStorageError()!);
      lock.current = false;
      return;
    }
    navigate("/garden");
  }
  return (
    <CarePage
      title="认识你的植物"
      subtitle="上传照片体验流程，再由你确认它的名字。"
    >
      <div className="care-two-columns">
        <section className="care-card">
          <PhotoUpload
            value={photo}
            disabled={busy}
            onChange={(p) => {
              setPhoto(p);
              setResults([]);
              setSelected("");
              submission.current = crypto.randomUUID();
              lock.current = false;
            }}
          />
          <p className="form-note">
            结果为固定演示候选，与照片内容无关；置信度也为模拟数值。
          </p>
          <button
            className="button save-button"
            disabled={!photo || busy}
            onClick={() => void run()}
          >
            <ScanLine size={17} />
            {busy ? "演示识别中…" : "开始模拟识别"}
          </button>
        </section>
        <section className="care-card">
          <h2>候选植物</h2>
          {busy ? (
            <Loading />
          ) : results.length ? (
            <>
              <p className="form-note">请手动确认。以下不是图像识别结论。</p>
              <div className="candidate-list">
                {results.map((r) => (
                  <button
                    key={r.id}
                    className={selected === r.id ? "selected" : ""}
                    aria-pressed={selected === r.id}
                    onClick={() => setSelected(r.id)}
                  >
                    <span>
                      <strong>
                        {species.find((s) => s.id === r.id)!.name}
                      </strong>
                      <small>模拟置信度 · {r.confidence}%</small>
                    </span>
                    {selected === r.id && <Check size={20} />}
                  </button>
                ))}
              </div>
              <button
                className="button save-button"
                disabled={!selected}
                onClick={create}
              >
                确认结果并创建档案
              </button>
              <p className="form-note">
                以你上传的照片建档，默认阳台 / 生长期；可随后编辑。
              </p>
            </>
          ) : (
            <p className="care-empty">
              上传照片并开始演示后，候选会出现在这里。
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    </CarePage>
  );
}
