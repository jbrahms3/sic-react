import { verifyToken } from "@clerk/backend";
import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  userId?: string;
}

async function verify(token: string): Promise<string> {
  const payload = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY!,
  });
  return payload.sub;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    req.userId = await verify(token);
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      req.userId = await verify(token);
    } catch {
      // treat as unauthenticated
    }
  }
  next();
}
