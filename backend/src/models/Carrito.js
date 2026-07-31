import db from '../db.js';
import Producto from './Producto.js';

const Carrito = {
    obtenerOCrearActivo(usuario_id) {
        let carrito = db.prepare('SELECT * FROM carritos WHERE usuario_id = ?').get(usuario_id);
        if (!carrito) {
            const info = db.prepare('INSERT INTO carritos (usuario_id) VALUES (?)').run(usuario_id);
            carrito = db.prepare('SELECT * FROM carritos WHERE id = ?').get(info.lastInsertRowid);
        }
        return carrito;
    },
    verConItems(usuario_id) {
        const carrito = this.obtenerOCrearActivo(usuario_id);
        const items = db.prepare(`
            SELECT ci.id, ci.producto_id, ci.cantidad,
                   p.nombre, p.precio_unitario, p.stock_disponible, p.imagen_url
            FROM carrito_items ci
            JOIN productos p ON p.id = ci.producto_id
            WHERE ci.carrito_id = ?
        `).all(carrito.id);
        return { ...carrito, items };
    },
    agregarItem(usuario_id, producto_id, cantidad) {
        const tx = db.transaction(() => {
            const producto = Producto.buscarPorId(producto_id);
            if (!producto) throw new Error('Producto no existe.');
            if (producto.stock_disponible < cantidad) {
                throw new Error(`Stock insuficiente (disponible: ${producto.stock_disponible}).`);
            }
            const carrito = this.obtenerOCrearActivo(usuario_id);
            const existente = db.prepare(
                'SELECT * FROM carrito_items WHERE carrito_id = ? AND producto_id = ?'
            ).get(carrito.id, producto_id);
            if (existente) {
                db.prepare('UPDATE carrito_items SET cantidad = ? WHERE id = ?').run(cantidad, existente.id);
            } else {
                db.prepare('INSERT INTO carrito_items (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)')
                    .run(carrito.id, producto_id, cantidad);
            }
            db.prepare("UPDATE carritos SET fecha_actualizacion = datetime('now') WHERE id = ?").run(carrito.id);
            return carrito.id;
        });
        tx();
        return this.verConItems(usuario_id);
    },
    quitarItem(usuario_id, producto_id) {
        const carrito = this.obtenerOCrearActivo(usuario_id);
        db.prepare('DELETE FROM carrito_items WHERE carrito_id = ? AND producto_id = ?')
            .run(carrito.id, producto_id);
        return this.verConItems(usuario_id);
    },
    vaciar(usuario_id) {
        const carrito = this.obtenerOCrearActivo(usuario_id);
        db.prepare('DELETE FROM carrito_items WHERE carrito_id = ?').run(carrito.id);
    }
};

export default Carrito;