import express from 'express';
import { obtenerProductos, obtenerProductosAdmin, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto, validarStock } from '../controllers/productoController.js';
import { verificarToken, verificarAdmin } from '../middlewares/auth.js';
import { validarId, validarProducto, validarActualizarProducto, validarConsultaStock } from '../middlewares/validacion.js';

const router = express.Router();

router.param('id', validarId('Producto no encontrado'));

// Rutas públicas
router.get('/', obtenerProductos);
router.get('/admin/todos', verificarToken, verificarAdmin, obtenerProductosAdmin);
router.get('/:id', obtenerProducto);
router.post('/validar-stock', validarConsultaStock, validarStock);

// Rutas solo para administrador
router.post('/', verificarToken, verificarAdmin, validarProducto, crearProducto);
router.put('/:id', verificarToken, verificarAdmin, validarActualizarProducto, actualizarProducto);
router.delete('/:id', verificarToken, verificarAdmin, eliminarProducto);

export default router;
