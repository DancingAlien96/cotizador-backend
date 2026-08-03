import { Router } from "express";
import { env } from "../env";
import { requireAuth } from "../auth";

export const productosRouter = Router();
productosRouter.use(requireAuth);

// Cómo llega cada artículo del inventario externo (SoluPOS). Solo se usan
// algunos campos; el resto se ignora.
type ItemExterno = {
  item_id: number;
  name: string;
  unit_price: string | null;
  category: string | null;
  item_number: string | null;
  item_inactive: boolean;
  is_service: boolean;
};

// Lo que devolvemos al frontend: liviano y ya limpio.
type Producto = {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
};

// GET /api/productos?search=&limit=  -> productos del inventario SoluPOS
// El backend hace la llamada (con la API key) para que la llave nunca salga
// al navegador y no haya problemas de CORS.
productosRouter.get("/", async (req, res) => {
  if (!env.soluposKey) {
    res.status(503).json({ error: "Inventario externo no configurado." });
    return;
  }

  const search = String(req.query.search ?? "").trim();
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));

  const url = new URL(`${env.soluposUrl}/items`);
  url.searchParams.set("limit", String(limit));
  if (search) url.searchParams.set("search", search);

  try {
    const r = await fetch(url, {
      headers: {
        "x-api-key": env.soluposKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      res.status(502).json({ error: `El inventario respondió ${r.status}.` });
      return;
    }
    const data = (await r.json()) as ItemExterno[];
    const productos: Producto[] = (Array.isArray(data) ? data : [])
      .filter((it) => it && !it.item_inactive)
      .map((it) => ({
        id: it.item_id,
        nombre: String(it.name ?? "").trim(),
        precio: Number(it.unit_price ?? 0) || 0,
        categoria: String(it.category ?? "").trim(),
      }))
      .filter((p) => p.nombre);
    res.json(productos);
  } catch (e) {
    console.error("Error consultando inventario SoluPOS:", e);
    res.status(502).json({ error: "No se pudo consultar el inventario." });
  }
});
