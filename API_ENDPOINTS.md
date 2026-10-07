# 📚 Documentación de la API

API REST de Agroforestal Monte Redondo SPA: catálogo de polines y leña en saco,
carrito y **reservas con retiro en el galpón** (no hay pago en línea: el cliente
paga al retirar).

- Base URL en desarrollo: `http://localhost:3000/api`
- En producción el backend sirve también el frontend, así que la API queda en `https://<dominio>/api`.

Los endpoints protegidos necesitan el header:

```
Authorization: Bearer {token}
```

En cada petición se comprueba en la base de datos que la cuenta siga existiendo y
activa, y el rol se toma de la base (no del token). Una cuenta desactivada pierde
el acceso al instante.

---

## Formato de respuestas

Éxito: `{ "success": true, ... }`

Error (siempre el mismo formato):

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email inválido.",
  "detalles": [{ "campo": "email", "mensaje": "Email inválido." }]
}
```

`detalles` solo viene en errores de validación. Con `NODE_ENV=development` los errores
500 incluyen además `stack`; en producción solo dicen "Error interno del servidor".

| Código | Cuándo |
|---|---|
| 400 | Datos inválidos, JSON mal formado, transición de estado no permitida |
| 401 | Sin token, token inválido/expirado o credenciales incorrectas |
| 403 | Sin permisos (no es admin) o cuenta desactivada |
| 404 | No existe (incluye ids con formato inválido y reservas de otro cliente) |
| 409 | Email ya registrado, stock insuficiente, producto no disponible, demasiadas reservas activas |
| 429 | Se superó un límite de peticiones (ver abajo) |

## Límites de peticiones

| Qué | Límite |
|---|---|
| Toda la API | 500 peticiones cada 15 min por IP |
| `POST /auth/login` | 10 intentos **fallidos** cada 15 min por IP |
| `PUT /auth/cambiar-contrasena` | 10 intentos fallidos cada 15 min por IP |
| `POST /auth/registro` | 5 cada hora por IP |
| `POST /pedidos` | 10 reservas cada hora por usuario |

Las respuestas incluyen la cabecera estándar `RateLimit` con lo que queda disponible.
Si el servidor está detrás de un proxy, configura `TRUST_PROXY=1` para que se use la IP real.

---

## 🏪 Negocio

### Datos del negocio
```http
GET /negocio
```
Público. Devuelve lo que está en `backend/data/negocio.js`:

```json
{
  "success": true,
  "negocio": {
    "nombre": "Agroforestal Monte Redondo SPA",
    "direccion": "…",
    "comuna": "…",
    "ubicacionMaps": "",
    "whatsapp": "56912345678",
    "horario": [{ "dias": "Lunes a viernes", "horas": "08:30 – 18:00" }],
    "diasRetiro": [1, 2, 3, 4, 5, 6],
    "anticipacionMaximaDias": 30,
    "maxReservasActivasPorCliente": 5
  }
}
```

`diasRetiro` usa 0 = domingo … 6 = sábado.

### Salud
```http
GET /health
```

---

## 🔐 Autenticación (`/auth`)

### Registro
```http
POST /auth/registro

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+56 9 1234 5678",
  "contrasena": "minimo8caracteres",
  "confirmacion": "minimo8caracteres"
}
```
- Contraseña de al menos 8 caracteres; `confirmacion` debe coincidir.
- `telefono` es opcional en la API (la página lo pide siempre).
- Siempre crea un usuario con rol `cliente`.
- **201** → `{ success, message, token, usuario: { id, nombre, email, rol } }`
- **409** si el email ya está registrado.

### Login
```http
POST /auth/login

{ "email": "juan@example.com", "contrasena": "minimo8caracteres" }
```
- **200** → `{ success, message, token, usuario: { id, nombre, email, rol } }`
- **401** credenciales inválidas · **403** cuenta desactivada.

### Perfil
```http
GET /auth/perfil      (o GET /auth/me)
Authorization: Bearer {token}
```
**200** → `{ success, usuario }`. La respuesta nunca incluye la contraseña.

### Actualizar perfil
```http
PUT /auth/perfil
Authorization: Bearer {token}

