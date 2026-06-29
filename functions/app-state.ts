import { DurableObject } from "cloudflare:workers";
import { acronymForDay } from "./acronyms";

// Single global Durable Object that owns the entire shared app state:
// users, posts, likes, comments, and binary image storage.

type Env = { DO: Fetcher };

interface UserRow {
  id: string;
  username: string;
  avatar_image_id: string | null;
  created_at: number;
}

interface PostRow {
  id: string;
  user_id: string;
  day: string;
  acronym: string;
  caption: string;
  image_id: string;
  created_at: number;
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: number;
}

function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export class AppState extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        avatar_image_id TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        content_type TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        day TEXT NOT NULL,
        acronym TEXT NOT NULL,
        caption TEXT NOT NULL,
        image_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS likes (
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (post_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const userId = request.headers.get("X-User-Id");

    try {
      // Serve an image by id (binary).
      if (method === "GET" && path.startsWith("/images/")) {
        const id = path.slice("/images/".length);
        const row = this.ctx.storage.sql
          .exec<{ content_type: string; data: string }>(
            "SELECT content_type, data FROM images WHERE id = ?",
            id,
          )
          .toArray()[0];
        if (!row) return new Response("not found", { status: 404 });
        return new Response(base64ToBytes(row.data), {
          headers: {
            "Content-Type": row.content_type,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      // Upload an image (base64 in JSON). Returns { imageId }.
      if (method === "POST" && path === "/images") {
        const body = (await request.json()) as { data: string; contentType?: string };
        if (!body.data) return Response.json({ error: "missing data" }, { status: 400 });
        const id = newId();
        this.ctx.storage.sql.exec(
          "INSERT INTO images (id, content_type, data) VALUES (?, ?, ?)",
          id,
          body.contentType ?? "image/jpeg",
          body.data,
        );
        return Response.json({ imageId: id });
      }

      // Create or update the current user's profile.
      if (method === "POST" && path === "/users") {
        if (!userId) return Response.json({ error: "missing user" }, { status: 400 });
        const body = (await request.json()) as { username: string; avatarImageId?: string | null };
        const username = (body.username ?? "").trim();
        if (username.length === 0) return Response.json({ error: "missing username" }, { status: 400 });
        const existing = this.userRow(userId);
        if (existing) {
          this.ctx.storage.sql.exec(
            "UPDATE users SET username = ?, avatar_image_id = COALESCE(?, avatar_image_id) WHERE id = ?",
            username,
            body.avatarImageId ?? null,
            userId,
          );
        } else {
          this.ctx.storage.sql.exec(
            "INSERT INTO users (id, username, avatar_image_id, created_at) VALUES (?, ?, ?, ?)",
            userId,
            username,
            body.avatarImageId ?? null,
            Date.now(),
          );
        }
        return Response.json({ user: this.publicUser(userId) });
      }

      // Today's acronym + countdown to the next one.
      if (method === "GET" && path === "/today") {
        const now = new Date();
        const day = now.toISOString().slice(0, 10);
        const nextMs = (Math.floor(now.getTime() / 86_400_000) + 1) * 86_400_000 - now.getTime();
        const count = this.ctx.storage.sql
          .exec<{ c: number }>("SELECT COUNT(*) AS c FROM posts WHERE day = ?", day)
          .toArray()[0]?.c ?? 0;
        return Response.json({ day, acronym: acronymForDay(day), msUntilNext: nextMs, postCount: count });
      }

      // List of past days with submissions.
      if (method === "GET" && path === "/days") {
        const rows = this.ctx.storage.sql
          .exec<{ day: string; c: number }>(
            "SELECT day, COUNT(*) AS c FROM posts GROUP BY day ORDER BY day DESC",
          )
          .toArray();
        return Response.json({
          days: rows.map((r) => ({ day: r.day, acronym: acronymForDay(r.day), postCount: r.c })),
        });
      }

      // Feed for a given day.
      if (method === "GET" && path === "/feed") {
        const day = url.searchParams.get("day") ?? new Date().toISOString().slice(0, 10);
        const sort = url.searchParams.get("sort") ?? "new";
        return Response.json({ posts: this.feed({ day, sort, viewerId: userId }) });
      }

      // Posts by a specific user.
      if (method === "GET" && path.startsWith("/profile/")) {
        const targetId = path.slice("/profile/".length);
        const user = this.publicUser(targetId);
        if (!user) return Response.json({ error: "not found" }, { status: 404 });
        return Response.json({ user, posts: this.feed({ userId: targetId, viewerId: userId, sort: "new" }) });
      }

      // Create a post.
      if (method === "POST" && path === "/posts") {
        if (!userId) return Response.json({ error: "missing user" }, { status: 400 });
        const body = (await request.json()) as { caption: string; imageId: string; day?: string };
        const caption = (body.caption ?? "").trim();
        if (!body.imageId || caption.length === 0) {
          return Response.json({ error: "missing fields" }, { status: 400 });
        }
        const day = body.day ?? new Date().toISOString().slice(0, 10);
        const id = newId();
        this.ctx.storage.sql.exec(
          "INSERT INTO posts (id, user_id, day, acronym, caption, image_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          id,
          userId,
          day,
          acronymForDay(day),
          caption,
          body.imageId,
          Date.now(),
        );
        return Response.json({ post: this.post(id, userId) });
      }

      // Single post.
      const postMatch = path.match(/^\/posts\/([^/]+)$/);
      if (method === "GET" && postMatch) {
        const post = this.post(postMatch[1], userId);
        if (!post) return Response.json({ error: "not found" }, { status: 404 });
        return Response.json({ post });
      }

      // Toggle like.
      const likeMatch = path.match(/^\/posts\/([^/]+)\/like$/);
      if (method === "POST" && likeMatch) {
        if (!userId) return Response.json({ error: "missing user" }, { status: 400 });
        const postId = likeMatch[1];
        const already = this.ctx.storage.sql
          .exec<{ c: number }>(
            "SELECT COUNT(*) AS c FROM likes WHERE post_id = ? AND user_id = ?",
            postId,
            userId,
          )
          .toArray()[0]?.c ?? 0;
        if (already > 0) {
          this.ctx.storage.sql.exec("DELETE FROM likes WHERE post_id = ? AND user_id = ?", postId, userId);
        } else {
          this.ctx.storage.sql.exec(
            "INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)",
            postId,
            userId,
            Date.now(),
          );
        }
        const post = this.post(postId, userId);
        if (!post) return Response.json({ error: "not found" }, { status: 404 });
        return Response.json({ post });
      }

      // Comments for a post.
      const commentsMatch = path.match(/^\/posts\/([^/]+)\/comments$/);
      if (commentsMatch) {
        const postId = commentsMatch[1];
        if (method === "GET") {
          return Response.json({ comments: this.comments(postId) });
        }
        if (method === "POST") {
          if (!userId) return Response.json({ error: "missing user" }, { status: 400 });
          const body = (await request.json()) as { text: string };
          const text = (body.text ?? "").trim();
          if (text.length === 0) return Response.json({ error: "empty" }, { status: 400 });
          const id = newId();
          this.ctx.storage.sql.exec(
            "INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES (?, ?, ?, ?, ?)",
            id,
            postId,
            userId,
            text,
            Date.now(),
          );
          return Response.json({ comments: this.comments(postId) });
        }
      }

      return new Response("not found", { status: 404 });
    } catch (err) {
      console.error("AppState error", path, err);
      return Response.json({ error: "server error" }, { status: 500 });
    }
  }

  private userRow(id: string): UserRow | undefined {
    return this.ctx.storage.sql
      .exec<UserRow>("SELECT * FROM users WHERE id = ?", id)
      .toArray()[0];
  }

  private publicUser(id: string): { id: string; username: string; avatarImageId: string | null } | null {
    const row = this.userRow(id);
    if (!row) return null;
    return { id: row.id, username: row.username, avatarImageId: row.avatar_image_id };
  }

  private comments(postId: string): unknown[] {
    const rows = this.ctx.storage.sql
      .exec<CommentRow>("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC", postId)
      .toArray();
    return rows.map((r) => {
      const user = this.publicUser(r.user_id);
      return {
        id: r.id,
        text: r.text,
        createdAt: r.created_at,
        username: user?.username ?? "someone",
        avatarImageId: user?.avatarImageId ?? null,
        userId: r.user_id,
      };
    });
  }

  private post(id: string, viewerId: string | null): unknown | null {
    const row = this.ctx.storage.sql
      .exec<PostRow>("SELECT * FROM posts WHERE id = ?", id)
      .toArray()[0];
    if (!row) return null;
    return this.decoratePost(row, viewerId);
  }

  private feed(opts: { day?: string; userId?: string; sort: string; viewerId: string | null }): unknown[] {
    let rows: PostRow[];
    if (opts.userId) {
      rows = this.ctx.storage.sql
        .exec<PostRow>("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC", opts.userId)
        .toArray();
    } else {
      rows = this.ctx.storage.sql
        .exec<PostRow>("SELECT * FROM posts WHERE day = ? ORDER BY created_at DESC", opts.day ?? "")
        .toArray();
    }
    const decorated = rows.map((r) => this.decoratePost(r, opts.viewerId));
    if (opts.sort === "top") {
      decorated.sort((a, b) => (b.likeCount - a.likeCount) || (b.createdAt - a.createdAt));
    }
    return decorated;
  }

  private decoratePost(row: PostRow, viewerId: string | null): {
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
  } {
    const user = this.publicUser(row.user_id);
    const likeCount = this.ctx.storage.sql
      .exec<{ c: number }>("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?", row.id)
      .toArray()[0]?.c ?? 0;
    const commentCount = this.ctx.storage.sql
      .exec<{ c: number }>("SELECT COUNT(*) AS c FROM comments WHERE post_id = ?", row.id)
      .toArray()[0]?.c ?? 0;
    const likedByMe = viewerId
      ? (this.ctx.storage.sql
          .exec<{ c: number }>(
            "SELECT COUNT(*) AS c FROM likes WHERE post_id = ? AND user_id = ?",
            row.id,
            viewerId,
          )
          .toArray()[0]?.c ?? 0) > 0
      : false;
    return {
      id: row.id,
      userId: row.user_id,
      username: user?.username ?? "someone",
      avatarImageId: user?.avatarImageId ?? null,
      day: row.day,
      acronym: row.acronym,
      caption: row.caption,
      imageId: row.image_id,
      createdAt: row.created_at,
      likeCount,
      commentCount,
      likedByMe,
    };
  }
}
