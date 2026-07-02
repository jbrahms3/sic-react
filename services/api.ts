import type {
  AppUser,
  Comment,
  DayEntry,
  Post,
  ProfileResponse,
  TodayInfo,
} from "./types";

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
  token?: string;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}/${path}`);
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {};
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
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

  async feed(day: string, sort: string, token: string): Promise<Post[]> {
    const res = await request<{ posts: Post[] }>("feed", {
      query: { day, sort },
      token,
    });
    return res.posts;
  },

  async uploadImage(base64: string, token: string): Promise<string> {
    const res = await request<{ imageId: string }>("images", {
      method: "POST",
      body: { data: base64, contentType: "image/jpeg" },
      token,
    });
    return res.imageId;
  },

  async saveUser(username: string, avatarImageId: string | null, token: string): Promise<AppUser> {
    const payload: Record<string, unknown> = { username };
    if (avatarImageId) payload.avatarImageId = avatarImageId;
    const res = await request<{ user: AppUser }>("users", {
      method: "POST",
      body: payload,
      token,
    });
    return res.user;
  },

  async createPost(
    caption: string,
    imageId: string,
    day: string,
    token: string,
  ): Promise<Post> {
    const res = await request<{ post: Post }>("posts", {
      method: "POST",
      body: { caption, imageId, day },
      token,
    });
    return res.post;
  },

  async post(id: string, token: string): Promise<Post> {
    const res = await request<{ post: Post }>(`posts/${id}`, { token });
    return res.post;
  },

  async toggleLike(postId: string, token: string): Promise<Post> {
    const res = await request<{ post: Post }>(`posts/${postId}/like`, {
      method: "POST",
      token,
    });
    return res.post;
  },

  async comments(postId: string): Promise<Comment[]> {
    const res = await request<{ comments: Comment[] }>(`posts/${postId}/comments`);
    return res.comments;
  },

  async addComment(postId: string, text: string, token: string): Promise<Comment[]> {
    const res = await request<{ comments: Comment[] }>(`posts/${postId}/comments`, {
      method: "POST",
      body: { text },
      token,
    });
    return res.comments;
  },

  async profile(userId: string, token: string): Promise<ProfileResponse> {
    return request<ProfileResponse>(`profile/${userId}`, { token });
  },

  async checkAdmin(token: string): Promise<boolean> {
    const res = await request<{ isAdmin: boolean }>("admin/check", { token });
    return res.isAdmin;
  },

  async adminGetAcronyms(token: string): Promise<{ day: string; acronym: string; isOverride: boolean }[]> {
    const res = await request<{ days: { day: string; acronym: string; isOverride: boolean }[] }>(
      "admin/acronyms",
      { token },
    );
    return res.days;
  },

  async adminSetAcronym(day: string, acronym: string, token: string): Promise<void> {
    await request("admin/acronyms", { method: "POST", body: { day, acronym }, token });
  },

  async adminClearAcronym(day: string, token: string): Promise<void> {
    await request(`admin/acronyms/${day}`, { method: "DELETE", token });
  },
};
