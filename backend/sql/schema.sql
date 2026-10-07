-- Esquema relacional de Agroforestal Monte Redondo SPA (PostgreSQL 13+, usa gen_random_uuid() nativo)

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  contrasena TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente',
  activo BOOLEAN NOT NULL DEFAULT true,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(12, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  tipo TEXT,
  categoria TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  especificaciones JSONB,
  ventas_realizadas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foto del producto: URL o ruta relativa al frontend (agregada después)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen TEXT;

CREATE INDEX IF NOT EXISTS productos_activo_idx ON productos (activo);
CREATE INDEX IF NOT EXISTS productos_tipo_idx ON productos (tipo);
CREATE INDEX IF NOT EXISTS productos_categoria_idx ON productos (categoria);

CREATE TABLE IF NOT EXISTS carritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carrito_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  precio NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS carrito_items_carrito_idx ON carrito_items (carrito_id);

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden TEXT NOT NULL UNIQUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  total NUMERIC(12, 2) NOT NULL,
  metodo_pago TEXT NOT NULL,
  direccion_entrega TEXT NOT NULL,
  fecha_retiro TIMESTAMPTZ,
  historial_estados JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nota opcional que deja el cliente al reservar (agregada después; ALTER para bases existentes)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nota TEXT;

-- Los estados pasaron de envío a retiro: enviado -> listo, entregado -> retirado
UPDATE pedidos SET estado = 'listo' WHERE estado = 'enviado';
UPDATE pedidos SET estado = 'retirado' WHERE estado = 'entregado';

CREATE INDEX IF NOT EXISTS pedidos_usuario_idx ON pedidos (usuario_id);
CREATE INDEX IF NOT EXISTS pedidos_estado_idx ON pedidos (estado);

CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS pedido_items_pedido_idx ON pedido_items (pedido_id);
