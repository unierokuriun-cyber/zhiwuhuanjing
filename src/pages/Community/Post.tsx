import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { communityService, communityAuthor } from "../../services/community";
import { useCommunityQuery } from "../../hooks/useCommunityQuery";
import { useGarden } from "../../store/garden";
import {
  CommunityPage,
  PostImageGrid,
  PostTypeBadge,
  PostActions,
  PostFeed,
  QueryState,
} from "../../components/community/Shared";
import { demoUserId } from "../../types/community";
export function PostPage() {
  const [params] = useSearchParams();
  const { postId = "" } = useParams();
  const post = useCommunityQuery(`post:${postId}`, () =>
    communityService.getPostById(postId),
  );
  const comments = useCommunityQuery(`comments:${postId}`, () =>
    communityService.getComments(postId),
  );
  const channel = useCommunityQuery(`postchannel:${post.data?.channelId}`, () =>
    communityService.getChannelById(post.data?.channelId || ""),
  );
  const related = useCommunityQuery(`related:${post.data?.channelId}`, () =>
    communityService.getPosts({ channelId: post.data?.channelId }),
  );
  const [text, setText] = useState("");
  const [sort, setSort] = useState("latest");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [deleteId, setDeleteId] = useState("");
  const plants = useGarden((s) => s.plants);
  const p = post.data;
  const plant = plants.find((v) => v.id === p?.plantProfileId);
  async function comment() {
    if (lock.current || !text.trim()) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await communityService.createComment(postId, text, crypto.randomUUID());
      setText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <CommunityPage title="植物故事">
      <Link className="text-link back-link" to="/community">
        回到植物社区
      </Link>
      {params.get("published") === "1" && p?.source === "local" && (
        <p role="status" className="success-message">
          发布成功，帖子已保存在当前浏览器。
        </p>
      )}
      <QueryState {...post} />
      {!post.loading &&
        !post.error &&
        (p ? (
          <div className="post-detail-layout">
            <article className="post-detail">
              <PostTypeBadge type={p.postType} />
              <h2>{p.title}</h2>
              <div className="post-author">
                <span className="community-avatar">
                  {communityAuthor(p.authorId)[0]}
                </span>
                <div>
                  <strong>{communityAuthor(p.authorId)}</strong>
                  <time dateTime={p.createdAt}>
                    {new Date(p.createdAt).toLocaleString("zh-CN")}
                  </time>
                </div>
              </div>
              {p.images.length > 0 && (
                <PostImageGrid images={p.images} title={p.title} />
              )}
              <p className="form-note">
                {p.source === "demo"
                  ? "示例帖子 · 部分图片为通用植物摄影，不是作者的真实植株记录。"
                  : "本地发布 · 仅在当前浏览器可见。"}
              </p>
              <div className="post-content">{p.content}</div>
              <div className="post-tags">
                {p.tags.map((t) => (
                  <Link
                    to={`/community/search?q=${encodeURIComponent(t)}`}
                    key={t}
                  >
                    #{t}
                  </Link>
                ))}
              </div>
              <div className="post-context-links">
                <Link
                  className="text-link"
                  to={`/community/channels/${p.channelId}`}
                >
                  {channel.data?.name || "植物"}频道
                </Link>
                {plant && (
                  <Link className="text-link" to={`/plants/${plant.id}`}>
                    {plant.nickname}的植物档案
                  </Link>
                )}
                <Link className="text-link" to="/care">
                  返回智能养护
                </Link>
              </div>
              <PostActions post={p} />
              <section id="post-comments" className="comment-panel">
                <div className="section-heading">
                  <h2>评论 · {p.commentCount}</h2>
                  <label>
                    评论排序
                    <select
                      aria-label="评论排序"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="latest">最新优先</option>
                      <option value="oldest">最早优先</option>
                    </select>
                  </label>
                </div>
                <QueryState {...comments} />
                {!comments.loading &&
                  !comments.error &&
                  (comments.data?.length ? (
                    (sort === "latest"
                      ? comments.data.slice().reverse()
                      : comments.data
                    ).map((c) => (
                      <article className="community-comment" key={c.commentId}>
                        <div>
                          <strong>{communityAuthor(c.authorId)}</strong>
                          <time>
                            {new Date(c.createdAt).toLocaleString("zh-CN")}
                          </time>
                          <p>{c.content}</p>
                        </div>
                        {c.authorId === demoUserId && (
                          <button
                            className="icon-button"
                            aria-label="删除我的评论"
                            onClick={() => setDeleteId(c.commentId)}
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </article>
                    ))
                  ) : (
                    <p className="form-note">还没有评论，留下你的观察吧。</p>
                  ))}
                <form
                  className="comment-composer"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void comment();
                  }}
                >
                  <label>
                    以本地演示用户评论
                    <textarea
                      aria-label="评论内容"
                      value={text}
                      maxLength={500}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="分享观察与经验，友善地交流…"
                    />
                  </label>
                  <button className="button" disabled={busy || !text.trim()}>
                    {busy ? "保存中…" : "发布评论"}
                  </button>
                </form>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
              </section>
            </article>
            <aside className="post-related">
              <h2>继续发现</h2>
              <QueryState {...related} />
              {!related.loading && !related.error && (
                <PostFeed
                  posts={(related.data || [])
                    .filter((v) => v.postId !== postId)
                    .slice(0, 3)}
                />
              )}
            </aside>
          </div>
        ) : (
          <div className="care-empty">
            <h2>帖子不存在</h2>
            <Link to="/community">返回社区</Link>
          </div>
        ))}
      {deleteId && (
        <div className="modal-backdrop">
          <section
            className="care-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="删除评论确认"
            onKeyDown={(e) => {
              if (e.key === "Escape") setDeleteId("");
            }}
          >
            <h2>删除这条本地评论？</h2>
            <p>仅删除你在本浏览器发布的评论。</p>
            <button
              className="button secondary-button"
              onClick={() => setDeleteId("")}
            >
              取消
            </button>
            <button
              className="button"
              autoFocus
              onClick={() => {
                void communityService
                  .deleteComment(deleteId)
                  .then(() => setDeleteId(""))
                  .catch((e) => setError(e.message));
              }}
            >
              确认删除评论
            </button>
          </section>
        </div>
      )}
    </CommunityPage>
  );
}
