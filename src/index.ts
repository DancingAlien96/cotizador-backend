import express from "express";
import cors from "cors";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { cotizacionesRouter } from "./routes/cotizaciones";
import { usersRouter } from "./routes/users";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "10mb" }));

// Salud
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "cotizador-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/cotizaciones", cotizacionesRouter);

// Manejo de errores
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor." });
  },
);

app.listen(env.port, () => {
  console.log(`cotizador-backend escuchando en http://localhost:${env.port}`);
});
