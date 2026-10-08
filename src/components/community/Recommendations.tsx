import { Link } from "react-router-dom";
import { useGarden } from "../../store/garden";
import { useCommunity } from "../../store/community";
import { communityService, channelForSpecies } from "../../services/community";
import { useCommunityQuery } from "../../hooks/useCommunityQuery";
import { ChannelCard, CommunityPostCard, QueryState } from "./Shared";
export function GardenChannelRecommendations() {
  const plants = useGarden((s) => s.plants);
  const channels = useCommunityQuery("garden-channels", () =>
    communityService.getChannels(),
  );
  const selected =
    channels.data?.filter((c) =>
      plants.some((p) => c.plantSpeciesIds.includes(p.speciesId)),
    ) || [];
  return (
    <section className="garden-community-panel">
      <div className="section-heading">
        <h2>找到你的植物同好</h2>
        <Link className="text-link" to="/community">
          去社区
        </Link>
      </div>
      <QueryState {...channels} />
      {!channels.loading && !channels.error && (
        <div className="channel-recommend-grid">
          {selected.length ? (
            selected.map((c) => <ChannelCard key={c.channelId} channel={c} />)
          ) : (
            <p className="form-note">
              添加三角梅、小番茄等植物后，推荐对应物种频道。
            </p>
          )}
        </div>
      )}
    </section>
  );
}
export function CareCommunityRecommendations({
  speciesId,
}: {
  speciesId: string;
}) {
  const channel = channelForSpecies(speciesId);
  const posts = useCommunityQuery(`care-guides:${channel?.channelId}`, () =>
    channel
      ? communityService.getPosts({
          channelId: channel.channelId,
          postType: "养护攻略",
        })
      : Promise.resolve([]),
  );
  return (
    <section className="care-community-guides">
      <div className="section-heading">
        <h2>{channel?.name || "植物"}养护攻略</h2>
        <Link
          className="text-link"
          to={
            channel ? `/community/channels/${channel.channelId}` : "/community"
          }
        >
          到社区交流
        </Link>
      </div>
      <QueryState {...posts} />
      {!posts.loading && !posts.error && (
        <div className="community-guide-grid">
          {posts.data?.length ? (
            posts.data
              .slice(0, 2)
              .map((p) => <CommunityPostCard key={p.postId} post={p} />)
          ) : (
            <p className="form-note">
              暂时没有对应物种攻略，可以到社区分享观察。
            </p>
          )}
        </div>
      )}
    </section>
  );
}
export function CommunityMilestone() {
  const posts = useCommunity((s) => s.userPosts);
  const first = posts
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  return (
    <section className="community-milestone">
      <h2>社区分享者</h2>
      <p>
        {first
          ? "已解锁 · 第一个本地植物故事已发布"
          : "发布第一篇本地帖子，留下属于你的植物故事。"}
      </p>
      <progress aria-label="社区分享者进度" max={1} value={first ? 1 : 0} />
      {first && (
        <time>{new Date(first.createdAt).toLocaleString("zh-CN")}</time>
      )}
      <p className="form-note">
        唯一解锁，无额外经验奖励，不会因重复发布或刷新刷取经验。
      </p>
      <Link className="text-link" to="/profile/posts">
        查看我的帖子
      </Link>
    </section>
  );
}
