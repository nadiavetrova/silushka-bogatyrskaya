import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { prisma } from "../lib/prisma";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { userId } = verifyToken(header.slice(7));
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Middleware для проверки что email подтверждён
export function verifiedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { userId } = verifyToken(header.slice(7));
    req.userId = userId;

    prisma.user
      .findUnique({ where: { id: userId }, select: { emailVerified: true } })
      .then((user) => {
        if (!user) {
          res.status(401).json({ message: "User not found" });
          return;
        }
        if (!user.emailVerified) {
          res.status(403).json({ message: "Email not verified", code: "EMAIL_NOT_VERIFIED" });
          return;
        }
        next();
      })
      .catch(() => {
        res.status(500).json({ message: "Server error" });
      });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
