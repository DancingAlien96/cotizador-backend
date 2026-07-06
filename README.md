# cotizador-backend

Backend del **Cotizador PROMESA** — TypeScript + Express + Prisma (PostgreSQL).

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` (copia de `.env.example`). Para desarrollo local con
   el contenedor incluido, usa:

   ```dotenv
   DATABASE_URL="postgresql://cotizador:cotizador@localhost:5433/cotizador?schema=public"
   PORT=4000
   CORS_ORIGIN="http://localhost:3000"
   APP_PASSWORD="cotizador2026"
   JWT_SECRET="<secreto largo y aleatorio>"
   ```

3. Levantar PostgreSQL en Docker (puerto **5433** del host para no chocar con un
   PostgreSQL local en 5432):

   ```bash
   docker compose up -d
   ```

4. Crear las tablas:

   ```bash
   npm run prisma:migrate
   ```

5. Arrancar el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   Servidor en `http://localhost:4000`.

## API

Todas las rutas de cotizaciones requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| GET | `/api/health` | Estado del servicio |
| POST | `/api/auth/login` | `{ password }` → `{ token }` (JWT) |
| GET | `/api/cotizaciones/:tipo` | Lista las cotizaciones del tipo |
| GET | `/api/cotizaciones/:tipo/next-numero` | Siguiente folio (sin consumir) |
| POST | `/api/cotizaciones/:tipo` | Crea (`{ data }`) o actualiza (`{ id, data }`) |
| DELETE | `/api/cotizaciones/:tipo/:id` | Elimina |

`:tipo` ∈ `tienda`, `guatecompras`, `empresas`, `carta`, `piscina`.
El folio (`numero`) se autogenera para `empresas`.

## Scripts

- `npm run dev` — servidor con recarga (tsx watch)
- `npm run build` / `npm start` — compilar y ejecutar
- `npm run prisma:migrate` — migraciones de desarrollo
- `npm run prisma:studio` — explorar la base de datos
