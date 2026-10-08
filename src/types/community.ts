import type { Category } from "./index";
export const postTypes = [
  "养护攻略",
  "问题求助",
  "成长分享",
  "日常交流",
] as const;
export type PostType = (typeof postTypes)[number];
export type Channel = {
  channelId: string;
  name: string;
  category: Category;
  cover: string;
  description: string;
  tags: string[];
  plantSpeciesIds: string[];
  demoFollowers: number;
};
export type CommunityPost = {
  postId: string;
  authorId: string;
  channelId: string;
  plantSpeciesId?: string;
  plantProfileId?: string;
  sourceRecordId?: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  postType: PostType;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  source: "demo" | "local";
};
export type PostDraft = Pick<
  CommunityPost,
  | "channelId"
  | "plantProfileId"
  | "sourceRecordId"
  | "title"
  | "content"
  | "images"
  | "tags"
  | "postType"
>;
export type CommunityComment = {
  commentId: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  source: "demo" | "local";
};
export type PostQuery = {
  channelId?: string;
  postType?: PostType;
  followed?: boolean;
  keyword?: string;
  sort?: "recommended" | "latest";
  speciesIds?: string[];
  authorId?: string;
  favorites?: boolean;
};
export const demoUserId = "local-demo-user";
