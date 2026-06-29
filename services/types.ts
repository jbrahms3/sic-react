/** Server-shaped models, mirroring the Cloudflare `functions/` backend. */

export interface AppUser {
  id: string;
  username: string;
  avatarImageId: string | null;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatarImageId: string | null;
  day: string;
  acronym: string;
  caption: string;
  imageId: string;
  createdAt: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
  username: string;
  avatarImageId: string | null;
  userId: string;
}

export interface DayEntry {
  day: string;
  acronym: string;
  postCount: number;
}

export interface TodayInfo {
  day: string;
  acronym: string;
  msUntilNext: number;
  postCount: number;
}

export interface ProfileResponse {
  user: AppUser;
  posts: Post[];
}
