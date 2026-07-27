import { Router } from "express";
import { requireAuth } from "../auth";
import { buscarFrases } from "../frases";

export const frasesRouter = Router();
frasesRouter.use(requireAuth);

const CAMPOS = new Set(["descripcion", "termino", "observacion", "concepto"]);

// GET /api/frases?campo=&q=&limit=  -> frases sugeridas (las más usadas primero)
frasesRouter.get("/", async (req, res) => {
  const campo = String(req.query.campo ?? "").toLowerCase();
  if (!CAMPOS.has(campo)) {
    res.status(400).json({ error: "Campo inválido." });
    return;
  }
  const q = String(req.query.q ?? "");
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
  res.json(await buscarFrases(campo, q, limit));
});
