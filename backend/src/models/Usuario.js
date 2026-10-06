import { pool } from '../config/database.js';

const mapRow = (row) => {
  if (!row) return null;
  const usuario = {
    id: row.id,
    _id: row.id,
    nombre: row.nombre,
    email: row.email,
    contrasena: row.contrasena,
    rol: row.rol,
    activo: row.activo,
    telefono: row.telefono,
    direccion: row.direccion,
    ciudad: row.ciudad,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  usuario.save = async function () {
    const { rows } = await pool.query(
      `UPDATE usuarios
         SET nombre = $1, email = $2, contrasena = $3, rol = $4, activo = $5,
             telefono = $6, direccion = $7, ciudad = $8, updated_at = now()
       WHERE id = $9
       RETURNING *`,
      [this.nombre, this.email, this.contrasena, this.rol, this.activo, this.telefono, this.direccion, this.ciudad, this.id]
    );
    return mapRow(rows[0]);
  };
  return usuario;
};

const Usuario = {
  async find(query = {}) {
    const { rows } = await pool.query('SELECT * FROM usuarios ORDER BY created_at ASC');
    return rows.map(mapRow).filter((usuario) =>
      Object.entries(query).every(([key, value]) => value === undefined || usuario[key] === value)
    );
  },

  async findOne(query = {}) {
    if (query.email !== undefined) {
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1 LIMIT 1', [query.email]);
      return mapRow(rows[0]);
    }
    if (query.id !== undefined || query._id !== undefined) {
      return this.findById(query.id ?? query._id);
    }
    const { rows } = await pool.query('SELECT * FROM usuarios LIMIT 1');
    return mapRow(rows[0]);
  },

  async findById(id) {
    if (!id) return null;
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    return mapRow(rows[0]);
  },

  async create({ nombre, email, contrasena, rol = 'cliente', activo = true, telefono, direccion, ciudad }) {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, contrasena, rol, activo, telefono, direccion, ciudad)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [nombre, email, contrasena, rol, activo, telefono, direccion, ciudad]
    );
    return mapRow(rows[0]);
  },

  async findByIdAndUpdate(id, update = {}) {
    const actual = await this.findById(id);
    if (!actual) return null;

    const siguiente = {
      nombre: update.nombre ?? actual.nombre,
      email: update.email ?? actual.email,
      contrasena: update.contrasena ?? actual.contrasena,
      rol: update.rol ?? actual.rol,
      activo: update.activo ?? actual.activo,
      telefono: update.telefono ?? actual.telefono,
      direccion: update.direccion ?? actual.direccion,
      ciudad: update.ciudad ?? actual.ciudad
    };

    const { rows } = await pool.query(
      `UPDATE usuarios
         SET nombre = $1, email = $2, contrasena = $3, rol = $4, activo = $5,
             telefono = $6, direccion = $7, ciudad = $8, updated_at = now()
       WHERE id = $9
       RETURNING *`,
      [siguiente.nombre, siguiente.email, siguiente.contrasena, siguiente.rol, siguiente.activo,
        siguiente.telefono, siguiente.direccion, siguiente.ciudad, id]
    );
    return mapRow(rows[0]);
  }
};

export default Usuario;
