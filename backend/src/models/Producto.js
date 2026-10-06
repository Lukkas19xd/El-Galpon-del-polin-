import { pool } from '../config/database.js';

const mapRow = (row) => {
  if (!row) return null;
  const producto = {
    id: row.id,
    _id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: row.precio,
    stock: row.stock,
    tipo: row.tipo,
    categoria: row.categoria,
    activo: row.activo,
    especificaciones: row.especificaciones,
    ventasRealizadas: row.ventas_realizadas,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  producto.save = async function () {
    const { rows } = await pool.query(
      `UPDATE productos
         SET nombre = $1, descripcion = $2, precio = $3, stock = $4, tipo = $5,
             categoria = $6, activo = $7, especificaciones = $8, ventas_realizadas = $9,
             updated_at = now()
       WHERE id = $10
       RETURNING *`,
      [this.nombre, this.descripcion, this.precio, this.stock, this.tipo, this.categoria,
        this.activo, this.especificaciones, this.ventasRealizadas, this.id]
    );
    return mapRow(rows[0]);
  };
  return producto;
};

const Producto = {
  async find(filtro = {}) {
    const condiciones = [];
    const valores = [];

    if (filtro.activo !== undefined) {
      valores.push(filtro.activo);
      condiciones.push(`activo = $${valores.length}`);
    }
    if (filtro.tipo !== undefined) {
      valores.push(filtro.tipo);
      condiciones.push(`tipo = $${valores.length}`);
    }
    if (filtro.categoria !== undefined) {
      valores.push(filtro.categoria);
      condiciones.push(`categoria = $${valores.length}`);
    }
    if (filtro.nombre !== undefined) {
      valores.push(filtro.nombre);
      condiciones.push(`nombre = $${valores.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM productos ${where} ORDER BY created_at ASC`, valores);
    return rows.map(mapRow);
  },

  async findOne(query = {}) {
    const resultados = await this.find(query);
    return resultados[0] || null;
  },

  async findById(id) {
    if (!id) return null;
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    return mapRow(rows[0]);
  },

  async create({ nombre, descripcion, precio, stock, tipo, categoria, especificaciones, activo = true }) {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, tipo, categoria, especificaciones, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [nombre, descripcion, precio, stock, tipo, categoria, especificaciones, activo]
    );
    return mapRow(rows[0]);
  },

  async findByIdAndUpdate(id, update = {}) {
    const actual = await this.findById(id);
    if (!actual) return null;

    const siguiente = {
      nombre: update.nombre ?? actual.nombre,
      descripcion: update.descripcion ?? actual.descripcion,
      precio: update.precio ?? actual.precio,
      stock: update.stock ?? actual.stock,
      tipo: update.tipo ?? actual.tipo,
      categoria: update.categoria ?? actual.categoria,
      activo: update.activo ?? actual.activo,
      especificaciones: update.especificaciones ?? actual.especificaciones,
      ventasRealizadas: actual.ventasRealizadas
    };

    if (update.$inc) {
      if (update.$inc.stock !== undefined) siguiente.stock = actual.stock + update.$inc.stock;
      if (update.$inc.ventasRealizadas !== undefined) {
        siguiente.ventasRealizadas = actual.ventasRealizadas + update.$inc.ventasRealizadas;
      }
    }

    const { rows } = await pool.query(
      `UPDATE productos
         SET nombre = $1, descripcion = $2, precio = $3, stock = $4, tipo = $5,
             categoria = $6, activo = $7, especificaciones = $8, ventas_realizadas = $9,
             updated_at = now()
       WHERE id = $10
       RETURNING *`,
      [siguiente.nombre, siguiente.descripcion, siguiente.precio, siguiente.stock, siguiente.tipo,
        siguiente.categoria, siguiente.activo, siguiente.especificaciones, siguiente.ventasRealizadas, id]
    );
    return mapRow(rows[0]);
  }
};

export default Producto;
