import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Cable,
  ShieldCheck,
  Download,
  Bell,
  Leaf,
} from "lucide-react";
import { usePreferences } from "../store/preferences";
import { useGarden } from "../store/garden";
import { useCommunity } from "../store/community";
import { blockedStorageKeys, recoverStorage } from "../store/storage";
function downloadBackup() {
  const data: Record<string, string | null> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (key.startsWith("plant-companion-"))
      data[key] = localStorage.getItem(key);
  }
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            data,
            note: "仅本浏览器文本记录；社区图片存于 IndexedDB，不包含在此备份中。",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "plant-companion-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Account() {
  const section = useLocation().pathname.split("/").pop();
  const preferences = usePreferences();
  const plants = useGarden((s) => s.plants);
  const [name, setName] = useState(preferences.name);
  const [bio, setBio] = useState(preferences.bio);
  const [feedback, setFeedback] = useState("");
  const [recover, setRecover] = useState(false);
  const keys = blockedStorageKeys();
  const title =
    section === "edit"
      ? "个人资料"
      : section === "devices"
        ? "设备管理"
        : "消息与隐私设置";
  return (
    <div className="account-page">
      <Link className="text-link back-link" to="/profile">
        <ArrowLeft size={18} />
        返回我的
      </Link>
      <span className="eyebrow">YOUR PLANT LIFE</span>
      <h1>{title}</h1>
      <p className="form-note">
        本地演示身份 · 不提供真实账号、云同步或硬件连接
      </p>
      {section === "edit" ? (
        <form
          className="care-card account-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setFeedback("请输入昵称。");
              return;
            }
            preferences.update({ name: name.trim(), bio: bio.trim() });
            setFeedback("资料已更新；保存状态如有异常将显示提示。");
          }}
        >
          <UserRound />
          <label>
            用户昵称
            <input
              value={name}
              maxLength={24}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            个人介绍
            <textarea
              value={bio}
              maxLength={120}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>
          <button className="button" type="submit">
            保存资料
          </button>
        </form>
      ) : section === "devices" ? (
        <section className="care-card">
          <Cable size={32} />
          <h2>先从观察植物开始</h2>
          <p>
            当前没有连接真实设备。温度、湿度与光照均为演示数据，不作为自动浇水依据。
          </p>
          <div className="device-list">
            {plants.map((p) => (
              <Link key={p.id} to={`/plants/${p.id}`}>
                <Leaf size={20} />
                <span>
                  {p.nickname}
                  <small>{p.name} · 未连接设备</small>
                </span>
                <span className="post-type-badge">演示</span>
              </Link>
            ))}
          </div>
          {!plants.length && (
            <p>还没有植物，添加档案后可以查看环境数据说明。</p>
          )}
          <Link className="button secondary-button" to="/plants/add">
            添加植物
          </Link>
        </section>
      ) : (
        <>
          <section className="care-card">
            <Bell />
            <h2>页面内养护提醒</h2>
            <label className="setting-toggle">
              <span>
                显示花园待办提醒<small>仅控制页面提醒，不发送系统推送</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.reminders}
                onChange={(e) =>
                  preferences.update({ reminders: e.target.checked })
                }
              />
            </label>
          </section>
          <section className="care-card">
            <ShieldCheck />
            <h2>你的数据留在当前浏览器</h2>
            <p>
              植物档案、聊天、帖子与互动保存在本地；社区图片存于容量受控的
              IndexedDB。清除浏览器数据、使用其他浏览器或更换设备后无法自动恢复。当前没有后端登录、多人共享或权限校验。
            </p>
            <p>
              上传图片仅在本地预览与保存，模拟分析不会发送至 AI
              服务。请避免记录敏感个人信息。
            </p>
            <button
              className="button secondary-button"
              onClick={() => {
                try {
                  downloadBackup();
                  setFeedback(
                    "文本备份已生成；请妥善保管，图片不包含在备份中。",
                  );
                } catch {
                  setFeedback("无法读取备份，请检查浏览器存储权限。");
                }
              }}
            >
              <Download size={18} />
              导出本地文本备份
            </button>
          </section>
          {keys.length > 0 && (
            <section className="care-card">
              <h2>受保护的异常数据</h2>
              <p>
                原记录已暂停覆盖。可以先导出备份，再将当前可用的演示数据保存为新记录。恢复时仍会在本浏览器保留原始备份。
              </p>
              <button className="button" onClick={() => setRecover(true)}>
                恢复当前可用数据
              </button>
            </section>
          )}
          <p className="form-note">植伴 v0.6.0 · 本地验收版本</p>
        </>
      )}
      {feedback && <p role="status">{feedback}</p>}
      {recover && (
        <div className="modal-backdrop">
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recover-title"
          >
            <h2 id="recover-title">确认恢复当前数据？</h2>
            <p>
              请先导出备份。此操作会将当前演示数据保存为新记录，并保留原始异常记录的浏览器备份，不会自动修复其中的内容。
            </p>
            <div className="dialog-actions">
              <button
                className="button secondary-button"
                onClick={() => setRecover(false)}
              >
                取消
              </button>
              <button
                className="button"
                onClick={() => {
                  let ok = true;
                  for (const key of keys) {
                    let state: object;
                    let version = 1;
                    if (key.includes("garden")) {
                      const {
                        plants,
                        tasks,
                        records,
                        messages,
                        companionMessages,
                        companionEvents,
                      } = useGarden.getState();
                      state = {
                        plants,
                        tasks,
                        records,
                        messages,
                        companionMessages,
                        companionEvents,
                      };
                      version = 4;
                    } else if (key.includes("community")) {
                      const {
                        userPosts,
                        comments,
                        followed,
                        liked,
                        favorites,
                        searchHistory,
                      } = useCommunity.getState();
                      state = {
                        userPosts,
                        comments,
                        followed,
                        liked,
                        favorites,
                        searchHistory,
                      };
                    } else {
                      const { name, bio, reminders } =
                        usePreferences.getState();
                      state = { name, bio, reminders };
                    }
                    ok =
                      recoverStorage(key, JSON.stringify({ state, version })) &&
                      ok;
                  }
                  setRecover(false);
                  setFeedback(
                    ok
                      ? "恢复成功，原始异常记录已备份。"
                      : "恢复未完成，原始数据保留。",
                  );
                }}
              >
                确认恢复
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
