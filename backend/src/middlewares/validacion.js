import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/errorHandler.js';
import { TIPOS_PRODUCTO, CATEGORIAS_PRODUCTO, ESTADOS_PEDIDO } from '../utils/constantes.js';

const LARGO_MINIMO_CONTRASENA = 8;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Responde 400 con el primer error como mensaje y la lista completa en `detalles`,
// con el mismo formato que el resto de los errores de la API.
export function manejarValidacion(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const detalles = errores.array().map((e) => ({ campo: e.path, mensaje: e.msg }));
    return next(new ApiError(detalles[0].mensaje, 400, detalles));
  }
  next();
}

// Para router.param: un id que no es UUID no puede existir, así que es un 404
// (sin esto Postgres responde con un error de formato).
export const validarId = (mensaje) => (req, res, next, id) => {
  if (!UUID.test(id)) {
    return next(new ApiError(mensaje, 404));
  }
  next();
};

const contrasenaNueva = (campo) => body(campo)
  .isString()
  .isLength({ min: LARGO_MINIMO_CONTRASENA, max: 100 })
  .withMessage(`La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`);

const confirmacionDe = (campo) => body('confirmacion')
  .custom((valor, { req }) => valor === req.body[campo])
  .withMessage('Las contraseñas no coinciden.');

// ---------- Autenticación ----------
export const validarRegistro = [
  body('nombre').isString().trim().notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo.'),
  body('email').isString().trim().isEmail().withMessage('Email inválido.'),
  body('telefono').optional({ values: 'falsy' }).isString().trim()
    .matches(/^[0-9+\s()-]{6,20}$/).withMessage('Teléfono inválido: usa solo números, espacios y + ( ) -.'),
  contrasenaNueva('contrasena'),
  confirmacionDe('contrasena'),
  manejarValidacion
];

export const validarLogin = [
  body('email').isString().trim().isEmail().withMessage('Email inválido.'),
  body('contrasena').isString().notEmpty().withMessage('La contraseña es obligatoria.'),
  manejarValidacion
];

export const validarPerfil = [
  body('nombre').optional().isString().trim().notEmpty().withMessage('El nombre no puede quedar vacío.')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo.'),
  body('telefono').optional({ values: 'null' }).isString().trim()
    .matches(/^[0-9+\s()-]{0,20}$/).withMessage('Teléfono inválido: usa solo números, espacios y + ( ) -.'),
  body('direccion').optional({ values: 'null' }).isString().trim()
    .isLength({ max: 200 }).withMessage('La dirección es demasiado larga.'),
  body('ciudad').optional({ values: 'null' }).isString().trim()
    .isLength({ max: 100 }).withMessage('La ciudad es demasiado larga.'),
  manejarValidacion
];

export const validarCambioContrasena = [
  body('contrasenaActual').isString().notEmpty().withMessage('Ingresa tu contraseña actual.'),
  contrasenaNueva('contrasenanueva'),
  confirmacionDe('contrasenanueva'),
  manejarValidacion
];

// Cambios que el admin puede hacer sobre otra cuenta
export const validarActualizarUsuario = [
  body('rol').optional().isIn(['cliente', 'administrador']).withMessage('Rol inválido.'),
  body('activo').optional().isBoolean({ strict: true }).withMessage('activo debe ser true o false.'),
  manejarValidacion
];

// ---------- Carrito ----------
const productoIdValido = body('productoId').isUUID().withMessage('productoId inválido.');

export const validarItemCarrito = [
  productoIdValido,
  body('cantidad').isInt({ min: 1, max: 10000 }).withMessage('La cantidad debe ser un número entre 1 y 10.000.').toInt(),
  manejarValidacion
];

// En /actualizar, cantidad 0 es válida: significa quitar el producto del carrito.
export const validarActualizarCarrito = [
  productoIdValido,
  body('cantidad').isInt({ min: 0, max: 10000 }).withMessage('La cantidad debe ser un número entre 0 y 10.000.').toInt(),
  manejarValidacion
];

// ---------- Productos ----------
const camposProducto = (opcional) => {
  const campo = (nombre) => (opcional ? body(nombre).optional() : body(nombre));
  return [
    campo('nombre').isString().trim().notEmpty().withMessage('El nombre es obligatorio.')
      .isLength({ max: 150 }).withMessage('El nombre es demasiado largo.'),
    body('descripcion').optional({ values: 'null' }).isString().isLength({ max: 2000 })
      .withMessage('La descripción es demasiado larga.'),
    campo('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0.').toFloat(),
    campo('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0.').toInt(),
    campo('tipo').isIn(TIPOS_PRODUCTO).withMessage(`Tipo inválido. Valores posibles: ${TIPOS_PRODUCTO.join(', ')}.`),
    campo('categoria').isIn(CATEGORIAS_PRODUCTO).withMessage(`Categoría inválida. Valores posibles: ${CATEGORIAS_PRODUCTO.join(', ')}.`),
    body('especificaciones').optional({ values: 'null' }).isObject().withMessage('especificaciones debe ser un objeto.'),
    // URL https o ruta del propio sitio (ej: src/img/productos/lena.jpg); '' la borra
    body('imagen').optional({ values: 'null' }).isString().trim()
      .matches(/^(|https:\/\/\S+|\/?src\/img\/[\w./-]+)$/).withMessage('La imagen debe ser una URL https:// o una ruta dentro de src/img/.')
      .isLength({ max: 500 }).withMessage('La URL de la imagen es demasiado larga.'),
    body('activo').optional().isBoolean({ strict: true }).withMessage('activo debe ser true o false.'),
    manejarValidacion
  ];
};

export const validarProducto = camposProducto(false);
export const validarActualizarProducto = camposProducto(true);

export const validarConsultaStock = [
  productoIdValido,
  body('cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser un número mayor a 0.').toInt(),
  manejarValidacion
];

// ---------- Reservas ----------
export const validarPedido = [
  body('fechaRetiro').isISO8601().withMessage('La fecha de retiro es requerida y debe ser válida.'),
  body('nota').optional({ values: 'null' }).isString().trim()
    .isLength({ max: 500 }).withMessage('La nota no puede superar los 500 caracteres.'),
  manejarValidacion
];

export const validarCambioEstado = [
  body('estado').isIn(ESTADOS_PEDIDO).withMessage(`Estado inválido. Valores posibles: ${ESTADOS_PEDIDO.join(', ')}.`),
  body('nota').optional({ values: 'null' }).isString().trim()
    .isLength({ max: 300 }).withMessage('La nota no puede superar los 300 caracteres.'),
  manejarValidacion
];
