import Pedido from '../models/Pedido.js';
import Carrito from '../models/Carrito.js';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';
import { generarCodigoUnico } from '../utils/generateCode.js';
import { ApiError, asyncHandler } from '../utils/errorHandler.js';

const getRefId = (ref) => {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id || ref._id;
};

const populatePedido = async (pedido) => {
  const usuarioCompleto = await Usuario.findById(getRefId(pedido.usuario));
  const usuarioSeguro = usuarioCompleto
    ? (({ contrasena, ...resto }) => resto)(usuarioCompleto)
    : pedido.usuario;

  const items = await Promise.all(
    (pedido.items || []).map(async (item) => {
      const producto = await Producto.findById(getRefId(item.producto));
      return {
        ...item,
        producto: producto || item.producto
      };
    })
  );

  return {
    ...pedido,
    usuario: usuarioSeguro,
    items
  };
};

const validarFechaRetiro = (fechaRetiro) => {
  if (!fechaRetiro) return;
  const fecha = new Date(fechaRetiro);
  const ahora = new Date();
  if (isNaN(fecha.getTime())) {
    throw new ApiError('Fecha de retiro inválida', 400);
  }
  if (fecha <= ahora) {
    throw new ApiError('La fecha de retiro no puede ser pasada', 400);
  }
};

const restablecerStock = async (items) => {
  for (const item of items) {
    const producto = await Producto.findById(getRefId(item.producto));
    if (producto) {
      await Producto.findByIdAndUpdate(getRefId(item.producto), {
        $inc: { stock: item.cantidad, ventasRealizadas: -item.cantidad },
        updatedAt: new Date()
      });
    }
  }
};

// Crear pedido desde carrito
export const crearPedido = asyncHandler(async (req, res) => {
  const { metodoPago, direccionEntrega, fechaRetiro } = req.body;

  if (!metodoPago || !direccionEntrega) {
    throw new ApiError('Falta información del pedido', 400);
  }

  validarFechaRetiro(fechaRetiro);

  const carrito = await Carrito.findOne({ usuario: req.usuario.id });

  if (!carrito || carrito.items.length === 0) {
    throw new ApiError('El carrito está vacío', 400);
  }

  // Validar stock de todos los productos
  for (const item of carrito.items) {
    const producto = await Producto.findById(getRefId(item.producto));
    if (!producto) {
      throw new ApiError('Producto no encontrado en el carrito', 404);
    }
    if (producto.stock < item.cantidad) {
      throw new ApiError(`Stock insuficiente para ${producto.nombre}`, 400);
    }
  }

  // Crear el pedido
  const numeroOrden = `RES-${await generarCodigoUnico()}`;
  const items = carrito.items.map(item => ({
    producto: getRefId(item.producto),
    cantidad: item.cantidad,
    precioUnitario: item.precio,
    subtotal: item.cantidad * item.precio
  }));

  const pedido = await Pedido.create({
    numeroOrden,
    usuario: req.usuario.id,
    items,
    total: carrito.total,
    metodoPago,
    direccionEntrega,
    fechaRetiro: fechaRetiro ? new Date(fechaRetiro) : undefined,
    historialEstados: [
      {
        estado: 'pendiente',
        fecha: new Date(),
        nota: 'Pedido creado'
      }
    ]
  });

  const productosDescargados = [];

  try {
    for (const item of carrito.items) {
      const producto = await Producto.findById(getRefId(item.producto));
      if (!producto) {
        throw new ApiError('Producto no encontrado al actualizar stock', 404);
      }

      await Producto.findByIdAndUpdate(getRefId(item.producto), {
        $inc: { stock: -item.cantidad, ventasRealizadas: item.cantidad },
        updatedAt: new Date()
      });
      productosDescargados.push(item);
    }
  } catch (error) {
    await restablecerStock(productosDescargados);
    await Pedido.findByIdAndUpdate(pedido._id, { estado: 'cancelado', updatedAt: new Date() });
    throw error;
  }

  // Vaciar carrito
  carrito.items = [];
  carrito.total = 0;
  await carrito.save();

  res.status(201).json({
    success: true,
    message: 'Pedido creado exitosamente',
    pedido: {
      numeroOrden: pedido.numeroOrden,
      total: pedido.total,
      estado: pedido.estado
    }
  });
});

