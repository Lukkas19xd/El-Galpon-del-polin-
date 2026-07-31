import express from 'express';
import { crearPedido, obtenerPedidosUsuario, obtenerTodosPedidos, obtenerPedido, actualizarEstadoPedido, buscarPedidoPorCodigo } from '../controllers/pedidoController.js';
import { verificarToken, verificarAdmin, verificarCliente } from '../middlewares/auth.js';

const router = express.Router();

// Rutas para clientes
router.post('/', verificarToken, verificarCliente, crearPedido);
router.get('/mis-pedidos', verificarToken, verificarCliente, obtenerPedidosUsuario);
router.get('/buscar', verificarToken, buscarPedidoPorCodigo);
router.get('/:id', verificarToken, verificarCliente, obtenerPedido);

// Rutas solo para administrador
router.get('/', verificarToken, verificarAdmin, obtenerTodosPedidos);
router.put('/:id/estado', verificarToken, verificarAdmin, actualizarEstadoPedido);

export default router;
