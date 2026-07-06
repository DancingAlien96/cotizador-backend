import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { signToken } from "../auth";

export const authRouter = Router();

// POST /api/auth/login  { email, password } -> { token, user }
authRouter.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    res.status(400).json({ error: "Correo y contraseña son requeridos." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Credenciales inválidas." });
    return;
  }

  res.json({
    token: signToken(user),
    user: { email: user.email, nombre: user.nombre },
  });
});
