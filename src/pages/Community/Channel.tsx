import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { communityService } from "../../services/community";
import { useCommunityQuery } from "../../hooks/useCommunityQuery";
import {
  CommunityPage,
  ChannelFollowButton,
  PostFeed,
  QueryState,
} from "../../components/community/Shared";
import { PlantImage } from "../../components/common/PlantImage";
import type { PostType } from "../../types/community";
export function ChannelPage() {
  const { channelId = "" } = useParams();
  const [type, setType] = useState("推荐");
  const [sort, setSort] = useState<"recommended" | "latest">("recommended");
  const channel = useCommunityQuery(`channel:${channelId}`, () =>
    communityService.getChannelById(channelId),
  );
  const q = {
    channelId,
    postType: ["推荐", "最新"].includes(type) ? undefined : (type as PostType),
    sort: type === "最新" ? ("latest" as const) : sort,
  };
  const posts = useCommunityQuery(JSON.stringify(q), () =>
    communityService.getPosts(q),
  );
  const c = channel.data;
  return (
    <CommunityPage title={c ? `${c.name}频道` : "植物频道"}>
      <Link className="text-link back-link" to="/community">
        回到植物社区
      </Link>
      <QueryState {...channel} />
      {!channel.loading &&
        !channel.error &&
        (c ? (
          <>
            <section className="channel-banner">
              <PlantImage
                src={c.cover}
                alt={`${c.name}频道主题摄影（部分频道为通用植物摄影）`}
              />
              <div>
                <span className="eyebrow">{c.category}植物</span>
                <h2>{c.name}</h2>
                <p>{c.description}</p>
                <div className="post-tags">
                  {c.tags.map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </div>
                <p className="form-note">
                  {c.demoFollowers} 关注热度 · 演示参考
                </p>
                <ChannelFollowButton channel={c} />
                <Link
                  className="button secondary-button"
                  to={`/community/create?channel=${c.channelId}`}
                >
                  发布到此频道
                </Link>
              </div>
            </section>
            <div className="channel-controls">
              <div className="community-filter">
                {["推荐", "最新", "养护攻略", "问题求助", "成长分享"].map(
                  (t) => (
                    <button
                      key={t}
                      aria-pressed={type === t}
                      onClick={() => setType(t)}
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>
              <label>
                内容排序
                <select
                  aria-label="内容排序"
                  value={sort}
                  disabled={type === "最新"}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                >
                  <option value="recommended">推荐热度</option>
                  <option value="latest">最新发布</option>
                </select>
              </label>
            </div>
            <QueryState {...posts} />
            {!posts.loading && !posts.error && (
              <PostFeed posts={posts.data || []} />
            )}
          </>
        ) : (
          <div className="care-empty">
            <h2>频道不存在</h2>
            <Link to="/community">浏览其他频道</Link>
          </div>
        ))}
    </CommunityPage>
  );
}
