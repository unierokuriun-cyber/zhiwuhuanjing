import {
  mockChannels,
  mockPosts,
  mockComments,
  mockAuthors,
} from "../mock/community";
import { useCommunity } from "../store/community";
import { useGarden } from "../store/garden";
import { demoUserId, postTypes } from "../types/community";
import type {
  Channel,
  CommunityPost,
  CommunityComment,
  PostDraft,
  PostQuery,
} from "../types/community";
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 120));
export function channelForSpecies(speciesId: string) {
  return mockChannels.find((c) => c.plantSpeciesIds.includes(speciesId));
}
export function communityAuthor(id: string) {
  return id === demoUserId
    ? "本地演示用户"
    : `${mockAuthors[id] || "植物爱好者"} · 示例`;
}
export function postView(p: CommunityPost): CommunityPost {
  const s = useCommunity.getState();
  return {
    ...p,
    likeCount: p.likeCount + Number(s.liked.includes(p.postId)),
    favoriteCount: p.favoriteCount + Number(s.favorites.includes(p.postId)),
    commentCount: [...mockComments, ...s.comments].filter(
      (c) => c.postId === p.postId,
    ).length,
  };
}
export function filterCommunityPosts(query: PostQuery = {}): CommunityPost[] {
  const s = useCommunity.getState();
  const keyword = query.keyword?.trim().toLocaleLowerCase();
  let result = [...s.userPosts, ...mockPosts]
    .filter(
      (p) =>
        (!query.channelId || p.channelId === query.channelId) &&
        (!query.postType || p.postType === query.postType) &&
        (!query.followed || s.followed.includes(p.channelId)) &&
        (!query.authorId || p.authorId === query.authorId) &&
        (!query.favorites || s.favorites.includes(p.postId)) &&
        (!keyword ||
          [p.title, p.content, ...p.tags]
            .join(" ")
            .toLocaleLowerCase()
            .includes(keyword)),
    )
    .map(postView);
  const score = (p: CommunityPost) =>
    p.likeCount +
    p.favoriteCount * 2 +
    (p.postType === "养护攻略" ? 15 : p.postType === "成长分享" ? 5 : 0) +
    (query.speciesIds?.includes(p.plantSpeciesId || "") ? 100 : 0) +
    (p.source === "local" ? 200 : 0);
  result = result.sort((a, b) =>
    query.sort === "latest"
      ? b.createdAt.localeCompare(a.createdAt)
      : score(b) - score(a) || b.createdAt.localeCompare(a.createdAt),
  );
  return result;
}
function verifyPost(id: string) {
  const p = [...useCommunity.getState().userPosts, ...mockPosts].find(
    (p) => p.postId === id,
  );
  if (!p) throw new Error("帖子不存在，可能已移除");
  return p;
}
function verifySaved(postId: string) {
  try {
    const raw = JSON.parse(
      localStorage.getItem("plant-companion-community-v1") || "{}",
    );
    if (!raw.state?.userPosts?.some((p: CommunityPost) => p.postId === postId))
      throw new Error();
  } catch {
    throw new Error("帖子未能持久保存，请检查存储权限或剩余空间后重试");
  }
}
/** Replace this boundary with authenticated REST calls; local identity is not authentication. */
export interface CommunityService {
  getChannels(): Promise<Channel[]>;
  getChannelById(id: string): Promise<Channel | undefined>;
  followChannel(id: string, enabled: boolean): Promise<void>;
  getPosts(query?: PostQuery): Promise<CommunityPost[]>;
  getPostById(id: string): Promise<CommunityPost | undefined>;
  createPost(draft: PostDraft, id: string): Promise<CommunityPost>;
  likePost(id: string, enabled: boolean): Promise<void>;
  favoritePost(id: string, enabled: boolean): Promise<void>;
  getComments(id: string): Promise<CommunityComment[]>;
  createComment(
    id: string,
    content: string,
    submissionId: string,
  ): Promise<void>;
  deleteComment(id: string): Promise<void>;
  searchCommunity(
    keyword: string,
  ): Promise<{ channels: Channel[]; posts: CommunityPost[] }>;
}
export const communityService: CommunityService = {
  async getChannels() {
    await delay();
    return mockChannels;
  },
  async getChannelById(id) {
    await delay();
    return mockChannels.find((c) => c.channelId === id);
  },
  async followChannel(id, enabled) {
    if (!mockChannels.some((c) => c.channelId === id))
      throw new Error("频道不存在");
    useCommunity.getState().follow(id, enabled);
  },
  async getPosts(q) {
    await delay();
    return filterCommunityPosts(q);
  },
  async getPostById(id) {
    await delay();
    const p = [...useCommunity.getState().userPosts, ...mockPosts].find(
      (p) => p.postId === id,
    );
    return p ? postView(p) : undefined;
  },
  async createPost(draft, id) {
    const old = useCommunity.getState().userPosts.find((p) => p.postId === id);
    if (old) {
      verifySaved(id);
      return old;
    }
    const channel = mockChannels.find((c) => c.channelId === draft.channelId);
    if (!channel || !postTypes.includes(draft.postType))
      throw new Error("请选择有效频道和帖子类型");
    if (
      !draft.title.trim() ||
      draft.title.trim().length > 60 ||
      !draft.content.trim() ||
      draft.content.length > 5000
    )
      throw new Error("请填写标题（1–60 字）和正文（1–5000 字）");
    if (
      draft.images.length > 3 ||
      draft.images.some((ref) => !ref.startsWith("idb:"))
    )
      throw new Error("图片必须通过社区图片库保存，每篇最多 3 张");
    const p = draft.plantProfileId
      ? useGarden.getState().plants.find((p) => p.id === draft.plantProfileId)
      : undefined;
    if (
      draft.plantProfileId &&
      (!p || !channel.plantSpeciesIds.includes(p.speciesId))
    )
      throw new Error("关联植物与频道不匹配，请重新选择");
    if (
      draft.sourceRecordId &&
      !useGarden
        .getState()
        .records.some(
          (r) =>
            r.id === draft.sourceRecordId &&
            r.kind === "growth" &&
            r.plantId === p?.id,
        )
    )
      throw new Error("成长记录已不存在，请重新选择");
    const at = new Date().toISOString();
    const post: CommunityPost = {
      ...draft,
      title: draft.title.trim(),
      content: draft.content.trim(),
      tags: [...new Set(draft.tags.map((t) => t.trim()).filter(Boolean))].slice(
        0,
        5,
      ),
      postId: id,
      authorId: demoUserId,
      plantSpeciesId: p?.speciesId || channel.plantSpeciesIds[0],
      createdAt: at,
      updatedAt: at,
      likeCount: 0,
      favoriteCount: 0,
      commentCount: 0,
      source: "local",
    };
    const snapshot = useCommunity.getState();
    snapshot.savePost(post);
    try {
      verifySaved(id);
    } catch (error) {
      useCommunity.setState({
        userPosts: snapshot.userPosts,
        revision: useCommunity.getState().revision + 1,
      });
      throw error;
    }
    return post;
  },
  async likePost(id, enabled) {
    verifyPost(id);
    useCommunity.getState().like(id, enabled);
  },
  async favoritePost(id, enabled) {
    verifyPost(id);
    useCommunity.getState().favorite(id, enabled);
  },
  async getComments(id) {
    await delay();
    verifyPost(id);
    return [...mockComments, ...useCommunity.getState().comments]
      .filter((c) => c.postId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async createComment(id, content, submissionId) {
    verifyPost(id);
    if (!content.trim() || content.length > 500)
      throw new Error("评论需为 1–500 字");
    useCommunity.getState().saveComment({
      commentId: submissionId,
      postId: id,
      authorId: demoUserId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      source: "local",
    });
  },
  async deleteComment(id) {
    const c = useCommunity.getState().comments.find((c) => c.commentId === id);
    if (c?.authorId !== demoUserId) throw new Error("只能删除自己的本地评论");
    useCommunity.getState().deleteComment(id);
  },
  async searchCommunity(keyword) {
    await delay();
    const q = keyword.trim().toLocaleLowerCase();
    return {
      channels: mockChannels.filter((c) =>
        [c.name, c.description, ...c.tags]
          .join(" ")
          .toLocaleLowerCase()
          .includes(q),
      ),
      posts: filterCommunityPosts({ keyword: q, sort: "latest" }),
    };
  },
};
