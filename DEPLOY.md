# Despliegue en VPS (Docker)

Publica el sistema completo (PostgreSQL + backend + frontend) con Docker Compose.

## 1. Requisitos en el VPS

- Docker y Docker Compose instalados.
- Un dominio apuntando al VPS (para HTTPS).

## 2. Clonar los dos repos como hermanos

```bash
git clone https://github.com/DancingAlien96/cotizador-frontend.git cotizador
git clone https://github.com/DancingAlien96/cotizador-backend.git
cd cotizador-backend
```

Debe quedar:

```text
.../cotizador            (frontend)
.../cotizador-backend    (aquí corres el compose)
```

## 3. Configurar variables

```bash
cp .env.prod.example .env
# edita .env: contraseñas de Postgres, FRONTEND_URL, JWT_SECRET, ADMIN_*
```

Genera un `JWT_SECRET` fuerte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 4. Levantar todo

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Esto: crea la base, aplica migraciones, crea el usuario admin y arranca
backend (interno, puerto 4000) y frontend (puerto 3000).

Solo el **frontend** se expone (3000). El backend y la base quedan internos.

## 5. HTTPS (reverse proxy)

Las cookies de sesión son `secure` en producción, así que **el frontend debe
servirse por HTTPS**. Ejemplo con [Caddy](https://caddyserver.com) (TLS
automático). `Caddyfile`:

```text
cotizador.tu-dominio.com {
    reverse_proxy localhost:3000
}
```

```bash
caddy run   # o como servicio del sistema
```

`FRONTEND_URL` en `.env` debe ser esa misma URL pública (https://...).

## 6. Acceso y usuarios

- Entra en `https://cotizador.tu-dominio.com` con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- Para crear más usuarios (mientras no haya UI), con un token válido:

  ```bash
  # obtener token
  TOKEN=$(curl -s -X POST https://.../ -d ... )  # /api/auth/login
  # crear usuario
  curl -X POST http://localhost:4000/api/users \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"email":"vendedor@promesa.gt","password":"...","nombre":"Vendedor"}'
  ```

## 7. Actualizar

```bash
cd cotizador && git pull && cd ../cotizador-backend && git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Notas

- **Backups**: respalda el volumen `pgdata` (o usa `pg_dump`).
- Cambia `ADMIN_PASSWORD` y crea usuarios reales; no dejes la contraseña de ejemplo.
