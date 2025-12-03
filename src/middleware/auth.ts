import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "../lib/token";
import { getUserById } from "../services/userService";
import { isAdminEmail } from "../lib/admin";

export type AuthedRequest = Request & {
  userId?: string;
  isAdmin?: boolean;
};

export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireAdmin: RequestHandler = async (req: AuthedRequest, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await getUserById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!isAdminEmail(user.email)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};

