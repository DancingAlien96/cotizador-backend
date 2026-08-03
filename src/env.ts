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
  jwtSecret: required("JWT_SECRET", "dev-insecure-jwt-secret-change-me"),
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Inventario externo (SoluPOS). La llave nunca sale del backend.
  soluposUrl:
    process.env.SOLUPOS_API_URL ??
    "https://promesa.soluticgt.com/index.php/api/v1",
  soluposKey: process.env.SOLUPOS_API_KEY ?? "",
};
