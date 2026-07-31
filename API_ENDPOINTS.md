# 📚 Documentación de Endpoints API

Base URL: `http://localhost:3000/api`

Todos los endpoints que requieren autenticación necesitan el header:
```
Authorization: Bearer {token}
```

---

## 🔐 Autenticación (`/auth`)

### Registro de Usuario
```http
POST /auth/registro
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "contrasena": "password123",
  "confirmacion": "password123"
}

Respuesta 201:
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "cliente"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "contrasena": "password123"
}

Respuesta 200:
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "cliente"
  }
}
```

### Obtener Perfil
```http
GET /auth/perfil
Authorization: Bearer {token}

Respuesta 200:
{
  "success": true,
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "cliente",
    "telefono": "1234567890",
    "direccion": "Calle Principal 123",
    "ciudad": "Ciudad",
    "estado": "activo",
    "activo": true,
    "createdAt": "2025-06-01T10:00:00Z",
    "updatedAt": "2025-06-01T10:00:00Z"
  }
}
```

### Actualizar Perfil
```http
PUT /auth/perfil
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Juan Carlos Pérez",
  "telefono": "9876543210",
  "direccion": "Avenida Secundaria 456",
  "ciudad": "Nueva Ciudad"
}

Respuesta 200:
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "usuario": { ... }
}
```

### Cambiar Contraseña
```http
PUT /auth/cambiar-contrasena
Authorization: Bearer {token}
Content-Type: application/json

{
  "contrasenaActual": "password123",
  "contrasenanueva": "newpassword456",
  "confirmacion": "newpassword456"
}

Respuesta 200:
{
  "success": true,
  "message": "Contraseña cambiada exitosamente"
}
```

### Obtener Usuarios (Admin)
```http
GET /auth/usuarios
Authorization: Bearer {admin_token}

Respuesta 200:
{
  "success": true,
  "total": 5,
  "usuarios": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "rol": "cliente",
      "estado": "activo",
      ...
    }
  ]
}
```

---

## 📦 Productos (`/productos`)

### Obtener Todos los Productos
```http
GET /productos?tipo=impregnado&categoria=industrial&pagina=1&limite=10

Query Parameters:
- tipo: "impregnado" | "estandar" (opcional)
- categoria: "industrial" | "construccion" | "agricola" | "otro" (opcional)
- pagina: número de página (default: 1)
- limite: items por página (default: 10)

Respuesta 200:
{
  "success": true,
  "total": 25,
  "paginas": 3,
  "paginaActual": 1,
  "productos": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Polín Impregnado 100x100mm",
      "descripcion": "...",
      "precio": 45.99,
      "stock": 150,
      "tipo": "impregnado",
      "categoria": "industrial",
      "especificaciones": {
        "diametro": 100,
        "largo": 2400,
        "material": "Madera Impregnada",
        "peso": 12.5
      },
      "ventasRealizadas": 25,
      ...
    }
  ]
}
```

### Obtener Producto por ID
```http
GET /productos/{id}

Respuesta 200:
{
  "success": true,
  "producto": { ... }
}

Respuesta 404:
{
  "success": false,
  "message": "Producto no encontrado"
}
```

### Crear Producto (Admin)
```http
POST /productos
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Polín Nuevo",
  "descripcion": "Descripción del producto",
  "precio": 50.00,
  "stock": 100,
  "tipo": "impregnado",
  "categoria": "industrial",
  "especificaciones": {
    "diametro": 100,
    "largo": 2400,
    "material": "Madera Impregnada",
    "peso": 12.5
  }
}

Respuesta 201:
{
  "success": true,
  "message": "Producto creado exitosamente",
  "producto": { ... }
}
```

### Actualizar Producto (Admin)
```http
PUT /productos/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Polín Actualizado",
  "precio": 55.00,
  "stock": 120,
  ...
}

Respuesta 200:
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "producto": { ... }
}
```

### Eliminar Producto (Admin)
```http
DELETE /productos/{id}
Authorization: Bearer {admin_token}

Respuesta 200:
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

### Validar Stock
```http
POST /productos/validar-stock
Content-Type: application/json

{
  "productoId": "507f1f77bcf86cd799439011",
  "cantidad": 10
}

Respuesta 200:
{
  "success": true,
  "disponible": true,
  "stockActual": 150,
  "solicitado": 10
}

O si no hay stock:
{
  "success": true,
  "disponible": false,
  "stockActual": 5,
  "solicitado": 10,
  "message": "Stock insuficiente"
}
```

---

## 🛒 Carrito (`/carrito`)

### Obtener Carrito
```http
GET /carrito
Authorization: Bearer {token}

Respuesta 200:
{
  "success": true,
  "carrito": {
    "_id": "507f1f77bcf86cd799439012",
    "usuario": "507f1f77bcf86cd799439011",
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "producto": {
          "_id": "507f1f77bcf86cd799439014",
          "nombre": "Polín Impregnado 100x100mm",
          ...
        },
        "cantidad": 5,
        "precio": 45.99
      }
    ],
    "total": 229.95
  }
}
```

### Agregar al Carrito
```http
POST /carrito/agregar
Authorization: Bearer {token}
Content-Type: application/json

{
  "productoId": "507f1f77bcf86cd799439014",
  "cantidad": 5
}

