import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { pool, initDb } from "./db";
import { uploadImage, imagePublicUrl } from "./r2";
import { acronymForDay } from "./acronyms";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const newId = () => uuidv4().replace(/-/g, "");

// ── helpers ────────────────────────────────────────────────────────────────

async function getUser(id: string) {
  const { rows } = await pool.query(
    "SELECT id, username, avatar_image_id FROM users WHERE id = $1",
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  return { id: r.id, username: r.username, avatarImageId: r.avatar_image_id as string | null };
}

async function decoratePost(row: any, viewerId: string | null) {
  const user = await getUser(row.user_id);
  const { rows: likeRows } = await pool.query(
    "SELECT COUNT(*) AS c FROM likes WHERE post_id = $1",
    [row.id],
  );
  const { rows: commentRows } = await pool.query(
    "SELECT COUNT(*) AS c FROM comments WHERE post_id = $1",
    [row.id],
  );
  let likedByMe = false;
  if (viewerId) {
    const { rows: myLike } = await pool.query(
      "SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2",
      [row.id, viewerId],
    );
    likedByMe = myLike.length > 0;
  }
  return {
    id: row.id,
    userId: row.user_id,
    username: user?.username ?? "someone",
    avatarImageId: user?.avatarImageId ?? null,
    day: row.day,
    acronym: row.acronym,
    caption: row.caption,
    imageId: row.image_id,
    createdAt: Number(row.created_at),
    likeCount: Number(likeRows[0].c),
    commentCount: Number(commentRows[0].c),
    likedByMe,
  };
}

// ── routes ─────────────────────────────────────────────────────────────────

app.get("/ping", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

// Image: serve public URL redirect
app.get("/images/:id", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT r2_key FROM images WHERE id = $1",
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: "not found" });
  return res.redirect(imagePublicUrl(rows[0].r2_key));
});

// Image: upload
app.post("/images", async (req, res) => {
  const { data, contentType = "image/jpeg" } = req.body as { data?: string; contentType?: string };
  if (!data) return res.status(400).json({ error: "missing data" });
  const id = newId();
  const key = `images/${id}`;
  const buffer = Buffer.from(data, "base64");
  await uploadImage(key, buffer, contentType);
  await pool.query(
    "INSERT INTO images (id, content_type, r2_key) VALUES ($1, $2, $3)",
    [id, contentType, key],
  );
  return res.json({ imageId: id });
});

// User: create/update
app.post("/users", async (req, res) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) return res.status(400).json({ error: "missing user" });
  const { username, avatarImageId } = req.body as { username?: string; avatarImageId?: string | null };
  const name = (username ?? "").trim();
  if (!name) return res.status(400).json({ error: "missing username" });

  const { rows } = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
  if (rows.length > 0) {
    await pool.query(
      "UPDATE users SET username = $1, avatar_image_id = COALESCE($2, avatar_image_id) WHERE id = $3",
      [name, avatarImageId ?? null, userId],
    );
  } else {
    await pool.query(
      "INSERT INTO users (id, username, avatar_image_id, created_at) VALUES ($1, $2, $3, $4)",
      [userId, name, avatarImageId ?? null, Date.now()],
    );
  }
  const user = await getUser(userId);
  return res.json({ user });
});

// Today
app.get("/today", async (_req, res) => {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const msUntilNext = (Math.floor(now.getTime() / 86_400_000) + 1) * 86_400_000 - now.getTime();
  const { rows } = await pool.query("SELECT COUNT(*) AS c FROM posts WHERE day = $1", [day]);
  return res.json({ day, acronym: acronymForDay(day), msUntilNext, postCount: Number(rows[0].c) });
});

// Days
app.get("/days", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT day, COUNT(*) AS c FROM posts GROUP BY day ORDER BY day DESC",
  );
  return res.json({
    days: rows.map((r) => ({ day: r.day, acronym: acronymForDay(r.day), postCount: Number(r.c) })),
  });
});

