import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/errorHandler.js';

export const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No hay token de autenticación'
    });
  }

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = {
      id: decodificado.id,
      rol: decodificado.rol
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
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
