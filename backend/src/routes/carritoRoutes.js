import express from 'express';
import { obtenerCarrito, agregarAlCarrito, eliminarDelCarrito, actualizarCarrito, vaciarCarrito } from '../controllers/carritoController.js';
import { verificarToken, verificarCliente } from '../middlewares/auth.js';
import { validarItemCarrito, validarActualizarCarrito } from '../middlewares/validacion.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.get('/', verificarToken, verificarCliente, obtenerCarrito);
router.post('/agregar', verificarToken, verificarCliente, validarItemCarrito, agregarAlCarrito);
router.put('/actualizar', verificarToken, verificarCliente, validarActualizarCarrito, actualizarCarrito);
router.delete('/producto/:productoId', verificarToken, verificarCliente, eliminarDelCarrito);
router.delete('/vaciar', verificarToken, verificarCliente, vaciarCarrito);

export default router;
