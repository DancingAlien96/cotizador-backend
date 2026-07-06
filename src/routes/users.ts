import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";

export const usersRouter = Router();

// La gestión de usuarios requiere estar autenticado.
usersRouter.use(requireAuth);

// GET /api/users -> lista (sin contraseñas)
usersRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, nombre: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

// POST /api/users  { email, password, nombre? } -> crea usuario
usersRouter.post("/", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const nombre = req.body?.nombre ? String(req.body.nombre) : null;

  if (!email || !password) {
    res.status(400).json({ error: "Correo y contraseña son requeridos." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, password: hash, nombre },
    });
    res.status(201).json({ id: user.id, email: user.email, nombre: user.nombre });
  } catch {
    res.status(409).json({ error: "Ya existe un usuario con ese correo." });
  }
});

// DELETE /api/users/:id
usersRouter.delete("/:id", async (req, res) => {
  await prisma.user.deleteMany({ where: { id: req.params.id } });
  res.status(204).end();
});
