import db from '../db.js';
import Producto from './Producto.js';
import Carrito from './Carrito.js';
import { generarCodigoPedido } from '../utils/generateCode.js';

const Pedido = {
    crearDesdeCarrito(usuario_id, notas) {
        const crearTx = db.transaction(() => {
            const carrito = Carrito.verConItems(usuario_id);
            if (carrito.items.length === 0) throw new Error('El carrito está vacío.');

            let total = 0;
            const lineas = [];
            for (const item of carrito.items) {
                const producto = Producto.buscarPorId(item.producto_id);
                if (!producto) throw new Error(`Producto ${item.producto_id} no existe.`);
                if (producto.stock_disponible < item.cantidad) {
                    throw new Error(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock_disponible}).`);
                }
                total += producto.precio_unitario * item.cantidad;
                lineas.push({
                    producto_id: producto.id,
                    cantidad: item.cantidad,
                    precio_unitario_momento: producto.precio_unitario
                });
            }

            let codigo;
            do { codigo = generarCodigoPedido(); }
            while (db.prepare('SELECT 1 FROM pedidos WHERE codigo_pedido = ?').get(codigo));

            const infoPedido = db.prepare(`
                INSERT INTO pedidos (usuario_id, codigo_pedido, estado, total, notas)
                VALUES (?, ?, 'PENDIENTE', ?, ?)
            `).run(usuario_id, codigo, total, notas || null);

            const pedidoId = infoPedido.lastInsertRowid;
            const insertarItem = db.prepare(`
                INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario_momento)
                VALUES (?, ?, ?, ?)
            `);
            for (const linea of lineas) {
                insertarItem.run(pedidoId, linea.producto_id, linea.cantidad, linea.precio_unitario_momento);
                Producto.descontarStock(linea.producto_id, linea.cantidad);
            }

            db.prepare('DELETE FROM carrito_items WHERE carrito_id = ?').run(carrito.id);
            return pedidoId;
        });

        const pedidoId = crearTx();
        return this.buscarPorId(pedidoId);
    },
    buscarPorId(id) {
        const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
        if (!pedido) return null;
        pedido.items = db.prepare(`
            SELECT pi.*, p.nombre AS producto_nombre
            FROM pedido_items pi JOIN productos p ON p.id = pi.producto_id
            WHERE pi.pedido_id = ?
        `).all(id);
        return pedido;
    },
    buscarPorCodigo(codigo) {
        const pedido = db.prepare('SELECT * FROM pedidos WHERE codigo_pedido = ?').get(codigo);
        return pedido ? this.buscarPorId(pedido.id) : null;
    },
    listarPorUsuario(usuario_id) {
        const pedidos = db.prepare(
            'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_creacion DESC'
        ).all(usuario_id);
        return pedidos.map(p => this.buscarPorId(p.id));
    },
    listarTodos({ estado } = {}) {
        let query = `
            SELECT p.*, u.nombre AS cliente_nombre, u.telefono AS cliente_telefono
            FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id
        `;
        const params = [];
        if (estado) { query += ' WHERE p.estado = ?'; params.push(estado); }
        query += ' ORDER BY p.fecha_creacion DESC';
        const pedidos = db.prepare(query).all(...params);
        return pedidos.map(p => ({ ...p, items: this.buscarPorId(p.id).items }));
    },
    actualizarEstado(id, nuevoEstado) {
        const pedido = this.buscarPorId(id);
        if (!pedido) return null;
        if (nuevoEstado === 'CANCELADO' && pedido.estado === 'PENDIENTE') {
            const tx = db.transaction(() => {
                for (const item of pedido.items) Producto.reponerStock(item.producto_id, item.cantidad);
                db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(nuevoEstado, id);
            });
            tx();
        } else {
            db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(nuevoEstado, id);
        }
        return this.buscarPorId(id);
    },

    find(query = {}) { return this.listarTodos(query.estado ? { estado: query.estado } : {}); },
    findOne(query = {}) {
        if (query.codigo_pedido) return this.buscarPorCodigo(query.codigo_pedido);
        if (query.id) return this.buscarPorId(query.id);
        throw new Error(`Pedido.findOne: filtro no soportado: ${JSON.stringify(query)}`);
    },
    findById(id) { return this.buscarPorId(id); },
    findByIdAndUpdate(id, cambios) {
        if (cambios.estado) return this.actualizarEstado(id, cambios.estado);
        throw new Error('Pedido.findByIdAndUpdate: solo soporta actualizar "estado" por ahora.');
    }
};

export default Pedido;