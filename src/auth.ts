import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "./env";

const TOKEN_TTL = "7d";

export function signToken(subject: string): string {
  return jwt.sign({ sub: subject }, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

// Middleware: exige un JWT válido en el header Authorization: Bearer <token>.
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "No autorizado." });
    return;
  }

  try {
    jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Sesión inválida o expirada." });
  }
}
