import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";

export const clientesRouter = Router();
clientesRouter.use(requireAuth);

function str(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

// GET /api/clientes?q=&limit=  -> lista para el autocompletado
clientesRouter.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

  const where: Prisma.ClienteWhereInput = q
    ? {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { nit: { contains: q, mode: "insensitive" } },
          { contacto: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const items = await prisma.cliente.findMany({
    where,
    orderBy: { nombre: "asc" },
    take: limit,
  });
  res.json(items);
});

// POST /api/clientes  { id?, nombre, ... } -> crea o actualiza
// El nombre es único: si ya existe un cliente con ese nombre se actualiza,
// así guardar desde una cotización no duplica el registro.
clientesRouter.post("/", async (req, res) => {
  const nombre = str(req.body?.nombre);
  if (!nombre) {
    res.status(400).json({ error: "El nombre del cliente es obligatorio." });
    return;
  }
  const campos = {
    nit: str(req.body?.nit),
    direccion: str(req.body?.direccion),
    telefono: str(req.body?.telefono),
    correo: str(req.body?.correo),
    contacto: str(req.body?.contacto),
    notas: str(req.body?.notas),
  };

  const id = str(req.body?.id);
  if (id) {
    const existing = await prisma.cliente.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Cliente no encontrado." });
      return;
    }
    // Renombrar a un nombre ya usado por otro cliente choca con el índice único.
    const choque = await prisma.cliente.findUnique({ where: { nombre } });
    if (choque && choque.id !== id) {
      res.status(409).json({ error: "Ya existe otro cliente con ese nombre." });
      return;
    }
    res.json(
      await prisma.cliente.update({ where: { id }, data: { nombre, ...campos } }),
    );
    return;
  }

  // Sin id: crea, o completa el existente sin borrar lo que ya tenía con
  // valores vacíos (un formato que no maneja NIT no debe limpiar el NIT).
  const existing = await prisma.cliente.findUnique({ where: { nombre } });
  if (!existing) {
    res.status(201).json(await prisma.cliente.create({ data: { nombre, ...campos } }));
    return;
  }
  const merge = Object.fromEntries(
    Object.entries(campos).filter(([, v]) => v !== null),
  );
  res.json(
    await prisma.cliente.update({ where: { id: existing.id }, data: merge }),
  );
});

// DELETE /api/clientes/:id
clientesRouter.delete("/:id", async (req, res) => {
  await prisma.cliente.deleteMany({ where: { id: req.params.id } });
  res.status(204).end();
});
