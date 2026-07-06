# Backend Cotizador — Express + Prisma
FROM node:20-slim

# OpenSSL para Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencias (incluye devDeps: se necesitan prisma CLI y tsc para build/migrate)
COPY package*.json ./
RUN npm ci

# Generar cliente Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Compilar TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Aplica migraciones, asegura el usuario admin y arranca el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/index.js"]
