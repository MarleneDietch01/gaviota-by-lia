# LOCAL_SETUP.md — Entorno de desarrollo local

Supabase local mediante Supabase CLI + Docker. **No se vincula a Supabase Cloud**
en esta fase.

---

## 1. Requisito previo: Docker

`supabase start` levanta el stack completo en contenedores. Sin un motor de
contenedores no arranca.

**Estado verificado en esta máquina el 3 de agosto de 2026:**

| Comprobación | Resultado |
|---|---|
| Node.js | ✅ v20.19.0 |
| npm | ✅ 11.2.0 |
| Supabase CLI | ✅ 2.111.0 (dependencia de desarrollo) |
| Virtualización de hardware | ✅ habilitada |
| WSL | ✅ versión 2 por defecto |
| Distribución WSL instalada | ⚠️ ninguna |
| **Docker / Podman** | ❌ **no instalado** |
| Permisos de administrador | ❌ la sesión actual no es de administrador |
| RAM | ✅ 15,8 GB |
| Espacio libre en C: | ⚠️ 15,4 GB |

Error exacto devuelto por `npx supabase start`:

```
LegacyDockerLifecycleInspectError: failed to inspect container health:
docker: command not found (podman also not found)
— install Docker Desktop or Podman and ensure it is on PATH
```

### Instalación de Docker Desktop

Requiere **privilegios de administrador**, por lo que debe ejecutarlo la persona
usuaria. Desde una terminal **abierta como administrador**:

```powershell
winget install --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
```

Después:

1. Iniciar **Docker Desktop** y esperar a que el icono indique *Engine running*.
2. En *Settings → General*, dejar marcado **Use WSL 2 based engine**.
3. Cerrar y reabrir la terminal para que `docker` entre en el `PATH`.
4. Comprobar: `docker info`

**Sobre el espacio en disco.** Quedan 15,4 GB libres en `C:`. Docker Desktop
ocupa unos 3 GB y las imágenes del stack de Supabase entre 5 y 8 GB más. Entra,
pero con poco margen. Si el espacio se queda corto, se puede mover el disco
virtual de WSL a otra unidad desde *Settings → Resources → Disk image location*.

**Alternativa sin Docker Desktop.** Podman también funciona y es más ligero:

```powershell
winget install --id RedHat.Podman
podman machine init
podman machine start
```

La CLI de Supabase detecta Podman automáticamente.

---

## 2. Arranque

```bash
npm install
cp .env.local.example .env.local     # PowerShell: Copy-Item .env.local.example .env.local

npm run db:start      # levanta el stack (la primera vez descarga ~5-8 GB)
npm run db:status     # confirma las claves reales y contrástalas con .env.local
```

Aplicar migraciones y seeds:

```bash
npm run db:reset      # 18 migraciones + seeds de desarrollo
```

Verificar:

```bash
npm run db:test       # 82 aserciones pgTAP
npm run db:lint       # lint de base de datos, nivel error
npm run db:types      # genera src/types/database.types.ts
```

O todo de una vez:

```bash
npm run db:verify     # reset + test + lint
```

---

## 3. Servicios locales

| Servicio | URL | Uso |
|---|---|---|
| API (PostgREST + GoTrue) | http://127.0.0.1:54321 | `NEXT_PUBLIC_SUPABASE_URL` |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | Conexión directa |
| **Studio** | **http://127.0.0.1:54323** | Panel visual de la base de datos |
| **Mailpit** | **http://127.0.0.1:54324** | Captura TODO el correo saliente |
| Storage (S3) | http://127.0.0.1:54321/storage/v1 | Buckets |
| Analytics | http://127.0.0.1:54327 | Logs |

Mailpit es especialmente útil aquí: permite revisar las plantillas de correo
transaccional de la Fase 5 sin clave de Resend y sin enviar nada real.

---

## 4. Comandos de uso diario

| Acción | Comando |
|---|---|
| Arrancar | `npm run db:start` |
| Parar (conserva los datos) | `npm run db:stop` |
| Parar y borrar los datos | `npm run db:stop:clean` |
| Ver estado y claves | `npm run db:status` |
| Reaplicar todo desde cero | `npm run db:reset` |
| Ejecutar pruebas pgTAP | `npm run db:test` |
| Lint de base de datos | `npm run db:lint` |
| Regenerar los tipos | `npm run db:types` |
| Pruebas de RLS vía PostgREST | `npm run test:rls` |

`db:stop` conserva el volumen: al volver a arrancar, los datos siguen ahí.
`db:stop:clean` lo descarta, y el siguiente `db:start` + `db:reset` deja una base
completamente limpia.

---

## 5. Dos suites de pruebas complementarias

| Suite | Comando | Qué prueba |
|---|---|---|
| **pgTAP** (82 aserciones) | `npm run db:test` | Restricciones, funciones y RLS **a nivel de motor**, cambiando de rol con `set local role` |
| **Vitest** (42 pruebas) | `npm run test:rls` | Las mismas políticas **a través de PostgREST**, que es el camino real de la aplicación |

No son redundantes. PostgREST introduce matices propios: una política que filtra
filas devuelve `[]` en lugar de un error, y eso cambia cómo debe reaccionar el
código de la aplicación. La suite pgTAP demuestra que la regla existe; la de
Vitest, que la aplicación la recibe como espera.

---

## 6. Compatibilidad con Supabase Cloud

Las 18 migraciones son SQL estándar y se aplican tal cual a un proyecto de
producción. Precauciones ya tomadas:

- Las extensiones se instalan en el esquema `extensions`, como hace Supabase Cloud.
- No se usa ninguna función exclusiva del entorno local.
- `pgtap` **no** se crea en ninguna migración: solo dentro de los archivos de
  prueba, que se ejecutan en transacciones con `rollback`. La extensión nunca
  llega a producción.
- Los seeds viven en `supabase/seed/dev.sql`, fuera de `migrations/`, y abortan
  si detectan pedidos en la base de datos.

Cuando llegue el momento (Fase 8):

```bash
npx supabase link --project-ref <ref-de-produccion>
npx supabase db push
```

---

## 7. Credenciales de desarrollo

Creadas por los seeds. **Son públicas y solo válidas en local.**

| Correo | Contraseña | Rol |
|---|---|---|
| `cliente.a@ejemplo.test` | `DevPassword123!` | customer |
| `cliente.b@ejemplo.test` | `DevPassword123!` | customer |
| `admin@ejemplo.test` | `DevPassword123!` | admin |
| `superadmin@ejemplo.test` | `DevPassword123!` | super_admin |
