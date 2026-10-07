import Pedido from '../models/Pedido.js';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';
import { generarCodigoUnico } from '../utils/generateCode.js';
import { ApiError, asyncHandler } from '../utils/errorHandler.js';
import { ESTADOS_ACTIVOS } from '../utils/constantes.js';
import { notificarNuevaReserva, confirmarReservaCliente, avisarPedidoListo } from '../utils/mailer.js';
import { negocio } from '../../data/negocio.js';
import { logger } from '../utils/logger.js';

// Reemplaza los ids de usuario y productos por sus datos, con una consulta por
// tabla para todos los pedidos juntos (no una por pedido ni por ítem).
const poblarPedidos = async (pedidos) => {
  if (pedidos.length === 0) return [];

  const idsUsuarios = [...new Set(pedidos.map((p) => p.usuario))];
  const idsProductos = [...new Set(pedidos.flatMap((p) => p.items.map((i) => i.producto)))];
  const [usuarios, productos] = await Promise.all([
    Usuario.findByIds(idsUsuarios),
    Producto.findByIds(idsProductos)
  ]);
  const usuarioPorId = new Map(usuarios.map((u) => [u.id, u]));
  const productoPorId = new Map(productos.map((p) => [p.id, p]));

  return pedidos.map((pedido) => ({
    ...pedido,
    usuario: usuarioPorId.get(pedido.usuario) || pedido.usuario,
    items: pedido.items.map((item) => ({
      ...item,
      producto: productoPorId.get(item.producto) || item.producto
    }))
  }));
};

const poblarPedido = async (pedido) => (await poblarPedidos([pedido]))[0];

// Devuelve la fecha de retiro como Date. Acepta 'YYYY-MM-DD' (input date del
// frontend), que se fija al mediodía local para que la zona horaria no la
// corra al día anterior.
const parsearFechaRetiro = (fechaRetiro) => {
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaRetiro)
    ? new Date(`${fechaRetiro}T12:00:00`)
    : new Date(fechaRetiro);
  if (isNaN(fecha.getTime())) {
    throw new ApiError('Fecha de retiro inválida', 400);
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha < hoy) {
    throw new ApiError('La fecha de retiro no puede ser pasada', 400);
  }
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + negocio.anticipacionMaximaDias + 1);
  if (fecha >= limite) {
    throw new ApiError(`Solo se puede reservar con hasta ${negocio.anticipacionMaximaDias} días de anticipación`, 400);
  }
  if (!negocio.diasRetiro.includes(fecha.getDay())) {
    throw new ApiError('Ese día no hay atención para retiros; elige otra fecha', 400);
  }
  return fecha;
};

const itemsParaCorreo = (pedidoPoblado) => pedidoPoblado.items.map((item) => ({
  nombre: item.producto?.nombre || 'Producto',
  cantidad: item.cantidad,
  subtotal: item.subtotal
}));

// Los correos van después de responder para no demorar la petición,
// así que cualquier error acá solo se registra.
const enviarCorreosEnSegundoPlano = (pedido, enviar) => {
  poblarPedido(pedido)
    .then(enviar)
    .catch((error) => logger.error(`Error preparando correos del pedido ${pedido.numeroOrden}: ${error.message}`));
};