{ "nombre": "Juan", "telefono": "+56 9 1234 5678", "direccion": "…", "ciudad": "…" }
```
Todos los campos son opcionales. `telefono` acepta solo números, espacios y `+ ( ) -`.

### Cambiar contraseña
```http
PUT /auth/cambiar-contrasena
Authorization: Bearer {token}

{
  "contrasenaActual": "…",
  "contrasenanueva": "nuevaClave123",
  "confirmacion": "nuevaClave123"
}
```

### Listar usuarios (admin)
```http
GET /auth/usuarios
Authorization: Bearer {token_admin}
```

### Cambiar rol o activar/desactivar una cuenta (admin)
```http
PUT /auth/usuarios/:id
Authorization: Bearer {token_admin}

{ "rol": "cliente", "activo": false }
```
- Ambos campos son opcionales. `rol`: `cliente` | `administrador`.
- Una cuenta desactivada pierde el acceso al instante.
- **400** si el admin intenta quitarse el rol o desactivar su propia cuenta.

---

## 📦 Productos (`/productos`)

Valores válidos:
- `tipo`: `impregnado` | `estandar` | `lena`
- `categoria`: `agricola` | `construccion` | `industrial` | `lena`

### Listar productos activos
```http
GET /productos?q=eucalipto&tipo=lena&categoria=lena&pagina=1&limite=10
```
Público. `q` busca en el nombre y la descripción, sin distinguir mayúsculas.
Ordenados por categoría y precio.
**200** → `{ success, total, paginas, paginaActual, productos }`

### Listar todos los productos (admin)
```http
GET /productos/admin/todos
Authorization: Bearer {token_admin}
```
Incluye los ocultos (`activo: false`), para poder editarlos y volver a mostrarlos.

### Obtener un producto
```http
GET /productos/:id
```
**404** si no existe o el id no tiene formato válido.

### Crear producto (admin)
```http
POST /productos
Authorization: Bearer {token_admin}

{
  "nombre": "Leña de eucalipto seca (saco)",
  "descripcion": "…",
  "precio": 4500,
  "stock": 300,
  "tipo": "lena",
  "categoria": "lena",
  "especificaciones": { "especie": "Eucalipto", "peso": "~20 kg" },
  "imagen": "src/img/productos/lena-eucalipto.jpg"
}
```
`nombre`, `precio` (≥ 0), `stock` (entero ≥ 0), `tipo` y `categoria` son obligatorios.
`imagen` (opcional) es una URL `https://…` o una ruta dentro de `src/img/` del frontend;
al editar, `""` la quita.

### Actualizar producto (admin)
```http
PUT /productos/:id
Authorization: Bearer {token_admin}

{ "precio": 4800, "stock": 250, "activo": true }
```
Mismas reglas que al crear, pero todos los campos son opcionales.

### Desactivar producto (admin)
```http
DELETE /productos/:id
Authorization: Bearer {token_admin}
```
No se borra: queda con `activo: false`, porque puede estar en reservas antiguas.

### Consultar stock
```http
POST /productos/validar-stock

{ "productoId": "uuid", "cantidad": 5 }
```
**200** → `{ success, disponible, stockActual, solicitado }`

---

## 🛒 Carrito (`/carrito`)

Todas requieren token. Agregar al carrito **no aparta stock**: el stock se descuenta
recién al confirmar la reserva.

| Método | Ruta | Cuerpo | Qué hace |
|---|---|---|---|
| GET | `/carrito` | – | Devuelve el carrito con los productos |
| POST | `/carrito/agregar` | `{ productoId, cantidad }` | Suma al carrito (cantidad 1–10.000). **409** si lo del carrito más lo nuevo supera el stock |
| PUT | `/carrito/actualizar` | `{ productoId, cantidad }` | Cambia la cantidad; `0` lo quita |
| DELETE | `/carrito/producto/:productoId` | – | Quita un producto |
| DELETE | `/carrito/vaciar` | – | Vacía el carrito |

---

## 📋 Reservas (`/pedidos`)

### Estados

```
pendiente → confirmado → listo → retirado
    └──────────┴──────────┴──→ cancelado
```

