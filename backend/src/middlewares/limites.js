import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

// Límites de peticiones para frenar fuerza bruta y reservas abusivas.
// En los tests se desactivan, porque hacen muchas peticiones seguidas desde la misma IP.
const crearLimite = ({ minutos, maximo, message, ...opciones }) => rateLimit({
  windowMs: minutos * 60 * 1000,
  limit: maximo,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, statusCode: 429, message },
  ...opciones
});

// Tope general para toda la API, por IP
export const limiteGeneral = crearLimite({
  minutos: 15,
  maximo: 500,
  message: 'Demasiadas peticiones. Espera unos minutos y vuelve a intentar.'
});

// Solo cuentan los intentos fallidos: un usuario que entra bien no se bloquea
export const limiteLogin = crearLimite({
  minutos: 15,
  maximo: 10,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de inicio de sesión. Espera 15 minutos y vuelve a intentar.'
});

export const limiteRegistro = crearLimite({
  minutos: 60,
  maximo: 5,
  message: 'Demasiados registros desde esta conexión. Intenta más tarde.'
});

// Por usuario (va después de verificarToken); si no hubiera usuario, por IP
export const limiteReservas = crearLimite({
  minutos: 60,
  maximo: 10,
  keyGenerator: (req) => req.usuario?.id || ipKeyGenerator(req.ip),
  message: 'Hiciste demasiadas reservas en poco tiempo. Intenta más tarde o escríbenos por WhatsApp.'
});
