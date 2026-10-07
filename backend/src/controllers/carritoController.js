import Carrito from '../models/Carrito.js';
import Producto from '../models/Producto.js';
import { ApiError, asyncHandler } from '../utils/errorHandler.js';

const resolveProductoId = (producto) => {
  if (!producto) return null;
  return typeof producto === 'string' ? producto : producto.id || producto._id;
};

// Reemplaza los ids por los productos, con una sola consulta para todo el carrito
const populateCarrito = async (carrito) => {
  const items = carrito.items || [];
  const productos = await Producto.findByIds(items.map((item) => resolveProductoId(item.producto)));
  const productoPorId = new Map(productos.map((p) => [p.id, p]));

  return {
    ...carrito,
    items: items.map((item) => ({
      ...item,
      producto: productoPorId.get(resolveProductoId(item.producto)) || item.producto
    }))
  };
};

// Obtener carrito del usuario
export const obtenerCarrito = asyncHandler(async (req, res) => {
  let carrito = await Carrito.findOne({ usuario: req.usuario.id });

  if (!carrito) {
    carrito = await Carrito.create({ usuario: req.usuario.id, items: [], total: 0 });
  }

  const carritoResponse = await populateCarrito(carrito);

  res.status(200).json({
    success: true,
    carrito: carritoResponse
  });
});

// Agregar producto al carrito
export const agregarAlCarrito = asyncHandler(async (req, res) => {
  const { productoId, cantidad } = req.body;

  const producto = await Producto.findById(productoId);

  if (!producto || !producto.activo) {
    throw new ApiError('Producto no encontrado', 404);
  }

  let carrito = await Carrito.findOne({ usuario: req.usuario.id });

  if (!carrito) {
    carrito = await Carrito.create({ usuario: req.usuario.id, items: [], total: 0 });
  }

  const itemExistente = carrito.items.findIndex(item => resolveProductoId(item.producto) === productoId);
  const cantidadTotal = cantidad + (itemExistente > -1 ? carrito.items[itemExistente].cantidad : 0);

  // Se compara contra lo que ya había en el carrito más lo nuevo. El stock se
  // reserva de verdad recién al confirmar la reserva (ver Pedido.crearDesdeCarrito).
  if (producto.stock < cantidadTotal) {
    throw new ApiError(`Stock insuficiente. Disponible: ${producto.stock}`, 409);
  }

  if (itemExistente > -1) {
    carrito.items[itemExistente].cantidad = cantidadTotal;
  } else {
    carrito.items.push({
      producto: productoId,
      cantidad,
      precio: producto.precio
    });
  }

  carrito.total = carrito.items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
  await carrito.save();
  const carritoResponse = await populateCarrito(carrito);

  res.status(200).json({
    success: true,
    message: 'Producto agregado al carrito',
    carrito: carritoResponse
  });
});

// Eliminar producto del carrito
export const eliminarDelCarrito = asyncHandler(async (req, res) => {
  const { productoId } = req.params;

  const carrito = await Carrito.findOne({ usuario: req.usuario.id });

  if (!carrito) {
    throw new ApiError('Carrito no encontrado', 404);
  }

  carrito.items = carrito.items.filter(item => resolveProductoId(item.producto) !== productoId);
  carrito.total = carrito.items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
  await carrito.save();
  const carritoResponse = await populateCarrito(carrito);

  res.status(200).json({
    success: true,
    message: 'Producto eliminado del carrito',
    carrito: carritoResponse
  });
});

// Actualizar cantidad en carrito
export const actualizarCarrito = asyncHandler(async (req, res) => {
  const { productoId, cantidad } = req.body;

  const carrito = await Carrito.findOne({ usuario: req.usuario.id });

  if (!carrito) {
    throw new ApiError('Carrito no encontrado', 404);
  }

  const item = carrito.items.find(i => resolveProductoId(i.producto) === productoId);

  if (!item) {
    throw new ApiError('Producto no encontrado en el carrito', 404);
  }

  if (cantidad === 0) {
    carrito.items = carrito.items.filter(i => resolveProductoId(i.producto) !== productoId);
  } else {
    const producto = await Producto.findById(productoId);
    if (!producto || producto.stock < cantidad) {
      throw new ApiError(`Stock insuficiente. Disponible: ${producto ? producto.stock : 0}`, 409);
    }
    item.cantidad = cantidad;
  }

  carrito.total = carrito.items.reduce((sum, i) => sum + (i.cantidad * i.precio), 0);
  await carrito.save();
  const carritoResponse = await populateCarrito(carrito);

  res.status(200).json({
    success: true,
    message: 'Carrito actualizado',
    carrito: carritoResponse
  });
});

// Vaciar carrito
export const vaciarCarrito = asyncHandler(async (req, res) => {
  const carrito = await Carrito.findOne({ usuario: req.usuario.id });

  if (!carrito) {
    throw new ApiError('Carrito no encontrado', 404);
  }

  carrito.items = [];
  carrito.total = 0;
  await carrito.save();
  const carritoResponse = await populateCarrito(carrito);

  res.status(200).json({
    success: true,
    message: 'Carrito vaciado',
    carrito: carritoResponse
  });
});
