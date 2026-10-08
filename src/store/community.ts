import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage, reportCorruptStorage } from "./storage";
import type { CommunityPost, CommunityComment } from "../types/community";
type CommunityState = {
  userPosts: CommunityPost[];
  comments: CommunityComment[];
  followed: string[];
  liked: string[];
  favorites: string[];
  searchHistory: string[];
  revision: number;
  follow: (id: string, enabled: boolean) => void;
  like: (id: string, enabled: boolean) => void;
  favorite: (id: string, enabled: boolean) => void;
  savePost: (post: CommunityPost) => void;
  saveComment: (comment: CommunityComment) => void;
  deleteComment: (id: string) => void;
  rememberSearch: (text: string) => void;
  clearSearch: () => void;
};
const membership = (values: string[], id: string, enabled: boolean) =>
  enabled ? [...new Set([...values, id])] : values.filter((v) => v !== id);
export const useCommunity = create<CommunityState>()(
  persist(
    (set) => ({
      userPosts: [],
      comments: [],
      followed: [],
      liked: [],
      favorites: [],
      searchHistory: [],
      revision: 0,
      follow: (id, enabled) =>
        set((s) => ({
          followed: membership(s.followed, id, enabled),
          revision: s.revision + 1,
        })),
      like: (id, enabled) =>
        set((s) => ({
          liked: membership(s.liked, id, enabled),
          revision: s.revision + 1,
        })),
      favorite: (id, enabled) =>
        set((s) => ({
          favorites: membership(s.favorites, id, enabled),
          revision: s.revision + 1,
        })),
      savePost: (post) =>
        set((s) =>
          s.userPosts.some((p) => p.postId === post.postId)
            ? s
            : { userPosts: [post, ...s.userPosts], revision: s.revision + 1 },
        ),
      saveComment: (comment) =>
        set((s) =>
          s.comments.some((c) => c.commentId === comment.commentId)
            ? s
            : { comments: [...s.comments, comment], revision: s.revision + 1 },
        ),
      deleteComment: (id) =>
        set((s) => ({
          comments: s.comments.filter((c) => c.commentId !== id),
          revision: s.revision + 1,
        })),
      rememberSearch: (text) =>
        set((s) => ({
          searchHistory: [
            text,
            ...s.searchHistory.filter((t) => t !== text),
          ].slice(0, 8),
          revision: s.revision + 1,
        })),
      clearSearch: () =>
        set((s) => ({ searchHistory: [], revision: s.revision + 1 })),
    }),
    {
      name: "plant-companion-community-v1",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        userPosts: s.userPosts,
        comments: s.comments,
        followed: s.followed,
        liked: s.liked,
        favorites: s.favorites,
        searchHistory: s.searchHistory,
      }),
      migrate: (s) => ({
        userPosts: [],
        comments: [],
        followed: [],
        liked: [],
        favorites: [],
        searchHistory: [],
        ...(s as object),
      }),
      onRehydrateStorage: () => (_s, e) => {
        if (e) reportCorruptStorage();
      },
    },
  ),
);
