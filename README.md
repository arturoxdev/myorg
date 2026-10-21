# Tareas

Gestor de tareas con Next.js 16, shadcn/ui, PostgreSQL (Drizzle) y Cloudflare R2.

## Puesta en marcha

```bash
cp .env.example .env        # completa AUTH_*, R2_* y DATABASE_URL
docker compose up -d        # Postgres local en el puerto 5433 (opcional si ya tienes uno)
npm run db:migrate          # crea las tablas
npm run dev
```

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `AUTH_USERNAME` / `AUTH_PASSWORD` | Credenciales del login |
| `AUTH_SECRET` | Secreto para firmar la cookie de sesión (`openssl rand -base64 32`) |
| `R2_ENDPOINT` | Endpoint S3 de la cuenta de Cloudflare R2 |
| `R2_BUCKET` | Nombre del bucket |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Token de API de R2 con permiso de lectura/escritura |

Las imágenes se sirven a través de `/api/files/...`, que exige sesión, así que el bucket puede permanecer privado.

## Scripts de base de datos

- `npm run db:generate` — genera una migración tras cambiar `src/db/schema.ts`
- `npm run db:migrate` — aplica migraciones
- `npm run db:studio` — abre Drizzle Studio
