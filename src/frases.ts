import { Prisma, TipoCotizacion } from "@prisma/client";
import { prisma } from "./prisma";

// Campos de autocompletado que se aprenden. El valor son las "claves" dentro
// del JSON `data` de cada tipo de cotización de las que se extraen frases.
export type CampoFrase = "descripcion" | "termino" | "observacion" | "concepto";

// Frases demasiado largas no son reutilizables y además chocarían con el
// límite del índice único; se ignoran.
const MAX_LEN = 300;

function limpiar(texto: unknown): string | null {
  if (typeof texto !== "string") return null;
  const t = texto.trim();
  if (t.length < 3 || t.length > MAX_LEN) return null;
  return t;
}

// De un `data` (JSON del frontend) saca las frases por campo, según el tipo.
function extraer(tipo: TipoCotizacion, data: unknown): Map<CampoFrase, string[]> {
  const out = new Map<CampoFrase, string[]>();
  const push = (campo: CampoFrase, valor: unknown) => {
    const t = limpiar(valor);
    if (!t) return;
    const arr = out.get(campo) ?? [];
    if (!arr.includes(t)) arr.push(t);
    out.set(campo, arr);
  };

  const d = (data ?? {}) as Record<string, unknown>;
  const items = Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : [];
  for (const it of items) push("descripcion", it?.descripcion);

  if (Array.isArray(d.terminos)) for (const t of d.terminos) push("termino", t);
  if (Array.isArray(d.observaciones))
    for (const o of d.observaciones) push("observacion", o);
  if (tipo === TipoCotizacion.EMPRESAS) push("concepto", d.concepto);

  return out;
}

// Registra (o incrementa el uso de) las frases de una cotización guardada.
// Nunca lanza: si algo falla, guardar la cotización no debe verse afectado.
export async function registrarFrases(
  tipo: TipoCotizacion,
  data: unknown,
): Promise<void> {
  try {
    const porCampo = extraer(tipo, data);
    const tareas: Promise<unknown>[] = [];
    for (const [campo, frases] of porCampo) {
      for (const texto of frases) {
        tareas.push(
          prisma.frase.upsert({
            where: { campo_texto: { campo, texto } },
            create: { campo, texto },
            update: { usos: { increment: 1 } },
          }),
        );
      }
    }
    await Promise.all(tareas);
  } catch (e) {
    console.error("No se pudieron registrar frases:", e);
  }
}

// Busca frases de un campo, las más usadas primero.
export async function buscarFrases(
  campo: string,
  q: string,
  limit: number,
): Promise<string[]> {
  const where: Prisma.FraseWhereInput = { campo };
  if (q.trim()) where.texto = { contains: q.trim(), mode: "insensitive" };
  const filas = await prisma.frase.findMany({
    where,
    orderBy: [{ usos: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: { texto: true },
  });
  return filas.map((f) => f.texto);
}
