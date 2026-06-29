import { useCallback } from "react";
import { API } from "./api";
import { useAppStore } from "./store";
import type { Post } from "./types";

type PostListSetter = React.Dispatch<React.SetStateAction<Post[]>>;

/**
 * Optimistically toggles a like in a list of posts, then reconciles with the
 * authoritative post returned by the server. Mirrors the `like(post)` helpers
 * in the SwiftUI feeds.
 */
export function useLikeToggle(setPosts: PostListSetter) {
  const { userId } = useAppStore();

  return useCallback(
    (post: Post) => {
      const optimistic: Post = {
        ...post,
        likedByMe: !post.likedByMe,
        likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
      };
      setPosts((current) => current.map((p) => (p.id === post.id ? optimistic : p)));

      API.toggleLike(post.id, userId)
        .then((server) => {
          setPosts((current) => current.map((p) => (p.id === server.id ? server : p)));
        })
        .catch(() => {
          // revert on failure
          setPosts((current) => current.map((p) => (p.id === post.id ? post : p)));
        });
    },
    [setPosts, userId],
  );
}
