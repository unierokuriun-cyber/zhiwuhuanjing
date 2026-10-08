import { useState } from "react";
import { cleanupUnusedCommunityImages } from "../services/communityImages";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sprout, Bookmark, FileText, Trophy } from "lucide-react";
import { useGarden } from "../store/garden";
import { useCommunity } from "../store/community";
import { communityService } from "../services/community";
import { demoUserId } from "../types/community";
import { useCommunityQuery } from "../hooks/useCommunityQuery";
import {
  PostFeed,
  QueryState,
  CommunityEmptyState,
} from "../components/community/Shared";
import { CommunityMilestone } from "../components/community/Recommendations";
import { usePreferences } from "../store/preferences";
export function Profile() {
  const profile = usePreferences();
  const [cleanup, setCleanup] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mode = pathname.endsWith("/favorites") ? "favorites" : "posts";
  const plants = useGarden((s) => s.plants);
  const s = useCommunity();
  const query =
    mode === "favorites"
      ? { favorites: true }
      : { authorId: demoUserId, sort: "latest" as const };
  const posts = useCommunityQuery(`profile:${mode}`, () =>
    communityService.getPosts(query),
  );
  return (
    <div className="community-page profile-community">
      <span className="eyebrow">YOUR GREEN JOURNAL</span>
      <h1>我的</h1>
      <section className="profile-community-hero">
        <span className="avatar">我</span>
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.bio}</p>
          <p>未接入真实登录 · 数据保存在当前浏览器</p>
        </div>
      </section>
      <div className="profile-community-stats">
        <Link to="/garden">
          <Sprout />
          <strong>{plants.length}</strong>我的植物
        </Link>
        <Link to="/profile/posts">
          <FileText />
          <strong>{s.userPosts.length}</strong>我的帖子
        </Link>
        <Link to="/profile/favorites">
          <Bookmark />
          <strong>{s.favorites.length}</strong>我的收藏
        </Link>
        <Link to="/companion/achievements">
          <Trophy />
          <strong>成长</strong>我的成就
        </Link>
      </div>
      <div className="account-links">
        <Link to="/profile/edit">编辑个人资料</Link>
        <Link to="/profile/devices">设备管理</Link>
        <Link to="/profile/settings">消息与隐私设置</Link>
      </div>
      <CommunityMilestone />
      <div className="community-tabs" role="tablist" aria-label="我的内容">
        <button
          role="tab"
          aria-selected={mode === "posts"}
          onClick={() => navigate("/profile/posts")}
        >
          我的帖子
        </button>
        <button
          role="tab"
          aria-selected={mode === "favorites"}
          onClick={() => navigate("/profile/favorites")}
        >
          我的收藏
        </button>
      </div>
      <QueryState {...posts} />
      {!posts.loading &&
        !posts.error &&
        (posts.data?.length ? (
          <PostFeed posts={posts.data} />
        ) : (
          <CommunityEmptyState
            text={
              mode === "posts"
                ? "还没有自己的帖子，从一个成长瞬间开始吧。"
                : "还没有收藏，阅读攻略时点击收藏即可。"
            }
          />
        ))}
      <button
        className="button secondary-button"
        disabled={cleaning}
        onClick={() => {
          setCleaning(true);
          void cleanupUnusedCommunityImages(
            s.userPosts.flatMap((p) => p.images),
          )
            .then((n) =>
              setCleanup(`已清理 ${n} 张未引用图片，已发布帖子的图片保留。`),
            )
            .catch((e) => setCleanup(e.message))
            .finally(() => setCleaning(false));
        }}
      >
        清理未引用图片
      </button>
      {cleanup && <p role="status">{cleanup}</p>}
      <p className="form-note">当前为本地演示社区，未接入真实账号服务。</p>
    </div>
  );
}