Respuesta 200:
{
  "success": true,
  "message": "Producto agregado al carrito",
  "carrito": { ... }
}

Respuesta 400:
{
  "success": false,
  "message": "Stock insuficiente. Disponible: 3"
}
```

### Actualizar Cantidad en Carrito
```http
PUT /carrito/actualizar
Authorization: Bearer {token}
Content-Type: application/json

{
  "productoId": "507f1f77bcf86cd799439014",
  "cantidad": 10
}

Respuesta 200:
{
  "success": true,
  "message": "Carrito actualizado",
  "carrito": { ... }
}
```

### Eliminar del Carrito
```http
DELETE /carrito/producto/{productoId}
Authorization: Bearer {token}

Respuesta 200:
{
  "success": true,
  "message": "Producto eliminado del carrito",
  "carrito": { ... }
}
```

### Vaciar Carrito
```http
DELETE /carrito/vaciar
Authorization: Bearer {token}

Respuesta 200:
{
  "success": true,
  "message": "Carrito vaciado",
  "carrito": {
    "items": [],
    "total": 0
  }
}
```

---

## 📋 Pedidos (`/pedidos`)

### Crear Pedido
```http
POST /pedidos
Authorization: Bearer {token}
Content-Type: application/json

{
  "metodoPago": "efectivo",
  "direccionEntrega": {
    "calle": "Calle Principal",
    "numero": "123",
    "ciudad": "Ciudad",
    "codigoPostal": "28001"
  }
}

Respuesta 201:
{
  "success": true,
  "message": "Pedido creado exitosamente",
  "pedido": {
    "numeroOrden": "ORD-ABC12345",
    "total": 229.95,
    "estado": "pendiente"
  }
}
```

### Obtener Mis Pedidos
```http
GET /pedidos/mis-pedidos
Authorization: Bearer {token}

Respuesta 200:
{
  "success": true,
  "total": 3,
  "pedidos": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "numeroOrden": "ORD-ABC12345",
      "usuario": "507f1f77bcf86cd799439011",
      "items": [
        {
          "producto": { ... },
          "cantidad": 5,
          "precioUnitario": 45.99,
          "subtotal": 229.95
        }
      ],
      "total": 229.95,
      "estado": "pendiente",
      "metodoPago": "efectivo",
      "direccionEntrega": { ... },
      "createdAt": "2025-06-01T10:00:00Z"
    }
  ]
}
```

### Obtener Pedido por ID
```http
GET /pedidos/{id}
Authorization: Bearer {token}

Respuesta 200:
{
  "success": true,
  "pedido": { ... }
}

Respuesta 403:
{
  "success": false,
  "message": "No autorizado"
}
```

### Obtener Todos los Pedidos (Admin)
```http
GET /pedidos?estado=pendiente&pagina=1&limite=10
Authorization: Bearer {admin_token}

Query Parameters:
- estado: "pendiente" | "confirmado" | "enviado" | "entregado" | "cancelado" (opcional)
- pagina: número de página (default: 1)
- limite: items por página (default: 10)

Respuesta 200:
{
  "success": true,
  "total": 15,
  "paginas": 2,
  "paginaActual": 1,
  "pedidos": [ ... ]
}
```

### Actualizar Estado de Pedido (Admin)
```http
PUT /pedidos/{id}/estado
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "estado": "confirmado",
  "nota": "Pedido confirmado y listo para envío"
}

Respuesta 200:
{
  "success": true,
  "message": "Estado del pedido actualizado",
  "pedido": {
    "_id": "507f1f77bcf86cd799439015",
    "estado": "confirmado",
    "historialEstados": [
      {
        "estado": "pendiente",
        "fecha": "2025-06-01T10:00:00Z",
        "nota": "Pedido creado"
      },
      {
        "estado": "confirmado",
        "fecha": "2025-06-01T10:30:00Z",
        "nota": "Pedido confirmado y listo para envío"
      }
    ]
  }
}
```

---

## 🔄 Estados de Pedido

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Pedido recién creado, awaiting confirmation |
| `confirmado` | Pedido confirmado por administrador |
| `enviado` | Pedido enviado al cliente |
| `entregado` | Pedido entregado exitosamente |
| `cancelado` | Pedido cancelado |

---

## ❌ Códigos de Error Comunes

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Token no proporcionado o inválido |
| 403 | Forbidden | Permiso denegado (no eres admin) |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error en el servidor |

---

## 🧪 Ejemplo Completo: Flujo de Compra

```
1. POST /auth/registro
   → Obtener token

2. GET /productos
   → Ver catálogo

3. GET /productos/{id}
   → Ver detalles del producto

4. POST /productos/validar-stock
   → Validar disponibilidad

5. POST /carrito/agregar
   → Agregar al carrito

6. GET /carrito
   → Ver carrito

7. PUT /carrito/actualizar
   → Actualizar cantidades si es necesario

8. POST /pedidos
   → Crear pedido (descuenta stock automáticamente)

9. GET /pedidos/mis-pedidos
   → Ver mis pedidos

10. (Admin) GET /pedidos
    → Ver todos los pedidos

11. (Admin) PUT /pedidos/{id}/estado
    → Actualizar estado del pedido
```

---

Para más información, consulta el README.md principal.
