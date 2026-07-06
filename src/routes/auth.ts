import { Router } from "express";
import { env } from "../env";
import { signToken } from "../auth";

export const authRouter = Router();

// POST /api/auth/login  { password } -> { token }
authRouter.post("/login", (req, res) => {
  const password = String(req.body?.password ?? "");
  if (!password || password !== env.appPassword) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }
  res.json({ token: signToken("admin") });
});