| Estado | Significado |
|---|---|
| `pendiente` | Recién creada |
| `confirmado` | El negocio la aceptó |
| `listo` | Preparada para retirar (se avisa al cliente por correo) |
| `retirado` | El cliente la retiró y pagó |
| `cancelado` | Cancelada: el stock vuelve a quedar disponible |

No se pueden saltar pasos (ej: `pendiente` → `retirado` responde 400).

### Crear reserva
```http
POST /pedidos
Authorization: Bearer {token}

{ "fechaRetiro": "2026-10-09", "nota": "Paso en la tarde con camioneta" }
```
Convierte el carrito en una reserva:
- `fechaRetiro` (YYYY-MM-DD) debe ser hoy o futura, un día de `diasRetiro` y dentro de `anticipacionMaximaDias`.
- `nota` es opcional (máx. 500 caracteres).
- Todo ocurre en **una transacción**: se descuenta el stock de cada producto de forma
  atómica, se crea la reserva y se vacía el carrito. Si falta stock de un solo producto
  no se crea nada y el carrito queda igual (**409**). Dos reservas simultáneas nunca
  venden más stock del que hay.
- Se cobra el precio vigente al momento de reservar.
- **409** si el cliente ya tiene `maxReservasActivasPorCliente` reservas sin retirar.
- Envía un correo al negocio y otro de confirmación al cliente.

**201**:
```json
{
  "success": true,
  "message": "Reserva creada exitosamente",
  "pedido": { "numeroOrden": "RES-HRMFBU", "total": 22500, "estado": "pendiente", "fechaRetiro": "2026-10-09T15:00:00.000Z" }
}
```

### Mis reservas
```http
GET /pedidos/mis-pedidos
Authorization: Bearer {token}
```
Las reservas del usuario, de la más reciente a la más antigua, con productos y datos del cliente.

### Buscar por código
```http
GET /pedidos/buscar?codigo=RES-HRMFBU
Authorization: Bearer {token}
```
Un cliente solo encuentra sus propias reservas; para las de otros responde **404**.

### Obtener una reserva
```http
GET /pedidos/:id
Authorization: Bearer {token}
```
El cliente solo ve las suyas (**404** si no); el admin, cualquiera.

### Todas las reservas (admin)
```http
GET /pedidos?estado=pendiente&pagina=1&limite=10
Authorization: Bearer {token_admin}
```
Paginadas en la base de datos (`limite` máximo 100), de la más reciente a la más antigua.

### Retiros pendientes (admin)
```http
GET /pedidos/retiros
Authorization: Bearer {token_admin}
```
Reservas en `pendiente`, `confirmado` o `listo`, ordenadas por fecha de retiro
(incluye las atrasadas). Es lo que usa la pestaña "Retiros" del panel de admin.

### Cambiar estado (admin)
```http
PUT /pedidos/:id/estado
Authorization: Bearer {token_admin}

{ "estado": "listo", "nota": "Preparado en bodega 2" }
```
- Valida la transición (ver tabla de estados).
- Al pasar a `cancelado` devuelve el stock. La reserva queda bloqueada mientras cambia,
  así que dos cancelaciones simultáneas no devuelven el stock dos veces.
- Al pasar a `listo` avisa al cliente por correo.

---

## 🧪 Ejemplo: flujo completo de una reserva

```bash
API=http://localhost:3000/api

# 1. Iniciar sesión
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"cliente@example.com","contrasena":"cliente123"}' | jq -r .token)

# 2. Ver la leña disponible
curl -s "$API/productos?categoria=lena" | jq '.productos[] | {id, nombre, precio, stock}'

# 3. Agregar 5 sacos al carrito
curl -s -X POST $API/carrito/agregar -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"productoId":"<uuid>","cantidad":5}'

# 4. Reservar para retirar el viernes
curl -s -X POST $API/pedidos -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"fechaRetiro":"2026-10-09"}'
```

---

## Tests

```bash
cd backend
npm test
```

Los tests usan una base de datos propia (`DATABASE_URL_TEST`, o la de desarrollo con
`_test` al final), que se crea sola y se vacía en cada corrida. No ocupan ningún puerto
ni envían correos, así que se pueden correr con el servidor de desarrollo encendido.
