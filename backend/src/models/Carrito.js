import { pool } from '../config/database.js';

const mapItemRow = (row) => ({
  producto: row.producto_id,
  cantidad: row.cantidad,
  precio: row.precio
});

const cargarItems = async (carritoId) => {
  const { rows } = await pool.query(
    'SELECT * FROM carrito_items WHERE carrito_id = $1 ORDER BY id ASC',
    [carritoId]
  );
  return rows.map(mapItemRow);
};

const buildCarrito = (row, items) => {
  if (!row) return null;
  const carrito = {
    id: row.id,
    _id: row.id,
    usuario: row.usuario_id,
    items,
    total: row.total,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  carrito.save = async function () {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM carrito_items WHERE carrito_id = $1', [this.id]);
      for (const item of this.items) {
        await client.query(
          `INSERT INTO carrito_items (carrito_id, producto_id, cantidad, precio)
           VALUES ($1, $2, $3, $4)`,
          [this.id, item.producto, item.cantidad, item.precio]
        );
      }
      const { rows } = await client.query(
        `UPDATE carritos SET total = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [this.total, this.id]
      );
      await client.query('COMMIT');
      return buildCarrito(rows[0], this.items);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  return carrito;
};

const Carrito = {
  async findOne({ usuario } = {}) {
    if (usuario === undefined) return null;
    const { rows } = await pool.query('SELECT * FROM carritos WHERE usuario_id = $1', [usuario]);
    if (!rows[0]) return null;
    const items = await cargarItems(rows[0].id);
    return buildCarrito(rows[0], items);
  },

  async findById(id) {
    if (!id) return null;
    const { rows } = await pool.query('SELECT * FROM carritos WHERE id = $1', [id]);
    if (!rows[0]) return null;
    const items = await cargarItems(rows[0].id);
    return buildCarrito(rows[0], items);
  },

  async create({ usuario, items = [], total = 0 }) {
    const { rows } = await pool.query(
      `INSERT INTO carritos (usuario_id, total) VALUES ($1, $2) RETURNING *`,
      [usuario, total]
    );
    const carrito = buildCarrito(rows[0], []);
    carrito.items = items;
    if (items.length > 0) {
      return carrito.save();
    }
    return carrito;
  }
};

export default Carrito;
