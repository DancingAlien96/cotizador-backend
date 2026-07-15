import { Router } from "express";
import { Prisma, TipoCotizacion } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";

export const cotizacionesRouter = Router();

// Todas las rutas requieren sesión.
cotizacionesRouter.use(requireAuth);

const TIPOS: Record<string, TipoCotizacion> = {
  tienda: TipoCotizacion.TIENDA,
  guatecompras: TipoCotizacion.GUATECOMPRAS,
  empresas: TipoCotizacion.EMPRESAS,
  carta: TipoCotizacion.CARTA,
  piscina: TipoCotizacion.PISCINA,
};

// Folio autogenerado: Tienda y Empresas comparten un mismo correlativo.
const FOLIO_INICIAL = 1000;
const CLAVE_FOLIO: Partial<Record<TipoCotizacion, string>> = {
  [TipoCotizacion.TIENDA]: "cotizaciones",
  [TipoCotizacion.EMPRESAS]: "cotizaciones",
};

function parseTipo(value: string): TipoCotizacion | null {
  return TIPOS[value.toLowerCase()] ?? null;
}

function formatNumero(seq: number): string {
  return String(seq);
}

// GET /api/cotizaciones/:tipo -> lista
cotizacionesRouter.get("/:tipo", async (req, res) => {
  const tipo = parseTipo(req.params.tipo);
  if (!tipo) {
    res.status(400).json({ error: "Tipo de cotización inválido." });
    return;
  }
  const items = await prisma.cotizacion.findMany({
    where: { tipo },
    orderBy: { updatedAt: "desc" },
  });
  res.json(items);
});

// GET /api/cotizaciones/:tipo/next-numero -> { numero } (siguiente folio sin consumir)
cotizacionesRouter.get("/:tipo/next-numero", async (req, res) => {
  const tipo = parseTipo(req.params.tipo);
  if (!tipo) {
    res.status(400).json({ error: "Tipo de cotización inválido." });
    return;
  }
  const clave = CLAVE_FOLIO[tipo];
  if (!clave) {
    res.json({ numero: "" });
    return;
  }
  const counter = await prisma.counter.findUnique({ where: { clave } });
  res.json({
    numero: formatNumero(counter ? counter.seq + 1 : FOLIO_INICIAL),
  });
});

// POST /api/cotizaciones/:tipo  { id?, data } -> cotización guardada
cotizacionesRouter.post("/:tipo", async (req, res) => {
  const tipo = parseTipo(req.params.tipo);
  if (!tipo) {
    res.status(400).json({ error: "Tipo de cotización inválido." });
    return;
  }
  const { id, data, nombre, autor, cliente, total, fecha } = req.body ?? {};
  if (data === undefined || data === null) {
    res.status(400).json({ error: "Falta el campo 'data'." });
    return;
  }

  const resumen = {
    nombre: nombre != null ? String(nombre) : null,
    autor: autor != null ? String(autor) : null,
    cliente: cliente != null ? String(cliente) : null,
    total: total != null && !Number.isNaN(Number(total)) ? Number(total) : null,
    fecha: fecha != null ? String(fecha) : null,
  };

  // Actualización
  if (id) {
    const existing = await prisma.cotizacion.findUnique({ where: { id } });
    if (existing && existing.tipo === tipo) {
      const updated = await prisma.cotizacion.update({
        where: { id },
        data: { data: data as Prisma.InputJsonValue, ...resumen },
      });
      res.json(updated);
      return;
    }
  }

  // Creación (con folio si aplica, en una transacción para evitar colisiones)
  const created = await prisma.$transaction(async (tx) => {
    let numero: string | null = null;
    const clave = CLAVE_FOLIO[tipo];
    if (clave) {
      const counter = await tx.counter.upsert({
        where: { clave },
        create: { clave, seq: FOLIO_INICIAL },
        update: { seq: { increment: 1 } },
      });
      numero = formatNumero(counter.seq);
    }
    return tx.cotizacion.create({
      data: { tipo, numero, data: data as Prisma.InputJsonValue, ...resumen },
    });
  });

  res.status(201).json(created);
});

// DELETE /api/cotizaciones/:tipo/:id
cotizacionesRouter.delete("/:tipo/:id", async (req, res) => {
  const tipo = parseTipo(req.params.tipo);
  if (!tipo) {
    res.status(400).json({ error: "Tipo de cotización inválido." });
    return;
  }
  await prisma.cotizacion.deleteMany({
    where: { id: req.params.id, tipo },
  });
  res.status(204).end();
});
