import express from 'express';
import { crearPedido, obtenerPedidosUsuario, obtenerTodosPedidos, obtenerPedido, actualizarEstadoPedido, buscarPedidoPorCodigo, obtenerRetiros } from '../controllers/pedidoController.js';
import { verificarToken, verificarAdmin, verificarCliente } from '../middlewares/auth.js';
import { validarId, validarPedido, validarCambioEstado } from '../middlewares/validacion.js';
import { limiteReservas } from '../middlewares/limites.js';

const router = express.Router();

router.param('id', validarId('Pedido no encontrado'));

// Rutas para clientes
router.post('/', verificarToken, verificarCliente, limiteReservas, validarPedido, crearPedido);
router.get('/mis-pedidos', verificarToken, verificarCliente, obtenerPedidosUsuario);
router.get('/buscar', verificarToken, buscarPedidoPorCodigo);

// Rutas solo para administrador (antes de /:id para que "retiros" no se tome como id)
router.get('/retiros', verificarToken, verificarAdmin, obtenerRetiros);
router.get('/', verificarToken, verificarAdmin, obtenerTodosPedidos);
router.put('/:id/estado', verificarToken, verificarAdmin, validarCambioEstado, actualizarEstadoPedido);

// Un cliente solo ve sus pedidos; el admin, cualquiera (lo controla obtenerPedido)
router.get('/:id', verificarToken, verificarCliente, obtenerPedido);

export default router;
