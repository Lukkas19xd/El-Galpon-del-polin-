import { pool } from '../config/database.js';
import { ApiError } from '../utils/errorHandler.js';
import { TRANSICIONES_ESTADO } from '../utils/constantes.js';

const mapItemRow = (row) => ({
  producto: row.producto_id,
  cantidad: row.cantidad,
  precioUnitario: row.precio_unitario,
  subtotal: row.subtotal
});

const mapPedido = (row, items = []) => {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    numeroOrden: row.numero_orden,
    usuario: row.usuario_id,
    estado: row.estado,
    total: row.total,
    metodoPago: row.metodo_pago,
    direccionEntrega: row.direccion_entrega,
    fechaRetiro: row.fecha_retiro,
    nota: row.nota,
    historialEstados: row.historial_estados,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Carga los ítems de varios pedidos en una sola consulta
const conItems = async (rows, db = pool) => {
  if (rows.length === 0) return [];
  const { rows: itemRows } = await db.query(
    'SELECT * FROM pedido_items WHERE pedido_id = ANY($1::uuid[]) ORDER BY id ASC',
    [rows.map((row) => row.id)]
  );
  const porPedido = new Map(rows.map((row) => [row.id, []]));
  itemRows.forEach((item) => porPedido.get(item.pedido_id).push(mapItemRow(item)));
  return rows.map((row) => mapPedido(row, porPedido.get(row.id)));
};

const ORDENES = {
  recientes: 'created_at DESC',
  antiguos: 'created_at ASC',
  retiro: 'fecha_retiro ASC NULLS LAST, created_at ASC'
};

// Arma el WHERE a partir de un filtro { usuario, estado, estados, numeroOrden, conFechaRetiro }
const construirWhere = (filtro = {}) => {
  const condiciones = [];
  const valores = [];
  const agregar = (sql, valor) => {
    valores.push(valor);
    condiciones.push(sql.replace('?', `$${valores.length}`));
  };

  if (filtro.usuario !== undefined) agregar('usuario_id = ?', filtro.usuario);
  if (filtro.estado !== undefined) agregar('estado = ?', filtro.estado);
  if (filtro.estados !== undefined) agregar('estado = ANY(?::text[])', filtro.estados);
  if (filtro.numeroOrden !== undefined) agregar('numero_orden = ?', filtro.numeroOrden);
  if (filtro.conFechaRetiro) condiciones.push('fecha_retiro IS NOT NULL');

  return { where: condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '', valores };
};

// Ejecuta fn(client) dentro de una transacción; si algo lanza, se deshace todo
const enTransaccion = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const Pedido = {
  // opciones: { orden: 'recientes' | 'antiguos' | 'retiro', limite, offset }
  async find(filtro = {}, { orden = 'antiguos', limite, offset = 0 } = {}) {
    const { where, valores } = construirWhere(filtro);
    let sql = `SELECT * FROM pedidos ${where} ORDER BY ${ORDENES[orden] || ORDENES.antiguos}`;
    if (limite !== undefined) {
      valores.push(limite, offset);
      sql += ` LIMIT $${valores.length - 1} OFFSET $${valores.length}`;
    }
    const { rows } = await pool.query(sql, valores);
    return conItems(rows);
  },

  async count(filtro = {}) {
    const { where, valores } = construirWhere(filtro);
    const { rows } = await pool.query(`SELECT count(*)::int AS total FROM pedidos ${where}`, valores);
    return rows[0].total;
  },

  async findOne(filtro = {}) {
    const [pedido] = await this.find(filtro, { limite: 1 });
    return pedido || null;
  },

  async findById(id) {
    if (!id) return null;
    const { rows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    const [pedido] = await conItems(rows);
    return pedido || null;
  },

  // Convierte el carrito del usuario en una reserva, todo en una transacción:
  // si falta stock de un solo producto no se crea nada y el carrito queda igual.
  async crearDesdeCarrito({ usuarioId, numeroOrden, fechaRetiro, nota, metodoPago, direccionEntrega }) {
    return enTransaccion(async (client) => {
      // Bloquea el carrito: si el cliente envía la reserva dos veces seguidas,
      // la segunda espera a la primera y se encuentra el carrito ya vacío.
      const { rows: [carrito] } = await client.query(
        'SELECT id FROM carritos WHERE usuario_id = $1 FOR UPDATE',
        [usuarioId]
      );
      const { rows: itemsCarrito } = carrito
        ? await client.query(
          // Orden fijo por producto para que dos reservas simultáneas bloqueen
          // las filas en el mismo orden y no se trabe una con otra
          'SELECT producto_id, cantidad FROM carrito_items WHERE carrito_id = $1 ORDER BY producto_id',
          [carrito.id]
        )
        : { rows: [] };

      if (itemsCarrito.length === 0) {
        throw new ApiError('El carrito está vacío', 400);
      }

      // Descuento atómico: el UPDATE solo afecta la fila si alcanza el stock, y
      // la base de datos serializa las reservas simultáneas sobre el mismo producto.
      const items = [];
      for (const item of itemsCarrito) {
        const { rows: [producto] } = await client.query(
          `UPDATE productos
              SET stock = stock - $1, ventas_realizadas = ventas_realizadas + $1, updated_at = now()
            WHERE id = $2 AND activo AND stock >= $1
          RETURNING precio`,
          [item.cantidad, item.producto_id]
        );

        if (!producto) {
          const { rows: [actual] } = await client.query(
            'SELECT nombre, stock, activo FROM productos WHERE id = $1',
            [item.producto_id]
          );
          if (!actual || !actual.activo) {
            throw new ApiError(`${actual ? actual.nombre : 'Un producto del carrito'} ya no está disponible; quítalo del carrito`, 409);
          }
          throw new ApiError(`Stock insuficiente para ${actual.nombre}. Disponible: ${actual.stock}`, 409);
        }

        // Se cobra el precio vigente al reservar, no el que tenía al agregarlo al carrito
        items.push({
          producto: item.producto_id,
          cantidad: item.cantidad,
          precioUnitario: producto.precio,
          subtotal: item.cantidad * producto.precio
        });
      }

      const total = items.reduce((suma, item) => suma + item.subtotal, 0);
      const historial = [{ estado: 'pendiente', fecha: new Date(), nota: 'Reserva creada' }];

      const { rows: [pedido] } = await client.query(
        `INSERT INTO pedidos (numero_orden, usuario_id, total, metodo_pago, direccion_entrega, fecha_retiro, nota, historial_estados)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [numeroOrden, usuarioId, total, metodoPago, direccionEntrega, fechaRetiro, nota || null, JSON.stringify(historial)]
      );

      for (const item of items) {
        await client.query(
          `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [pedido.id, item.producto, item.cantidad, item.precioUnitario, item.subtotal]
        );
      }

      await client.query('DELETE FROM carrito_items WHERE carrito_id = $1', [carrito.id]);
      await client.query('UPDATE carritos SET total = 0, updated_at = now() WHERE id = $1', [carrito.id]);

      return mapPedido(pedido, items);
    });
  },

  // Cambia el estado validando la transición; si se cancela, devuelve el stock.
  // La fila del pedido queda bloqueada durante el cambio: si dos personas cancelan
  // a la vez, la segunda ve el estado ya cancelado y el stock no se devuelve dos veces.
  async cambiarEstado(id, estado, nota) {
    return enTransaccion(async (client) => {
      const { rows: [actual] } = await client.query('SELECT * FROM pedidos WHERE id = $1 FOR UPDATE', [id]);
      if (!actual) {
        throw new ApiError('Pedido no encontrado', 404);
      }
      if (actual.estado === estado) {
        throw new ApiError('El pedido ya tiene ese estado', 400);
      }
      if (!(TRANSICIONES_ESTADO[actual.estado] || []).includes(estado)) {
        throw new ApiError(`No se puede cambiar de ${actual.estado} a ${estado}`, 400);
      }

      if (estado === 'cancelado') {
        await client.query(
          `UPDATE productos p
              SET stock = p.stock + pi.cantidad,
                  ventas_realizadas = p.ventas_realizadas - pi.cantidad,
                  updated_at = now()
             FROM pedido_items pi
            WHERE pi.pedido_id = $1 AND pi.producto_id = p.id`,
          [id]
        );
      }

      const historial = [...(actual.historial_estados || []), { estado, fecha: new Date(), nota }];
      const { rows } = await client.query(
        `UPDATE pedidos SET estado = $1, historial_estados = $2, updated_at = now()
          WHERE id = $3 RETURNING *`,
        [estado, JSON.stringify(historial), id]
      );
      const [pedido] = await conItems(rows, client);
      return pedido;
    });
  }
};

export default Pedido;
