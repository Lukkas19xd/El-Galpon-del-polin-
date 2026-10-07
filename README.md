# Agroforestal Monte Redondo SPA

Tienda web para reservar **polines impregnados** y **leña seca en saco**. El cliente
elige los productos y la fecha de retiro, y **paga al retirar en el galpón** (no hay
pago en línea). Cada reserva le llega por correo al negocio.

## Qué hace

**Para el cliente**
- Catálogo con buscador y filtros por tipo y categoría (enlaces directos, ej: `#/productos?categoria=lena`).
- Carrito y reserva con fecha de retiro: solo días con atención, hasta 30 días de anticipación.
- Correo de confirmación con el código de reserva, el detalle, la dirección y el horario.
- Aviso por correo cuando su pedido está listo para retirar.
- "Mis reservas" con el estado de cada una, y perfil con cambio de contraseña.
- Ubicación, horario, mapa y botón de WhatsApp.

**Para el administrador**
- Correo por cada reserva nueva: quién reservó, qué lleva, el total y cuándo retira.
- Vista de **Retiros** agrupada por día (hoy, mañana, atrasadas) con botones para avanzar el estado.
- Estados: `pendiente → confirmada → lista para retiro → retirada`, o `cancelada` (devuelve el stock).
- Crear, editar y ocultar productos (con foto); activar o desactivar cuentas y cambiar roles.

## Tecnologías

| Parte | Tecnologías |
|---|---|
| Backend | Node.js, Express, PostgreSQL (`pg`), JWT, Nodemailer (Gmail), helmet, express-rate-limit, express-validator |
| Frontend | HTML + JavaScript sin framework, Tailwind CSS (compilado) |
| Tests | Jest + Supertest, con base de datos propia |

## Requisitos

- Node.js 18 o superior
- Docker (para levantar PostgreSQL), o un PostgreSQL 13+ propio
- Una cuenta de Gmail con **contraseña de aplicación**, para enviar los correos (opcional en desarrollo)

## Instalación

```bash
# 1. Dependencias (o ejecuta ./install.sh, que hace lo mismo)
cd backend && npm install
cd ../frontend && npm install

# 2. Base de datos
cd ../backend
docker compose up -d          # PostgreSQL en el puerto 5433

# 3. Variables de entorno
cp .env.example .env          # y completa los valores (ver más abajo)

# 4. Productos y usuarios de prueba
npm run seed
```

El esquema de la base de datos (`backend/sql/schema.sql`) se aplica solo cada vez
que arranca el backend.

`npm run seed` crea estos usuarios de prueba. **Cambia la contraseña del admin antes de publicar.**

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@example.com` | `admin123` |
| Cliente | `cliente@example.com` | `cliente123` |

## Desarrollo

Se usan dos terminales:

```bash
# Terminal 1: API en http://localhost:3000/api
cd backend && npm run dev

# Terminal 2: página en http://localhost:8000 (también recompila el CSS al guardar)
cd frontend && npm run dev
```

Abre **http://localhost:8000**.

## Configuración

### Variables de entorno (`backend/.env`)

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `DATABASE_URL_TEST` | Base de los tests (opcional; por defecto la misma con `_test` al final) |
| `PORT`, `HOST` | Dónde escucha el backend |
| `NODE_ENV` | `development` muestra el detalle de los errores; en el servidor real, `production` |
| `JWT_SECRET` | Clave para firmar las sesiones. En producción el servidor no arranca si es la de ejemplo o tiene menos de 32 caracteres |
| `JWT_EXPIRE` | Duración de la sesión (ej: `7d`) |
| `FRONTEND_URL` | Origen permitido por CORS |
| `TRUST_PROXY` | `1` si el servidor está detrás de un proxy (Nginx, Render, Railway…) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Cuenta que envía los correos. Si quedan vacías, todo funciona igual pero no se envían correos |
| `CORREO_RESERVAS` | Quién recibe el aviso de cada reserva (por defecto, `GMAIL_USER`) |

Para generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

La contraseña de aplicación de Gmail se crea en *Cuenta de Google → Seguridad →
Verificación en 2 pasos → Contraseñas de aplicaciones*.

### Datos del negocio y catálogo

| Archivo | Qué contiene | Después de editar |
|---|---|---|
| `backend/data/negocio.js` | Dirección, comuna, ubicación para el mapa, WhatsApp, horario, días de retiro, anticipación máxima y reservas activas por cliente | Reiniciar el backend |
| `backend/data/catalogo.js` | Productos con precio, stock y descripción | `npm run seed` (actualiza por nombre, no duplica) |

> ⚠️ Los precios, el stock, la dirección, el horario y el WhatsApp actuales son **provisorios**.

## Tests

```bash
cd backend && npm test
```

Los tests usan una base de datos propia (se crea sola y se vacía en cada corrida),
no ocupan ningún puerto y no envían correos, así que se pueden correr con el servidor
de desarrollo encendido. Cubren, entre otras cosas, que dos reservas simultáneas no
vendan más stock del que hay.

## Estructura

```
backend/
  data/            catálogo y datos del negocio (editables)
  sql/schema.sql   esquema de PostgreSQL
  seed.js          carga el catálogo y los usuarios de prueba
  src/
    app.js         aplicación Express (middlewares, seguridad, rutas)
    index.js       arranca el servidor
    controllers/   lógica de cada recurso
    models/        consultas a PostgreSQL
    middlewares/   autenticación, validaciones y límites de peticiones
    routes/        rutas de la API
    utils/         correos, errores, constantes, logs
  tests/           tests de la API y configuración de la base de prueba
frontend/
  index.html       estructura de la página y menú
  src/sections/    cada vista (inicio, catálogo, carrito, admin…)
  src/js/          lógica separada por área (catálogo, carrito, cuenta, admin, navegación…)
  src/css/         entrada.css (fuente) y estilos.css (compilado)
  src/img/         logo, fondo y fotos
API_ENDPOINTS.md   documentación completa de la API
```

## API

Toda la API está documentada en [API_ENDPOINTS.md](API_ENDPOINTS.md): endpoints,
formato de errores, límites de peticiones y estados de las reservas.

## Antes de publicar

- [ ] Cargar los precios, productos y datos reales del negocio.
- [ ] Cambiar la contraseña del usuario `admin@example.com`, o crear otro admin y desactivarlo.
- [ ] Generar un `JWT_SECRET` nuevo y usar `NODE_ENV=production`.
- [ ] Configurar `GMAIL_USER`, `GMAIL_APP_PASSWORD` y `CORREO_RESERVAS`.
- [ ] Ejecutar `npm run css` en `frontend` para dejar el CSS comprimido.
- [ ] Cambiar `og:image` en `frontend/index.html` por la URL completa del sitio.
- [ ] Si hay un proxy delante, poner `TRUST_PROXY=1`.

En producción el backend sirve también el frontend: basta con levantar el backend
(`npm start`) y abrir el dominio.
