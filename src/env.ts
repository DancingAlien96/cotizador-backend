import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  appPassword: required("APP_PASSWORD", "cotizador2026"),
  jwtSecret: required("JWT_SECRET", "dev-insecure-jwt-secret-change-me"),
  databaseUrl: process.env.DATABASE_URL ?? "",
};
