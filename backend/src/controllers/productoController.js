import Producto from '../models/Producto.js';
import { ApiError, asyncHandler } from '../utils/errorHandler.js';

// Obtener todos los productos
export const obtenerProductos = asyncHandler(async (req, res) => {
  const { tipo, categoria, pagina = 1, limite = 10 } = req.query;

  const filtro = { activo: true };
  if (tipo) filtro.tipo = tipo;
  if (categoria) filtro.categoria = categoria;

  const productos = await Producto.find(filtro);
  const total = productos.length;
  const skip = (pagina - 1) * limite;
  const productosPaginados = productos.slice(skip, skip + limite);

  res.status(200).json({
    success: true,
    total,
    paginas: Math.ceil(total / limite),
    paginaActual: pagina,
    productos: productosPaginados
  });
});

// Obtener un producto por ID
export const obtenerProducto = asyncHandler(async (req, res) => {
  const producto = await Producto.findById(req.params.id);

  if (!producto) {
    throw new ApiError('Producto no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    producto
  });
});

// Crear nuevo producto (solo admin)
export const crearProducto = asyncHandler(async (req, res) => {
  const { nombre, descripcion, precio, stock, tipo, categoria, especificaciones } = req.body;

  const producto = await Producto.create({
    nombre,
    descripcion,
    precio,
    stock,
    tipo,
    categoria,
    especificaciones
  });

  res.status(201).json({
    success: true,
    message: 'Producto creado exitosamente',
    producto
  });
});

// Actualizar producto (solo admin)
export const actualizarProducto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, tipo, categoria, especificaciones, activo } = req.body;

  const producto = await Producto.findByIdAndUpdate(
    id,
    { nombre, descripcion, precio, stock, tipo, categoria, especificaciones, activo, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!producto) {
    throw new ApiError('Producto no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Producto actualizado exitosamente',
    producto
  });
});

// Eliminar producto (solo admin - cambiar a inactivo)
export const eliminarProducto = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const producto = await Producto.findByIdAndUpdate(
    id,
    { activo: false, updatedAt: Date.now() },
    { new: true }
  );

  if (!producto) {
    throw new ApiError('Producto no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Producto eliminado exitosamente'
  });
});

// Validar disponibilidad de stock
export const validarStock = asyncHandler(async (req, res) => {
  const { productoId, cantidad } = req.body;

  const producto = await Producto.findById(productoId);

  if (!producto) {
    throw new ApiError('Producto no encontrado', 404);
  }

  if (producto.stock < cantidad) {
    res.status(200).json({
      success: true,
      disponible: false,
      stockActual: producto.stock,
      solicitado: cantidad,
      message: 'Stock insuficiente'
    });
  } else {
    res.status(200).json({
      success: true,
      disponible: true,
      stockActual: producto.stock,
      solicitado: cantidad
    });
  }
});
