import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Leaf,
  Heart,
  Bookmark,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import { PlantImage } from "../common/PlantImage";
import { useCommunity } from "../../store/community";
import { communityService, communityAuthor } from "../../services/community";
import { readCommunityImage } from "../../services/communityImages";
import { getStorageError } from "../../store/storage";
import { Loading } from "../care/Shared";
import type { Channel, CommunityPost } from "../../types/community";
export function CommunityPage({
  title = "植物社区",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const [error, setError] = useState(getStorageError);
  useEffect(() => {
    const update = () => setError(getStorageError());
    window.addEventListener("garden-storage-error", update);
    return () => window.removeEventListener("garden-storage-error", update);
  }, []);
  return (
    <div className="community-page">
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <header className="community-header">
        <div>
          <span className="eyebrow">THE GREEN SIDE OF LIFE</span>
          <h1>{title}</h1>
          <p>分享一片新叶，遇见同样热爱绿意的人。</p>
        </div>
        <div className="community-header-actions">
          <Link
            className="community-search-link"
            to="/community/search"
            aria-label="搜索社区"
          >
            <Search size={21} />
            <span>搜索植物、养护与故事</span>
          </Link>
          <Link className="button" to="/community/create">
            <Plus size={18} />
            发布内容
          </Link>
        </div>
      </header>
      <p className="community-demo">
        <UsersRound size={16} />
        本地社区演示 · 示例作者与热度为 Mock；你的发帖和互动仅保存在当前浏览器。
      </p>
      {children}
    </div>
  );
}
export function CommunityEmptyState({
  text = "这里还没有内容，写下第一段植物故事吧。",
}: {
  text?: string;
}) {
  return (
    <div className="care-empty">
      <Leaf size={30} />
      <p>{text}</p>
      <Link className="text-link" to="/community/create">
        发布内容
      </Link>
    </div>
  );
}
export function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return loading ? (
    <Loading text="正在整理社区内容…" />
  ) : error ? (
    <div className="care-empty" role="alert">
      <p>{error}</p>
      <button className="button" onClick={retry}>
        重新加载
      </button>
    </div>
  ) : null;
}
export function ChannelFollowButton({ channel }: { channel: Channel }) {
  const followed = useCommunity((s) => s.followed.includes(channel.channelId));
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className={`follow-button ${followed ? "followed" : ""}`}
        aria-label={`${followed ? "取消关注" : "关注"}${channel.name}频道`}
        aria-pressed={followed}
        onClick={() => {
          void communityService
            .followChannel(channel.channelId, !followed)
            .catch((e) => setError(e.message));
        }}
      >
        {followed ? "已关注" : "+ 关注"}
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
export function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <article className="channel-card">
      <Link to={`/community/channels/${channel.channelId}`}>
        <PlantImage
          src={channel.cover}
          alt={`${channel.name}频道植物主题摄影`}
        />
        <div>
          <h3>{channel.name}</h3>
          <p>{channel.tags.join(" · ")}</p>
        </div>
      </Link>
      <ChannelFollowButton channel={channel} />
    </article>
  );
}
export function CommunityImage({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState({ url: "", error: "" });
  useEffect(() => {
    if (!src.startsWith("idb:")) return;
    let active = true;
    let objectUrl = "";
    setState({ url: "", error: "" });
    readCommunityImage(src)
      .then((blob) => {
        if (!active) return;
        if (!blob) {
          setState({ url: "", error: "图片已不在本地图片库" });
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, error: "" });
      })
      .catch(() => {
        if (active) setState({ url: "", error: "图片暂时无法读取" });
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);
  if (!src.startsWith("idb:")) return <PlantImage src={src} alt={alt} />;
  return state.url ? (
    <PlantImage key={state.url} src={state.url} alt={alt} />
  ) : (
    <div
      className="community-image-fallback"
      role="img"
      aria-label={state.error || "图片加载中"}
    >
      <Leaf size={25} />
      <small>{state.error || "读取本地图片…"}</small>
    </div>
  );
}
export function PostImageGrid({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  return (
    <div className={`post-image-grid images-${images.length}`}>
      {images.map((src, i) => (
        <CommunityImage key={src} src={src} alt={`${title} 图片 ${i + 1}`} />
      ))}
    </div>
  );
}
export function PostTypeBadge({ type }: { type: string }) {
  return <span className="post-type-badge">{type}</span>;
}
export function CommunityPostCard({ post }: { post: CommunityPost }) {
  return (
    <article className="community-post-card">
      <Link to={`/community/posts/${post.postId}`} className="post-card-link">
        {post.images.length ? (
          <CommunityImage src={post.images[0]} alt={post.title} />
        ) : (
          <div className="post-text-cover">
            <Leaf size={34} />
            <span>把日常写成一片绿意</span>
          </div>
        )}
        <div className="post-card-body">
          <PostTypeBadge type={post.postType} />
          <h3>{post.title}</h3>
          <p className="post-excerpt">{post.content}</p>
          <div className="post-tags">
            {post.tags.slice(0, 2).map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
          <div className="post-card-footer">
            <span>{communityAuthor(post.authorId)}</span>
            <span>
              <Heart size={13} />
              {post.likeCount}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
export function PostFeed({ posts }: { posts: CommunityPost[] }) {
  return posts.length ? (
    <div className="community-feed">
      {posts.map((p) => (
        <CommunityPostCard key={p.postId} post={p} />
      ))}
    </div>
  ) : (
    <CommunityEmptyState />
  );
}
export function PostActions({ post }: { post: CommunityPost }) {
  const s = useCommunity();
  const [error, setError] = useState("");
  return (
    <>
      <div className="post-actions">
        <button
          aria-pressed={s.liked.includes(post.postId)}
          onClick={() =>
            void communityService
              .likePost(post.postId, !s.liked.includes(post.postId))
              .catch((e) => setError(e.message))
          }
        >
          <Heart size={20} />
          点赞 {post.likeCount}
        </button>
        <button
          aria-pressed={s.favorites.includes(post.postId)}
          onClick={() =>
            void communityService
              .favoritePost(post.postId, !s.favorites.includes(post.postId))
              .catch((e) => setError(e.message))
          }
        >
          <Bookmark size={20} />
          收藏 {post.favoriteCount}
        </button>
        <a href="#post-comments">
          <MessageCircle size={20} />
          评论 {post.commentCount}
        </a>
      </div>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