// Feed
app.get("/feed", async (req, res) => {
  const day = (req.query.day as string) ?? new Date().toISOString().slice(0, 10);
  const sort = (req.query.sort as string) ?? "new";
  const viewerId = req.headers["x-user-id"] as string | null ?? null;
  const { rows } = await pool.query(
    "SELECT * FROM posts WHERE day = $1 ORDER BY created_at DESC",
    [day],
  );
  const posts = await Promise.all(rows.map((r) => decoratePost(r, viewerId)));
  if (sort === "top") posts.sort((a, b) => b.likeCount - a.likeCount || b.createdAt - a.createdAt);
  return res.json({ posts });
});

// Profile
app.get("/profile/:userId", async (req, res) => {
  const user = await getUser(req.params.userId);
  if (!user) return res.status(404).json({ error: "not found" });
  const viewerId = req.headers["x-user-id"] as string | null ?? null;
  const { rows } = await pool.query(
    "SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC",
    [req.params.userId],
  );
  const posts = await Promise.all(rows.map((r) => decoratePost(r, viewerId)));
  return res.json({ user, posts });
});

// Create post
app.post("/posts", async (req, res) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) return res.status(400).json({ error: "missing user" });
  const { caption, imageId, day: bodyDay } = req.body as { caption?: string; imageId?: string; day?: string };
  const text = (caption ?? "").trim();
  if (!imageId || !text) return res.status(400).json({ error: "missing fields" });
  const day = bodyDay ?? new Date().toISOString().slice(0, 10);
  const id = newId();
  await pool.query(
    "INSERT INTO posts (id, user_id, day, acronym, caption, image_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [id, userId, day, acronymForDay(day), text, imageId, Date.now()],
  );
  const { rows } = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
  const post = await decoratePost(rows[0], userId);
  return res.json({ post });
});

// Single post
app.get("/posts/:id", async (req, res) => {
  const viewerId = req.headers["x-user-id"] as string | null ?? null;
  const { rows } = await pool.query("SELECT * FROM posts WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "not found" });
  return res.json({ post: await decoratePost(rows[0], viewerId) });
});

// Toggle like
app.post("/posts/:id/like", async (req, res) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) return res.status(400).json({ error: "missing user" });
  const postId = req.params.id;
  const { rows: existing } = await pool.query(
    "SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2",
    [postId, userId],
  );
  if (existing.length > 0) {
    await pool.query("DELETE FROM likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
  } else {
    await pool.query(
      "INSERT INTO likes (post_id, user_id, created_at) VALUES ($1,$2,$3)",
      [postId, userId, Date.now()],
    );
  }
  const { rows } = await pool.query("SELECT * FROM posts WHERE id = $1", [postId]);
  if (!rows[0]) return res.status(404).json({ error: "not found" });
  return res.json({ post: await decoratePost(rows[0], userId) });
});

// Comments: get
app.get("/posts/:id/comments", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC",
    [req.params.id],
  );
  const comments = await Promise.all(rows.map(async (r) => {
    const user = await getUser(r.user_id);
    return {
      id: r.id,
      text: r.text,
      createdAt: Number(r.created_at),
      username: user?.username ?? "someone",
      avatarImageId: user?.avatarImageId ?? null,
      userId: r.user_id,
    };
  }));
  return res.json({ comments });
});

// Comments: add
app.post("/posts/:id/comments", async (req, res) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) return res.status(400).json({ error: "missing user" });
  const text = ((req.body as { text?: string }).text ?? "").trim();
  if (!text) return res.status(400).json({ error: "empty" });
  const id = newId();
  await pool.query(
    "INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES ($1,$2,$3,$4,$5)",
    [id, req.params.id, userId, text, Date.now()],
  );
  const { rows } = await pool.query(
    "SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC",
    [req.params.id],
  );
  const comments = await Promise.all(rows.map(async (r) => {
    const user = await getUser(r.user_id);
    return {
      id: r.id,
      text: r.text,
      createdAt: Number(r.created_at),
      username: user?.username ?? "someone",
      avatarImageId: user?.avatarImageId ?? null,
      userId: r.user_id,
    };
  }));
  return res.json({ comments });
});

// ── error handler ──────────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "server error" });
});

// ── start ──────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3000);

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to init DB", err);
    process.exit(1);
  });