// Crear reserva desde carrito. Por ahora no hay pago en línea: el cliente
// solo elige la fecha de retiro y paga al retirar en el galpón.
export const crearPedido = asyncHandler(async (req, res) => {
  const fechaRetiro = parsearFechaRetiro(req.body.fechaRetiro);

  // Evita que una sola cuenta aparte todo el stock con muchas reservas
  const activas = await Pedido.count({ usuario: req.usuario.id, estados: ESTADOS_ACTIVOS });
  if (activas >= negocio.maxReservasActivasPorCliente) {
    throw new ApiError(
      `Ya tienes ${activas} reservas por retirar. Retira o cancela alguna antes de hacer otra.`,
      409
    );
  }

  const pedido = await Pedido.crearDesdeCarrito({
    usuarioId: req.usuario.id,
    numeroOrden: `RES-${await generarCodigoUnico()}`,
    fechaRetiro,
    nota: req.body.nota || null,
    metodoPago: 'pago_al_retiro',
    direccionEntrega: 'Retiro en galpón'
  });

  res.status(201).json({
    success: true,
    message: 'Reserva creada exitosamente',
    pedido: {
      numeroOrden: pedido.numeroOrden,
      total: pedido.total,
      estado: pedido.estado,
      fechaRetiro: pedido.fechaRetiro
    }
  });

  // Aviso al negocio y confirmación al cliente
  enviarCorreosEnSegundoPlano(pedido, (poblado) => {
    const datos = { pedido: poblado, cliente: poblado.usuario, items: itemsParaCorreo(poblado) };
    return Promise.all([notificarNuevaReserva(datos), confirmarReservaCliente(datos)]);
  });
});

// Obtener pedidos del usuario
export const obtenerPedidosUsuario = asyncHandler(async (req, res) => {
  const pedidos = await poblarPedidos(await Pedido.find({ usuario: req.usuario.id }, { orden: 'recientes' }));

  res.status(200).json({
    success: true,
    total: pedidos.length,
    pedidos
  });
});

// Obtener todos los pedidos (solo admin), paginados en la base de datos
export const obtenerTodosPedidos = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite, 10) || 10));

  const filtro = estado ? { estado } : {};
  const [total, pedidos] = await Promise.all([
    Pedido.count(filtro),
    Pedido.find(filtro, { orden: 'recientes', limite, offset: (pagina - 1) * limite })
  ]);

  res.status(200).json({
    success: true,
    total,
    paginas: Math.ceil(total / limite),
    paginaActual: pagina,
    pedidos: await poblarPedidos(pedidos)
  });
});

// Buscar pedido por código
export const buscarPedidoPorCodigo = asyncHandler(async (req, res) => {
  const codigo = typeof req.query.codigo === 'string' ? req.query.codigo.trim().toUpperCase() : '';

  if (!codigo) {
    throw new ApiError('El código de pedido es requerido', 400);
  }

  const pedido = await Pedido.findOne({ numeroOrden: codigo });

  // Mismo 404 si no existe o si es de otro cliente, para no revelar códigos ajenos
  if (!pedido || (req.usuario.rol !== 'administrador' && pedido.usuario !== req.usuario.id)) {
    throw new ApiError('Pedido no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    pedido: await poblarPedido(pedido)
  });
});

// Obtener un pedido por ID
export const obtenerPedido = asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);

  if (!pedido || (req.usuario.rol !== 'administrador' && pedido.usuario !== req.usuario.id)) {
    throw new ApiError('Pedido no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    pedido: await poblarPedido(pedido)
  });
});

// Actualizar estado del pedido (solo admin)
export const actualizarEstadoPedido = asyncHandler(async (req, res) => {
  const { estado, nota } = req.body;
  const pedido = await Pedido.cambiarEstado(req.params.id, estado, nota);

  res.status(200).json({
    success: true,
    message: 'Estado del pedido actualizado',
    pedido
  });

  if (estado === 'listo') {
    enviarCorreosEnSegundoPlano(pedido, (poblado) => avisarPedidoListo({ pedido: poblado, cliente: poblado.usuario }));
  }
});

// Reservas por retirar (solo admin): las activas, ordenadas por fecha de retiro.
// Incluye las atrasadas (fecha pasada y aún sin retirar) para que no se pierdan.
export const obtenerRetiros = asyncHandler(async (req, res) => {
  const pedidos = await Pedido.find({ estados: ESTADOS_ACTIVOS, conFechaRetiro: true }, { orden: 'retiro' });

  res.status(200).json({
    success: true,
    total: pedidos.length,
    pedidos: await poblarPedidos(pedidos)
  });
});
