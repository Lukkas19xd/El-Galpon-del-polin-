import express from 'express';
import { registroUsuario, loginUsuario, obtenerPerfil, actualizarPerfil, obtenerUsuarios, cambiarContrasena } from '../controllers/authController.js';
import { verificarToken, verificarAdmin } from '../middlewares/auth.js';
import { validarRegistro, validarLogin } from '../middlewares/validacion.js';

const router = express.Router();

// Rutas públicas
router.post('/registro', validarRegistro, registroUsuario);
router.post('/login', validarLogin, loginUsuario);

// Rutas protegidas para usuarios autenticados
router.get('/perfil', verificarToken, obtenerPerfil);
router.get('/me', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.put('/cambiar-contrasena', verificarToken, cambiarContrasena);

// Rutas solo para administrador
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);

export default router;