// Obtener pedidos del usuario
export const obtenerPedidosUsuario = asyncHandler(async (req, res) => {
  const pedidos = await Pedido.find({ usuario: req.usuario.id });
  const pedidosOrdenados = pedidos.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pedidosPopulados = await Promise.all(pedidosOrdenados.map(populatePedido));

  res.status(200).json({
    success: true,
    total: pedidosPopulados.length,
    pedidos: pedidosPopulados
  });
});

// Obtener todos los pedidos (solo admin)
export const obtenerTodosPedidos = asyncHandler(async (req, res) => {
  const { estado, pagina = 1, limite = 10 } = req.query;

  const filtro = {};
  if (estado) filtro.estado = estado;

  const pedidos = await Pedido.find(filtro);
  const total = pedidos.length;
  const skip = (pagina - 1) * limite;
  const pedidosOrdenados = pedidos.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pedidosPaginados = pedidosOrdenados.slice(skip, skip + limite);
  const pedidosPopulados = await Promise.all(pedidosPaginados.map(populatePedido));

  res.status(200).json({
    success: true,
    total,
    paginas: Math.ceil(total / limite),
    paginaActual: pagina,
    pedidos: pedidosPopulados
  });
});

// Buscar pedido por código
export const buscarPedidoPorCodigo = asyncHandler(async (req, res) => {
  const { codigo } = req.query;

  if (!codigo) {
    throw new ApiError('El código de pedido es requerido', 400);
  }

  const pedido = await Pedido.findOne({ numeroOrden: codigo });

  if (!pedido) {
    throw new ApiError('Pedido no encontrado', 404);
  }

  if (req.usuario.rol === 'cliente' && getRefId(pedido.usuario) !== req.usuario.id) {
    throw new ApiError('No autorizado', 403);
  }

  const pedidoPopulado = await populatePedido(pedido);
  res.status(200).json({
    success: true,
    pedido: pedidoPopulado
  });
});

// Obtener un pedido por ID
export const obtenerPedido = asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);

  if (!pedido) {
    throw new ApiError('Pedido no encontrado', 404);
  }

  const pedidoPopulado = await populatePedido(pedido);
  const usuarioId = getRefId(pedidoPopulado.usuario);

  if (usuarioId !== req.usuario.id && req.usuario.rol !== 'administrador') {
    throw new ApiError('No autorizado', 403);
  }

  res.status(200).json({
    success: true,
    pedido: pedidoPopulado
  });
});

// Actualizar estado del pedido (solo admin)
export const actualizarEstadoPedido = asyncHandler(async (req, res) => {
  const { estado, nota } = req.body;
  const estadosValidos = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];

  if (!estado || !estadosValidos.includes(estado)) {
    throw new ApiError('Estado de pedido inválido', 400);
  }

  const pedido = await Pedido.findById(req.params.id);

  if (!pedido) {
    throw new ApiError('Pedido no encontrado', 404);
  }

  const estadoActual = pedido.estado;
  if (estado === estadoActual) {
    throw new ApiError('El pedido ya tiene ese estado', 400);
  }

  const transicionesValidas = {
    pendiente: ['confirmado', 'cancelado'],
    confirmado: ['enviado', 'cancelado'],
    enviado: ['entregado', 'cancelado'],
    entregado: [],
    cancelado: []
  };

  if (!transicionesValidas[estadoActual].includes(estado)) {
    throw new ApiError(`No se puede cambiar de ${estadoActual} a ${estado}`, 400);
  }

  if (estado === 'cancelado' && estadoActual !== 'cancelado') {
    await restablecerStock(pedido.items);
  }

  pedido.historialEstados.push({
    estado,
    fecha: new Date(),
    nota
  });

  pedido.estado = estado;
  pedido.updatedAt = new Date();
  await pedido.save();

  res.status(200).json({
    success: true,
    message: 'Estado del pedido actualizado',
    pedido
  });
});
