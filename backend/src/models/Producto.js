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
    imagen: row.imagen,
    ventasRealizadas: row.ventas_realizadas,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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
    if (filtro.busqueda) {
      // Los comodines de LIKE (% _ \) que escriba el usuario se buscan como texto
      valores.push(`%${filtro.busqueda.replace(/[\\%_]/g, '\\$&')}%`);
      condiciones.push(`(nombre ILIKE $${valores.length} OR descripcion ILIKE $${valores.length})`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const orden = filtro.ordenCatalogo ? 'categoria ASC, precio ASC' : 'created_at ASC';
    const { rows } = await pool.query(`SELECT * FROM productos ${where} ORDER BY ${orden}`, valores);
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

  async findByIds(ids = []) {
    if (ids.length === 0) return [];
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = ANY($1::uuid[])', [ids]);
    return rows.map(mapRow);
  },

  async create({ nombre, descripcion, precio, stock, tipo, categoria, especificaciones, imagen, activo = true }) {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, tipo, categoria, especificaciones, imagen, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nombre, descripcion, precio, stock, tipo, categoria, especificaciones, imagen || null, activo]
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
      // '' borra la imagen; undefined la deja como estaba
      imagen: update.imagen === undefined ? actual.imagen : (update.imagen || null),
      ventasRealizadas: actual.ventasRealizadas
    };

    const { rows } = await pool.query(
      `UPDATE productos
         SET nombre = $1, descripcion = $2, precio = $3, stock = $4, tipo = $5,
             categoria = $6, activo = $7, especificaciones = $8, imagen = $9,
             ventas_realizadas = $10, updated_at = now()
       WHERE id = $11
       RETURNING *`,
      [siguiente.nombre, siguiente.descripcion, siguiente.precio, siguiente.stock, siguiente.tipo,
        siguiente.categoria, siguiente.activo, siguiente.especificaciones, siguiente.imagen,
        siguiente.ventasRealizadas, id]
    );
    return mapRow(rows[0]);
  }
};

export default Producto;
