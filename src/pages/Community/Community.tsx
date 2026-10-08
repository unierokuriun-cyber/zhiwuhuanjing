import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sprout } from "lucide-react";
import { useGarden } from "../../store/garden";
import { useCommunity } from "../../store/community";
import { communityService } from "../../services/community";
import { useCommunityQuery } from "../../hooks/useCommunityQuery";
import {
  CommunityPage,
  ChannelCard,
  PostFeed,
  QueryState,
} from "../../components/community/Shared";
import type { PostType } from "../../types/community";
export function Community() {
  const plants = useGarden((s) => s.plants);
  const followed = useCommunity((s) => s.followed);
  const [category, setCategory] = useState("全部");
  const [mode, setMode] = useState("推荐");
  const [type, setType] = useState("全部");
  const [limit, setLimit] = useState(12);
  const channels = useCommunityQuery("channels", () =>
    communityService.getChannels(),
  );
  const ids =
    channels.data
      ?.filter((c) => category === "全部" || c.category === category)
      .map((c) => c.channelId) || [];
  const query = {
    followed: mode === "关注",
    postType:
      type === "全部" || type === "最新" ? undefined : (type as PostType),
    sort:
      type === "最新" || type === "成长分享"
        ? ("latest" as const)
        : ("recommended" as const),
    speciesIds: plants.map((p) => p.speciesId),
  };
  const posts = useCommunityQuery(JSON.stringify(query), () =>
    communityService.getPosts(query),
  );
  const recommended =
    channels.data?.filter((c) =>
      plants.some((p) => c.plantSpeciesIds.includes(p.speciesId)),
    ) || [];
  return (
    <CommunityPage>
      <div className="community-shell">
        <aside className="community-channel-nav">
          <h2>植物频道</h2>
          {["观赏性", "实用性"].map((cat) => (
            <div key={cat}>
              <h3>{cat}植物</h3>
              {channels.data
                ?.filter((c) => c.category === cat)
                .map((c) => (
                  <Link
                    key={c.channelId}
                    to={`/community/channels/${c.channelId}`}
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          ))}
        </aside>
        <div className="community-center">
          <section className="community-hero">
            <div>
              <span className="tip-label">
                <Sprout size={16} />
                在绿意里，找到同好
              </span>
              <h2>
                每一片新叶，
                <br />
                都有值得分享的故事。
              </h2>
              <p>从养护小经验，到阳台的小小丰收。</p>
              <Link className="text-link" to="/community/channels/tomato">
                探索阳台种植 <ArrowUpRight size={16} />
              </Link>
            </div>
            <img src="/images/hero.webp" alt="绿意中的室内植物摄影" />
          </section>
          <div
            className="community-tabs"
            role="tablist"
            aria-label="频道一级分类"
          >
            {["全部", "观赏性", "实用性"].map((c) => (
              <button
                role="tab"
                aria-selected={category === c}
                onClick={() => {
                  setCategory(c);
                  setLimit(12);
                }}
                key={c}
              >
                {c === "全部" ? "全部频道" : `${c}植物`}
              </button>
            ))}
          </div>
          <QueryState {...channels} />
          {!channels.loading && !channels.error && (
            <div className="channel-scroller">
              {channels.data
                ?.filter((c) => ids.includes(c.channelId))
                .map((c) => (
                  <Link
                    className="channel-chip"
                    key={c.channelId}
                    to={`/community/channels/${c.channelId}`}
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          )}
          {recommended.length > 0 && (
            <section className="recommended-channels">
              <div className="section-heading">
                <h2>与你的花园有关</h2>
                <small>根据档案物种推荐</small>
              </div>
              <div className="channel-recommend-grid">
                {recommended.map((c) => (
                  <ChannelCard key={c.channelId} channel={c} />
                ))}
              </div>
            </section>
          )}
          <div className="section-heading community-feed-heading">
            <div
              className="community-tabs"
              role="tablist"
              aria-label="内容来源"
            >
              {["推荐", "关注"].map((m) => (
                <button
                  role="tab"
                  aria-selected={mode === m}
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setLimit(12);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <Link className="text-link" to="/community/create">
              写一段植物故事
            </Link>
          </div>
          <div className="community-filter" aria-label="内容类型">
            {["全部", "养护攻略", "成长分享", "问题求助", "最新"].map((t) => (
              <button
                aria-pressed={type === t}
                key={t}
                onClick={() => {
                  setType(t);
                  setLimit(12);
                }}
              >
                {t === "养护攻略"
                  ? "精选养护攻略"
                  : t === "成长分享"
                    ? "最新成长分享"
                    : t === "问题求助"
                      ? "植物问题求助"
                      : t}
              </button>
            ))}
          </div>
          <QueryState {...posts} />
          {!posts.loading &&
            !posts.error &&
            (mode === "关注" && !followed.length ? (
              <p className="care-empty">还没有关注频道，先找到喜欢的植物吧。</p>
            ) : (
              <>
                <PostFeed
                  posts={(posts.data || [])
                    .filter((p) => ids.includes(p.channelId))
                    .slice(0, limit)}
                />
                {(posts.data || []).filter((p) => ids.includes(p.channelId))
                  .length > limit && (
                  <button
                    className="button secondary-button community-load-more"
                    onClick={() => setLimit((n) => n + 12)}
                  >
                    查看更多故事
                  </button>
                )}
              </>
            ))}
        </div>
        <aside className="community-right">
          <div className="partner-panel">
            <span className="eyebrow">GROWING CONNECTIONS</span>
            <h2>热门频道</h2>
            <p className="form-note">演示热度，不是真实用户人数</p>
            {channels.data
              ?.slice()
              .sort((a, b) => b.demoFollowers - a.demoFollowers)
              .slice(0, 4)
              .map((c) => (
                <ChannelCard key={c.channelId} channel={c} />
              ))}
          </div>
          <div className="community-right-tip">
            <h3>把答案带回花园</h3>
            <p>攻略只是起点，观察实际盆土、光照和叶片，是照顾的第一步。</p>
            <Link className="text-link" to="/care">
              前往智能养护 <ArrowUpRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </CommunityPage>
  );
}
