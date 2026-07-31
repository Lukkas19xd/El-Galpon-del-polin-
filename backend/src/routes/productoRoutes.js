import express from 'express';
import { obtenerProductos, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto, validarStock } from '../controllers/productoController.js';
import { verificarToken, verificarAdmin } from '../middlewares/auth.js';
import { validarProducto } from '../middlewares/validacion.js';

const router = express.Router();

// Rutas públicas
router.get('/', obtenerProductos);
router.get('/:id', obtenerProducto);
router.post('/validar-stock', validarStock);

// Rutas solo para administrador
router.post('/', verificarToken, verificarAdmin, validarProducto, crearProducto);
router.put('/:id', verificarToken, verificarAdmin, actualizarProducto);
router.delete('/:id', verificarToken, verificarAdmin, eliminarProducto);

export default router;
