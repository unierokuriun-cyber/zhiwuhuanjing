import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Camera, Eye, X } from "lucide-react";
import { useGarden } from "../../store/garden";
import { communityService, channelForSpecies } from "../../services/community";
import {
  saveCommunityImages,
  removeCommunityImages,
} from "../../services/communityImages";
import { useCommunityQuery } from "../../hooks/useCommunityQuery";
import {
  CommunityPage,
  QueryState,
  PostTypeBadge,
} from "../../components/community/Shared";
import { postTypes, type PostType } from "../../types/community";
export function CreatePost() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plants = useGarden((s) => s.plants);
  const records = useGarden((s) => s.records);
  const record = records.find(
    (r) => r.id === params.get("record") && r.kind === "growth",
  );
  const sourcePlant = plants.find(
    (p) => p.id === (record?.plantId || params.get("plant")),
  );
  const channels = useCommunityQuery("create-channels", () =>
    communityService.getChannels(),
  );
  const [channelId, setChannelId] = useState(
    params.get("channel") ||
      channelForSpecies(sourcePlant?.speciesId || "")?.channelId ||
      "monstera",
  );
  const [type, setType] = useState<PostType>(record ? "成长分享" : "日常交流");
  const [plantId, setPlantId] = useState(sourcePlant?.id || "");
  const [title, setTitle] = useState(
    record ? `${sourcePlant?.nickname || "植物"}的成长日记` : "",
  );
  const [content, setContent] = useState(record ? record.text : "");
  const [tags, setTags] = useState(sourcePlant?.name || "");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const submissionId = useRef(crypto.randomUUID());
  const channel = channels.data?.find((c) => c.channelId === channelId);
  const matching = plants.filter((p) =>
    channel?.plantSpeciesIds.includes(p.speciesId),
  );
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  function validate() {
    if (!title.trim() || !content.trim()) {
      setError("请填写帖子标题与正文");
      return false;
    }
    if (plantId && !matching.some((p) => p.id === plantId)) {
      setError("关联植物与频道不匹配，请重新选择");
      return false;
    }
    setError("");
    return true;
  }
  async function publish() {
    if (lock.current || !validate()) return;
    lock.current = true;
    setBusy(true);
    let refs: string[] = [];
    try {
      refs = await saveCommunityImages(files);
      const post = await communityService.createPost(
        {
          channelId,
          postType: type,
          title,
          content,
          tags: tags.split(/[,，\s]+/).filter(Boolean),
          plantProfileId: plantId || undefined,
          sourceRecordId: record?.plantId === plantId ? record.id : undefined,
          images: refs,
        },
        submissionId.current,
      );
      navigate(`/community/posts/${post.postId}?published=1`);
    } catch (e) {
      try {
        await removeCommunityImages(refs);
      } catch {
        /* Retained blobs stay within the quota; cleanup is available in profile. */
      }
      setError((e as Error).message);
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <CommunityPage title="写下你的植物故事">
      <Link className="text-link back-link" to="/community">
        回到社区
      </Link>
      <QueryState {...channels} />
      {!channels.loading && !channels.error && (
        <div className="create-post-layout">
          <form
            className="create-post-form"
            onSubmit={(e) => {
              e.preventDefault();
              void publish();
            }}
          >
            <fieldset disabled={busy}>
              <legend>本地演示用户 · 无需登录真实账号</legend>
              <div className="create-form-grid">
                <label>
                  帖子类型
                  <select
                    aria-label="帖子类型"
                    value={type}
                    onChange={(e) => setType(e.target.value as PostType)}
                  >
                    {postTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label>
                  植物频道
                  <select
                    aria-label="植物频道"
                    value={channelId}
                    onChange={(e) => {
                      setChannelId(e.target.value);
                      setPlantId("");
                      setPreview(false);
                    }}
                  >
                    {channels.data?.map((c) => (
                      <option value={c.channelId} key={c.channelId}>
                        {c.name} · {c.category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                关联我的植物
                <select
                  aria-label="关联我的植物"
                  value={plantId}
                  onChange={(e) => {
                    setPlantId(e.target.value);
                    setPreview(false);
                  }}
                >
                  <option value="">不关联档案</option>
                  {matching.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.nickname} · {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="form-note">
                只列出与频道物种匹配的档案。频道属于物种，帖子可关联你的一株植物。
              </p>
              <label>
                帖子标题
                <input
                  aria-label="帖子标题"
                  maxLength={60}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setPreview(false);
                  }}
                  placeholder="给今天的绿意起个标题"
                />
              </label>
              <label>
                帖子正文
                <textarea
                  aria-label="帖子正文"
                  maxLength={5000}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setPreview(false);
                  }}
                  placeholder="分享观察、提出问题，或记录一点成长…"
                />
              </label>
              {record && (
                <p className="form-note">
                  已从成长记录填入草稿，仅在点击发布后分享到本地社区。
                </p>
              )}
              <label>
                植物标签
                <input
                  aria-label="植物标签"
                  value={tags}
                  maxLength={100}
                  onChange={(e) => {
                    setTags(e.target.value);
                    setPreview(false);
                  }}
                  placeholder="用逗号或空格分隔，最多 5 个"
                />
              </label>
              <div className="community-upload">
                <Camera size={28} />
                <h3>给故事留一张照片</h3>
                <p>
                  最多 3 张，每张原图不超过 5MB；压缩后保存到本地 IndexedDB。
                </p>
                <label className="button secondary-button">
                  选择帖子图片
                  <input
                    aria-label="选择帖子图片"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const list = [...(e.target.files || [])];
                      if (
                        list.length > 3 ||
                        list.some(
                          (f) =>
                            !["image/jpeg", "image/png", "image/webp"].includes(
                              f.type,
                            ) || f.size > 5 * 1024 * 1024,
                        )
                      ) {
                        setError(
                          "最多选择 3 张不超过 5MB 的 JPG、PNG 或 WebP 图片",
                        );
                        return;
                      }
                      setFiles(list);
                      setPreview(false);
                      setError("");
                    }}
                  />
                </label>
              </div>
              <div className="draft-images">
                {previews.map((url, i) => (
                  <div key={url}>
                    <img src={url} alt={`发帖图片预览 ${i + 1}`} />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`移除图片 ${i + 1}`}
                      onClick={() =>
                        setFiles((f) => f.filter((_, n) => n !== i))
                      }
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="form-note">
                图片库最多 40 张或 20MB，单张压缩后最多 1MB；localStorage
                只存图片引用。
              </p>
              <div className="create-post-actions">
                <button
                  type="button"
                  className="button secondary-button"
                  onClick={() => {
                    if (validate()) setPreview(true);
                  }}
                >
                  <Eye size={17} />
                  预览内容
                </button>
                <button className="button" disabled={busy}>
                  {busy ? "保存并发布中…" : "发布帖子"}
                </button>
              </div>
            </fieldset>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
          </form>
          <aside className="create-post-preview">
            {preview ? (
              <article>
                <span className="eyebrow">草稿预览 · 尚未发布</span>
                <PostTypeBadge type={type} />
                <h2>{title}</h2>
                <p className="form-note">本地演示用户 · {channel?.name}频道</p>
                {previews.map((url, i) => (
                  <img key={url} src={url} alt={`草稿照片 ${i + 1}`} />
                ))}
                <div className="post-content">{content}</div>
                <div className="post-tags">
                  {tags
                    .split(/[,，\s]+/)
                    .filter(Boolean)
                    .slice(0, 5)
                    .map((t, i) => (
                      <span key={`${t}-${i}`}>#{t}</span>
                    ))}
                </div>
              </article>
            ) : (
              <div className="care-empty">
                <Eye size={30} />
                <h3>先看看故事的样子</h3>
                <p>填写内容后点击预览，再选择发布。</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </CommunityPage>
  );
}
