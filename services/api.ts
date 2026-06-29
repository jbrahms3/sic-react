import type {
  AppUser,
  Comment,
  DayEntry,
  Post,
  ProfileResponse,
  TodayInfo,
} from "./types";

/**
 * Thin async client for the TLA Cloudflare backend.
 *
 * The base URL is injected by Rork via the `EXPO_PUBLIC_RORK_FUNCTIONS_URL`
 * environment variable (Expo inlines `EXPO_PUBLIC_*` at build time).
 */
const BASE_URL = (process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL ?? "").replace(/\/$/, "");

export class BackendError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: string;
  query?: Record<string, string>;
  body?: unknown;
  userId?: string;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}/${path}`);
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {};
  if (opts.userId) headers["X-User-Id"] = opts.userId;
  let bodyText: string | undefined;
  if (opts.body !== undefined) {
    bodyText = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers,
    body: bodyText,
  });

  if (!response.ok) {
    throw new BackendError(response.status, await response.text());
  }
  return (await response.json()) as T;
}

/** Public URL for a stored image id. */
export function imageURL(imageId: string): string {
  return `${BASE_URL}/images/${imageId}`;
}

export const API = {
  async today(): Promise<TodayInfo> {
    return request<TodayInfo>("today");
  },

  async days(): Promise<DayEntry[]> {
    const res = await request<{ days: DayEntry[] }>("days");
    return res.days;
  },

  async feed(day: string, sort: string, userId: string): Promise<Post[]> {
    const res = await request<{ posts: Post[] }>("feed", {
      query: { day, sort },
      userId,
    });
    return res.posts;
  },

  async uploadImage(base64: string): Promise<string> {
    const res = await request<{ imageId: string }>("images", {
      method: "POST",
      body: { data: base64, contentType: "image/jpeg" },
    });
    return res.imageId;
  },

  async saveUser(
    userId: string,
    username: string,
    avatarImageId: string | null,
  ): Promise<AppUser> {
    const payload: Record<string, unknown> = { username };
    if (avatarImageId) payload.avatarImageId = avatarImageId;
    const res = await request<{ user: AppUser }>("users", {
      method: "POST",
      body: payload,
      userId,
    });
    return res.user;
  },

  async createPost(
    userId: string,
    caption: string,
    imageId: string,
    day: string,
  ): Promise<Post> {
    const res = await request<{ post: Post }>("posts", {
      method: "POST",
      body: { caption, imageId, day },
      userId,
    });
    return res.post;
  },

  async post(id: string, userId: string): Promise<Post> {
    const res = await request<{ post: Post }>(`posts/${id}`, { userId });
    return res.post;
  },

  async toggleLike(postId: string, userId: string): Promise<Post> {
    const res = await request<{ post: Post }>(`posts/${postId}/like`, {
      method: "POST",
      userId,
    });
    return res.post;
  },

  async comments(postId: string): Promise<Comment[]> {
    const res = await request<{ comments: Comment[] }>(`posts/${postId}/comments`);
    return res.comments;
  },

  async addComment(postId: string, userId: string, text: string): Promise<Comment[]> {
    const res = await request<{ comments: Comment[] }>(`posts/${postId}/comments`, {
      method: "POST",
      body: { text },
      userId,
    });
    return res.comments;
  },

  async profile(userId: string, viewerId: string): Promise<ProfileResponse> {
    return request<ProfileResponse>(`profile/${userId}`, { userId: viewerId });
  },
};
