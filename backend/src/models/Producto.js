import db from '../db.js';

const Producto = {
    listar({ categoria, soloActivos = true } = {}) {
        let query = 'SELECT * FROM productos WHERE 1=1';
        const params = [];
        if (soloActivos) query += ' AND activo = 1';
        if (categoria) { query += ' AND categoria = ?'; params.push(categoria); }
        query += ' ORDER BY nombre';
        return db.prepare(query).all(...params);
    },
    buscarPorId(id) {
        return db.prepare('SELECT * FROM productos WHERE id = ?').get(id) || null;
    },
    crear(producto) {
        const stmt = db.prepare(`
            INSERT INTO productos (nombre, descripcion, categoria, dimensiones, precio_unitario, stock_disponible, imagen_url)
            VALUES (@nombre, @descripcion, @categoria, @dimensiones, @precio_unitario, @stock_disponible, @imagen_url)
        `);
        const info = stmt.run(producto);
        return this.buscarPorId(info.lastInsertRowid);
    },
    actualizar(id, cambios) {
        const actual = this.buscarPorId(id);
        if (!actual) return null;
        const merged = { ...actual, ...cambios, id };
        db.prepare(`
            UPDATE productos SET
                nombre = @nombre, descripcion = @descripcion, categoria = @categoria,
                dimensiones = @dimensiones, precio_unitario = @precio_unitario,
                stock_disponible = @stock_disponible, imagen_url = @imagen_url, activo = @activo
            WHERE id = @id
        `).run(merged);
        return this.buscarPorId(id);
    },
    descontarStock(id, cantidad) {
        return db.prepare(`
            UPDATE productos SET stock_disponible = stock_disponible - ?
            WHERE id = ? AND stock_disponible >= ?
        `).run(cantidad, id, cantidad);
    },
    reponerStock(id, cantidad) {
        return db.prepare(`
            UPDATE productos SET stock_disponible = stock_disponible + ? WHERE id = ?
        `).run(cantidad, id);
    },

    /**
     * Equivalente a Producto.find(query) estilo Mongoose, si tu
     * productoController.js lo usa. Ajusta los campos según lo
     * que realmente pase el controller (dime si necesitas más).
     */
    find(query = {}) {
        if (Object.keys(query).length === 0) {
            return this.listar({ soloActivos: false });
        }
        if (query.categoria) {
            return this.listar({ categoria: query.categoria, soloActivos: false });
        }
        throw new Error(`Producto.find: filtro no soportado: ${JSON.stringify(query)}`);
    },
    findById(id) {
        return this.buscarPorId(id);
    },
    findByIdAndUpdate(id, cambios) {
        return this.actualizar(id, cambios);
    }
};

export default Producto;