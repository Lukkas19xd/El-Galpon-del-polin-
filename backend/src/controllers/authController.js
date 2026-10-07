import bcryptjs from 'bcryptjs';
import Usuario from '../models/Usuario.js';
import jwt from 'jsonwebtoken';
import { ApiError, asyncHandler } from '../utils/errorHandler.js';

const generarToken = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Registro de usuario
export const registroUsuario = asyncHandler(async (req, res) => {
  const { nombre, email, contrasena, telefono } = req.body;

  let usuario = await Usuario.findOne({ email });
  if (usuario) {
    throw new ApiError('El email ya está registrado', 409);
  }

  const hashedPassword = await bcryptjs.hash(contrasena, await bcryptjs.genSalt(10));

  usuario = await Usuario.create({
    nombre,
    email,
    contrasena: hashedPassword,
    rol: 'cliente',
    activo: true,
    telefono: telefono || null
  });

  const token = generarToken(usuario._id, usuario.rol);

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    token,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    }
  });
});

// Login de usuario
export const loginUsuario = asyncHandler(async (req, res) => {
  const { email, contrasena } = req.body;

  const usuario = await Usuario.findOne({ email });

  if (!usuario || !usuario.contrasena) {
    throw new ApiError('Credenciales inválidas', 401);
  }

  const esValida = await bcryptjs.compare(contrasena, usuario.contrasena);

  if (!esValida) {
    throw new ApiError('Credenciales inválidas', 401);
  }

  if (!usuario.activo) {
    throw new ApiError('Tu cuenta ha sido desactivada', 403);
  }

  const token = generarToken(usuario._id, usuario.rol);

  res.status(200).json({
    success: true,
    message: 'Login exitoso',
    token,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    }
  });
});

// Obtener perfil del usuario
export const obtenerPerfil = asyncHandler(async (req, res) => {
  const usuario = await Usuario.findById(req.usuario.id);

  if (!usuario) {
    throw new ApiError('Usuario no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    usuario
  });
});

// Actualizar perfil del usuario
export const actualizarPerfil = asyncHandler(async (req, res) => {
  const { nombre, telefono, direccion, ciudad } = req.body;

  const usuario = await Usuario.findByIdAndUpdate(req.usuario.id, { nombre, telefono, direccion, ciudad });

  if (!usuario) {
    throw new ApiError('Usuario no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    usuario
  });
});

// Obtener todos los usuarios (solo admin)
export const obtenerUsuarios = asyncHandler(async (req, res) => {
  const usuarios = await Usuario.find();

  res.status(200).json({
    success: true,
    total: usuarios.length,
    usuarios
  });
});

// Cambiar rol o activar/desactivar una cuenta (solo admin)
export const actualizarUsuario = asyncHandler(async (req, res) => {
  const { rol, activo } = req.body;

  // Evita que el admin se quite el acceso a sí mismo por error
  if (req.params.id === req.usuario.id && (rol === 'cliente' || activo === false)) {
    throw new ApiError('No puedes quitarte el rol de administrador ni desactivar tu propia cuenta', 400);
  }

  const usuario = await Usuario.findByIdAndUpdate(req.params.id, { rol, activo });

  if (!usuario) {
    throw new ApiError('Usuario no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Usuario actualizado',
    usuario
  });
});

// Cambiar contraseña
export const cambiarContrasena = asyncHandler(async (req, res) => {
  const { contrasenaActual, contrasenanueva } = req.body;

  const usuario = await Usuario.findById(req.usuario.id);

  if (!usuario || !usuario.contrasena) {
    throw new ApiError('Usuario no encontrado', 404);
  }

  const esValida = await bcryptjs.compare(contrasenaActual, usuario.contrasena);

  if (!esValida) {
    throw new ApiError('Contraseña actual incorrecta', 401);
  }

  const hashedPassword = await bcryptjs.hash(contrasenanueva, await bcryptjs.genSalt(10));
  await Usuario.findByIdAndUpdate(req.usuario.id, { contrasena: hashedPassword });

  res.status(200).json({
    success: true,
    message: 'Contraseña cambiada exitosamente'
  });
});
