import db from '../db.js';

const Usuario = {
    findOne(query = {}) {
        const claves = Object.keys(query);
        if (claves.length === 0) return null;
        if (claves.length > 1) {
            throw new Error('Usuario.findOne solo soporta un campo a la vez en este adaptador.');
        }
        const [campo] = claves;
        const columnasPermitidas = ['email', 'id'];
        if (!columnasPermitidas.includes(campo)) {
            throw new Error(`Usuario.findOne: campo "${campo}" no soportado.`);
        }
        return db.prepare(`SELECT * FROM usuarios WHERE ${campo} = ?`).get(query[campo]) || null;
    },

    create({ nombre, email, password_hash, telefono, direccion, ciudad, rol = 'CLIENTE' }) {
        const info = db.prepare(`
            INSERT INTO usuarios (nombre, email, password_hash, telefono, direccion, ciudad, rol)
            VALUES (@nombre, @email, @password_hash, @telefono, @direccion, @ciudad, @rol)
        `).run({
            nombre, email, password_hash,
            telefono: telefono || null,
            direccion: direccion || null,
            ciudad: ciudad || null,
            rol
        });
        return this.findById(info.lastInsertRowid);
    },

    findById(id) {
        return db.prepare(`
            SELECT id, nombre, email, password_hash, telefono, direccion, ciudad, rol, fecha_registro, updated_at
            FROM usuarios WHERE id = ?
        `).get(id) || null;
    },

    findByIdAndUpdate(id, update = {}, options = {}) {
        const actual = this.findById(id);
        if (!actual) return null;

        const camposPermitidos = {
            nombre: 'nombre',
            telefono: 'telefono',
            direccion: 'direccion',
            ciudad: 'ciudad',
            password_hash: 'password_hash',
        };

        const sets = [];
        const valores = {};

        for (const [campoEntrada, columna] of Object.entries(camposPermitidos)) {
            if (Object.prototype.hasOwnProperty.call(update, campoEntrada)) {
                sets.push(`${columna} = @${columna}`);
                valores[columna] = update[campoEntrada];
            }
        }

        if (sets.length > 0) {
            sets.push(`updated_at = @updated_at`);
            valores.updated_at = new Date().toISOString();
            valores.id = id;
            db.prepare(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = @id`).run(valores);
        }

        return this.findById(id);
    },

    find(query = {}) {
        if (Object.keys(query).length > 0) {
            throw new Error('Usuario.find con filtros no está implementado todavía — dime qué filtro necesitas.');
        }
        return db.prepare(`
            SELECT id, nombre, email, telefono, direccion, ciudad, rol, fecha_registro, updated_at
            FROM usuarios ORDER BY fecha_registro DESC
        `).all();
    }
};

export default Usuario;