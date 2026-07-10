import { Router } from "express";
import { Prisma, TipoCotizacion } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";

export const historialRouter = Router();
historialRouter.use(requireAuth);

const TIPOS: Record<string, TipoCotizacion> = {
  tienda: TipoCotizacion.TIENDA,
  guatecompras: TipoCotizacion.GUATECOMPRAS,
  empresas: TipoCotizacion.EMPRESAS,
  carta: TipoCotizacion.CARTA,
  piscina: TipoCotizacion.PISCINA,
};

// GET /api/historial?tipo=&q=&limit=&offset=
// Listado ligero (sin el campo `data`) de todas las cotizaciones, paginado.
historialRouter.get("/", async (req, res) => {
  const tipo = TIPOS[String(req.query.tipo ?? "").toLowerCase()];
  const q = String(req.query.q ?? "").trim();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const where: Prisma.CotizacionWhereInput = {};
  if (tipo) where.tipo = tipo;
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { autor: { contains: q, mode: "insensitive" } },
      { cliente: { contains: q, mode: "insensitive" } },
      { numero: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.cotizacion.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        tipo: true,
        numero: true,
        nombre: true,
        autor: true,
        cliente: true,
        total: true,
        fecha: true,
        updatedAt: true,
      },
    }),
    prisma.cotizacion.count({ where }),
  ]);

  res.json({ items, total, limit, offset });
});
