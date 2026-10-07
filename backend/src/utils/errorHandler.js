import { logger } from './logger.js';

// Manejo centralizado de errores
export class ApiError extends Error {
  constructor(message, statusCode, detalles) {
    super(message);
    this.statusCode = statusCode;
    this.detalles = detalles;
  }
}

// Errores de PostgreSQL que son culpa de la petición, no del servidor
const ERRORES_POSTGRES = {
  '22P02': [400, 'Dato con formato inválido'], // ej: un id que no es UUID
  '23505': [409, 'El registro ya existe'], // valor único repetido
  '23503': [409, 'El registro está siendo usado por otros datos'] // clave foránea
};

export const errorHandler = (err, req, res, next) => {
  const dePostgres = ERRORES_POSTGRES[err.code];
  // err.status lo usan los errores de Express, ej: JSON mal formado
  let statusCode = err.statusCode || err.status || (dePostgres ? dePostgres[0] : 500);
  let message = dePostgres && !err.statusCode ? dePostgres[1] : err.message;

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'El cuerpo de la petición no es JSON válido';
  }

  logger.error(`${req.method} ${req.originalUrl} -> ${err.message}${statusCode >= 500 ? `\n${err.stack}` : ''}`);

  // En producción un 500 no expone el mensaje interno (puede traer SQL, rutas, etc.)
  if (statusCode >= 500 && process.env.NODE_ENV !== 'development') {
    message = 'Error interno del servidor';
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: message || 'Error interno del servidor',
    ...(err.detalles && { detalles: err.detalles }),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack })
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
