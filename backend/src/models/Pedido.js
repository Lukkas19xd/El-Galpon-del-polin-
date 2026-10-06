import { pool } from '../config/database.js';

const mapItemRow = (row) => ({
  producto: row.producto_id,
  cantidad: row.cantidad,
  precioUnitario: row.precio_unitario,
  subtotal: row.subtotal
});

const cargarItems = async (pedidoId) => {
  const { rows } = await pool.query(
    'SELECT * FROM pedido_items WHERE pedido_id = $1 ORDER BY id ASC',
    [pedidoId]
  );
  return rows.map(mapItemRow);
};

const buildPedido = (row, items) => {
  if (!row) return null;
  const pedido = {
    id: row.id,
    _id: row.id,
    numeroOrden: row.numero_orden,
    usuario: row.usuario_id,
    estado: row.estado,
    total: row.total,
    metodoPago: row.metodo_pago,
    direccionEntrega: row.direccion_entrega,
    fechaRetiro: row.fecha_retiro,
    historialEstados: row.historial_estados,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  pedido.save = async function () {
    const { rows } = await pool.query(
      `UPDATE pedidos
         SET estado = $1, total = $2, metodo_pago = $3, direccion_entrega = $4,
             fecha_retiro = $5, historial_estados = $6, updated_at = now()
       WHERE id = $7
       RETURNING *`,
      [this.estado, this.total, this.metodoPago, this.direccionEntrega,
        this.fechaRetiro, JSON.stringify(this.historialEstados), this.id]
    );
    return buildPedido(rows[0], this.items);
  };

  return pedido;
};

const Pedido = {
  async find(filtro = {}) {
    const condiciones = [];
    const valores = [];

    if (filtro.usuario !== undefined) {
      valores.push(filtro.usuario);
      condiciones.push(`usuario_id = $${valores.length}`);
    }
    if (filtro.estado !== undefined) {
      valores.push(filtro.estado);
      condiciones.push(`estado = $${valores.length}`);
    }
    if (filtro.numeroOrden !== undefined) {
      valores.push(filtro.numeroOrden);
      condiciones.push(`numero_orden = $${valores.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM pedidos ${where} ORDER BY created_at ASC`, valores);
    return Promise.all(rows.map(async (row) => buildPedido(row, await cargarItems(row.id))));
  },

  async findOne(query = {}) {
    const resultados = await this.find(query);
    return resultados[0] || null;
  },

  async findById(id) {
    if (!id) return null;
    const { rows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (!rows[0]) return null;
    return buildPedido(rows[0], await cargarItems(rows[0].id));
  },

  async create({ numeroOrden, usuario, items = [], total, metodoPago, direccionEntrega, fechaRetiro, historialEstados = [] }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO pedidos (numero_orden, usuario_id, total, metodo_pago, direccion_entrega, fecha_retiro, historial_estados)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [numeroOrden, usuario, total, metodoPago, direccionEntrega, fechaRetiro || null, JSON.stringify(historialEstados)]
      );
      const pedido = rows[0];
      for (const item of items) {
        await client.query(
          `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [pedido.id, item.producto, item.cantidad, item.precioUnitario, item.subtotal]
        );
      }
      await client.query('COMMIT');
      return buildPedido(pedido, items);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findByIdAndUpdate(id, update = {}) {
    const actual = await this.findById(id);
    if (!actual) return null;

    actual.estado = update.estado ?? actual.estado;
    actual.total = update.total ?? actual.total;
    actual.metodoPago = update.metodoPago ?? actual.metodoPago;
    actual.direccionEntrega = update.direccionEntrega ?? actual.direccionEntrega;
    actual.fechaRetiro = update.fechaRetiro ?? actual.fechaRetiro;
    actual.historialEstados = update.historialEstados ?? actual.historialEstados;

    return actual.save();
  }
};

export default Pedido;
