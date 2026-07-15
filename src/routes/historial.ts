import { Router } from "express";
import { EstadoCotizacion, Prisma, TipoCotizacion } from "@prisma/client";
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

const ESTADOS: Record<string, EstadoCotizacion> = {
  pendiente: EstadoCotizacion.PENDIENTE,
  en_curso: EstadoCotizacion.EN_CURSO,
  confirmada: EstadoCotizacion.CONFIRMADA,
  rechazada: EstadoCotizacion.RECHAZADA,
};

// GET /api/historial/tablero?tipo=&q=
// Todas las cotizaciones agrupadas por estado, para la vista Kanban. Cada
// columna trae como máximo TABLERO_POR_COLUMNA tarjetas (las más recientes),
// pero el conteo y el monto son del total real de la columna.
const TABLERO_POR_COLUMNA = 50;

historialRouter.get("/tablero", async (req, res) => {
  const tipo = TIPOS[String(req.query.tipo ?? "").toLowerCase()];
  const q = String(req.query.q ?? "").trim();

  const base: Prisma.CotizacionWhereInput = {};
  if (tipo) base.tipo = tipo;
  if (q) {
    base.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { autor: { contains: q, mode: "insensitive" } },
      { cliente: { contains: q, mode: "insensitive" } },
      { numero: { contains: q, mode: "insensitive" } },
    ];
  }

  const columnas = await Promise.all(
    Object.values(EstadoCotizacion).map(async (estado) => {
      const where = { ...base, estado };
      const [items, agg] = await Promise.all([
        prisma.cotizacion.findMany({
          where,
          orderBy: { estadoAt: "desc" },
          take: TABLERO_POR_COLUMNA,
          select: {
            id: true,
            tipo: true,
            numero: true,
            nombre: true,
            autor: true,
            cliente: true,
            total: true,
            fecha: true,
            estado: true,
            motivoRechazo: true,
            estadoAt: true,
            updatedAt: true,
          },
        }),
        prisma.cotizacion.aggregate({
          where,
          _count: true,
          _sum: { total: true },
        }),
      ]);
      return {
        estado,
        items,
        total: agg._count,
        monto: agg._sum.total ?? 0,
      };
    }),
  );

  res.json({ columnas, porColumna: TABLERO_POR_COLUMNA });
});

// GET /api/historial?tipo=&estado=&q=&limit=&offset=
// Listado ligero (sin el campo `data`) de todas las cotizaciones, paginado.
historialRouter.get("/", async (req, res) => {
  const tipo = TIPOS[String(req.query.tipo ?? "").toLowerCase()];
  const estado = ESTADOS[String(req.query.estado ?? "").toLowerCase()];
  const q = String(req.query.q ?? "").trim();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const where: Prisma.CotizacionWhereInput = {};
  if (tipo) where.tipo = tipo;
  if (estado) where.estado = estado;
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
        estado: true,
        motivoRechazo: true,
        estadoAt: true,
        updatedAt: true,
      },
    }),
    prisma.cotizacion.count({ where }),
  ]);

  res.json({ items, total, limit, offset });
});
