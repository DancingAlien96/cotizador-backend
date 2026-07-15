import { Router } from "express";
import { EstadoCotizacion, Prisma, TipoCotizacion } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";

export const reportesRouter = Router();
reportesRouter.use(requireAuth);

const TIPOS: Record<string, TipoCotizacion> = {
  tienda: TipoCotizacion.TIENDA,
  guatecompras: TipoCotizacion.GUATECOMPRAS,
  empresas: TipoCotizacion.EMPRESAS,
  carta: TipoCotizacion.CARTA,
  piscina: TipoCotizacion.PISCINA,
};

// GET /api/reportes?desde=&hasta=&tipo=
// Todo el reporte de cierre en una sola llamada. Las fechas filtran por
// createdAt (cuándo se hizo la cotización), no por cuándo se cerró.
reportesRouter.get("/", async (req, res) => {
  const tipo = TIPOS[String(req.query.tipo ?? "").toLowerCase()];
  const desde = req.query.desde ? new Date(String(req.query.desde)) : null;
  const hasta = req.query.hasta ? new Date(String(req.query.hasta)) : null;
  if ((desde && Number.isNaN(desde.getTime())) || (hasta && Number.isNaN(hasta.getTime()))) {
    res.status(400).json({ error: "Rango de fechas inválido." });
    return;
  }

  const where: Prisma.CotizacionWhereInput = {};
  if (tipo) where.tipo = tipo;
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = desde;
    // `hasta` es inclusivo: se toma el final de ese día.
    if (hasta) {
      const fin = new Date(hasta);
      fin.setHours(23, 59, 59, 999);
      where.createdAt.lte = fin;
    }
  }

  const [porEstado, porMotivo, filas] = await Promise.all([
    // Embudo: cuántas y cuánto hay en cada etapa.
    prisma.cotizacion.groupBy({
      by: ["estado"],
      where,
      _count: true,
      _sum: { total: true },
    }),
    // Por qué se pierden.
    prisma.cotizacion.groupBy({
      by: ["motivoRechazo"],
      where: { ...where, estado: EstadoCotizacion.RECHAZADA },
      _count: true,
      _sum: { total: true },
    }),
    // Desglose por asesor y por tipo (se agrupa abajo, en JS).
    prisma.cotizacion.findMany({
      where,
      select: { autor: true, tipo: true, estado: true, total: true },
    }),
  ]);

  const embudo = Object.values(EstadoCotizacion).map((estado) => {
    const g = porEstado.find((x) => x.estado === estado);
    return { estado, cantidad: g?._count ?? 0, monto: g?._sum.total ?? 0 };
  });

  const total = embudo.reduce((a, e) => a + e.cantidad, 0);
  const montoTotal = embudo.reduce((a, e) => a + e.monto, 0);
  const ganadas = embudo.find((e) => e.estado === EstadoCotizacion.CONFIRMADA)!;
  const perdidas = embudo.find((e) => e.estado === EstadoCotizacion.RECHAZADA)!;
  // La tasa de cierre solo cuenta lo ya resuelto: lo que sigue abierto todavía
  // no se ganó ni se perdió, e incluirlo hundiría el porcentaje sin razón.
  const cerradas = ganadas.cantidad + perdidas.cantidad;

  function agrupar(clave: "autor" | "tipo") {
    const mapa = new Map<
      string,
      {
        clave: string;
        total: number;
        ganadas: number;
        perdidas: number;
        monto: number;
        montoGanado: number;
      }
    >();
    for (const f of filas) {
      const k = (clave === "autor" ? f.autor : f.tipo) || "—";
      const acc =
        mapa.get(k) ??
        { clave: k, total: 0, ganadas: 0, perdidas: 0, monto: 0, montoGanado: 0 };
      acc.total += 1;
      acc.monto += f.total ?? 0;
      if (f.estado === EstadoCotizacion.CONFIRMADA) {
        acc.ganadas += 1;
        acc.montoGanado += f.total ?? 0;
      }
      // `perdidas` va aparte para calcular la tasa de cierre igual que arriba:
      // sobre lo ya resuelto, sin contar lo que sigue abierto.
      if (f.estado === EstadoCotizacion.RECHAZADA) acc.perdidas += 1;
      mapa.set(k, acc);
    }
    return [...mapa.values()].sort((a, b) => b.montoGanado - a.montoGanado);
  }

  res.json({
    embudo,
    resumen: {
      total,
      montoTotal,
      ganadas: ganadas.cantidad,
      montoGanado: ganadas.monto,
      perdidas: perdidas.cantidad,
      montoPerdido: perdidas.monto,
      abiertas: total - cerradas,
      tasaCierre: cerradas > 0 ? ganadas.cantidad / cerradas : null,
    },
    motivos: porMotivo
      .map((m) => ({
        motivo: m.motivoRechazo ?? "Sin motivo",
        cantidad: m._count,
        monto: m._sum.total ?? 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad),
    porAsesor: agrupar("autor"),
    porTipo: agrupar("tipo"),
  });
});
