import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const noAutorizado = (res, message) => res.status(401).json({ success: false, statusCode: 401, message });

// Valida el token y además consulta la base: así una cuenta desactivada o con
// el rol cambiado deja de tener acceso al instante, sin esperar a que expire el token.
export const verificarToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return noAutorizado(res, 'No hay token de autenticación');
  }

  let decodificado;
  try {
    decodificado = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return noAutorizado(res, 'Token inválido o expirado');
  }

  try {
    const usuario = await Usuario.obtenerEstadoSesion(decodificado.id);
    if (!usuario) {
      return noAutorizado(res, 'La cuenta ya no existe');
    }
    if (!usuario.activo) {
      return res.status(403).json({ success: false, statusCode: 403, message: 'Tu cuenta ha sido desactivada' });
    }
    req.usuario = { id: usuario.id, rol: usuario.rol };
    next();
  } catch (error) {
    next(error);
  }
};

export const verificarAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción'
    });
  }

  next();
};

export const verificarCliente = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.usuario.rol !== 'cliente' && req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      success: false,
      message: 'Solo clientes pueden acceder'
    });
  }

  next();
};
