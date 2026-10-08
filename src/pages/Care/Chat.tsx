import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import {
  CarePage,
  PlantSelect,
  NoPlants,
  Loading,
} from "../../components/care/Shared";
import { useGarden } from "../../store/garden";
import { careService } from "../../services/care";
const questions = [
  "我的三角梅为什么不开花？",
  "小番茄叶子发黄怎么办？",
  "龟背竹需要多少光照？",
  "薄荷应该多久检查一次盆土？",
];
export function Chat() {
  const plants = useGarden((s) => s.plants);
  const records = useGarden((s) => s.records);
  const messages = useGarden((s) => s.messages);
  const add = useGarden((s) => s.addMessage);
  const [id, setId] = useState(plants[0]?.id || "");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const p = plants.find((p) => p.id === id);
  const history = messages.filter((m) => m.plantId === id);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);
  async function send(text = input) {
    const q = text.trim();
    if (!p || !q || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setInput("");
    const plant = p;
    add({
      id: crypto.randomUUID(),
      plantId: id,
      role: "user",
      text: q,
      at: new Date().toISOString(),
    });
    try {
      const reply = await careService.chat(q, plant, records);
      add({
        id: crypto.randomUUID(),
        plantId: plant.id,
        role: "assistant",
        text: reply,
        at: new Date().toISOString(),
      });
    } catch {
      if (alive.current) {
        setError("模拟回复失败，请重试。");
        setInput(q);
      }
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <CarePage
      title="植物养护问答"
      subtitle="关联一株植物，让建议有自己的生长背景。"
    >
      {!p ? (
        <NoPlants />
      ) : (
        <>
          <PlantSelect disabled={busy} value={id} onChange={setId} />
          <div className="chat-card">
            <div className="chat-heading">
              <MessageCircle size={22} />
              <div>
                <h2>{p.nickname}的养护助手</h2>
                <p>规则生成的模拟回复 · 历史保存在本地</p>
              </div>
            </div>
            <div
              className="chat-messages"
              aria-label="聊天历史"
              role="log"
              aria-live="polite"
            >
              {!history.length && (
                <div className="care-empty">
                  <MessageCircle size={32} />
                  <p>
                    从一个小问题开始。回复会参考所选植物的阶段、目标与记录。
                  </p>
                </div>
              )}
              {history.map((m) => (
                <article className={`chat-message ${m.role}`} key={m.id}>
                  <span>{m.role === "user" ? "你" : "植伴 · 模拟"}</span>
                  <p>{m.text}</p>
                </article>
              ))}
              {busy && <Loading text="正在生成规则演示回复…" />}
              <div ref={end} />
            </div>
            <div className="quick-questions">
              {questions.map((q) => (
                <button
                  key={q}
                  disabled={busy}
                  onClick={() => {
                    const target = plants.find((p) => q.includes(p.name));
                    if (target && target.id !== id) {
                      setId(target.id);
                      setInput(q);
                    } else void send(q);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="form-note">
              快捷问题提到其他物种时，先选对应档案；回复始终以当前关联植物为准。
            </p>
            <form
              className="chat-composer"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                aria-label="输入养护问题"
                value={input}
                maxLength={500}
                placeholder="比如：这几天叶子有点发黄…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <button
                className="button"
                aria-label="发送问题"
                disabled={busy || !input.trim()}
              >
                <Send size={20} />
              </button>
            </form>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </>
      )}
    </CarePage>
  );
}
