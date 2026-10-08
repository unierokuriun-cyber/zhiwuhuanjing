import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useCommunity } from "../../store/community";
import { communityService } from "../../services/community";
import { useCommunityQuery } from "../../hooks/useCommunityQuery";
import {
  CommunityPage,
  ChannelCard,
  PostFeed,
  QueryState,
} from "../../components/community/Shared";
export function CommunitySearch() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q")?.trim() || "";
  const [text, setText] = useState(q);
  const s = useCommunity();
  const result = useCommunityQuery(`search:${q}`, () =>
    q
      ? communityService.searchCommunity(q)
      : Promise.resolve({ channels: [], posts: [] }),
  );
  const popular = useCommunityQuery("hot-searches", () =>
    communityService.getChannels(),
  );
  useEffect(() => {
    const restore = () =>
      setText(new URLSearchParams(window.location.search).get("q") || "");
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (q) useCommunity.getState().rememberSearch(q);
  }, [q]);
  function search(value: string) {
    setText(value.trim().slice(0, 70));
    setParams(value.trim() ? { q: value.trim().slice(0, 70) } : {});
  }
  return (
    <CommunityPage title="寻找你的绿意同好">
      <form
        className="community-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          search(text);
        }}
      >
        <Search size={21} />
        <input
          aria-label="社区搜索关键词"
          value={text}
          maxLength={70}
          onChange={(e) => setText(e.target.value)}
          placeholder="搜索植物、帖子、标签或养护关键词"
        />
        <button className="button">搜索</button>
      </form>
      <section className="search-suggestions">
        <h2>热门搜索 · 演示推荐</h2>
        <div className="community-filter">
          {popular.data
            ?.filter((c) =>
              ["tomato", "bougainvillea", "monstera", "mint"].includes(
                c.channelId,
              ),
            )
            .map((c) => (
              <button key={c.channelId} onClick={() => search(c.name)}>
                {c.name}
              </button>
            ))}
        </div>
        <div className="section-heading">
          <h2>搜索历史</h2>
          <button className="text-link" onClick={s.clearSearch}>
            清空历史
          </button>
        </div>
        <div className="community-filter">
          {s.searchHistory.map((h) => (
            <button key={h} onClick={() => search(h)}>
              {h}
            </button>
          ))}
        </div>
        {!s.searchHistory.length && (
          <p className="form-note">还没有搜索记录。</p>
        )}
      </section>
      {q && (
        <>
          <h2 className="community-section-title">“{q}” 的搜索结果</h2>
          <QueryState {...result} />
          {!result.loading && !result.error && (
            <>
              <h3>植物频道 · {result.data?.channels.length || 0}</h3>
              <div className="channel-recommend-grid search-channels">
                {result.data?.channels.map((c) => (
                  <ChannelCard channel={c} key={c.channelId} />
                ))}
              </div>
              <h3>帖子 · {result.data?.posts.length || 0}</h3>
              <PostFeed posts={result.data?.posts || []} />
            </>
          )}
        </>
      )}
    </CommunityPage>
  );
}
