import express from 'express';
import { registroUsuario, loginUsuario, obtenerPerfil, actualizarPerfil, obtenerUsuarios, actualizarUsuario, cambiarContrasena } from '../controllers/authController.js';
import { verificarToken, verificarAdmin } from '../middlewares/auth.js';
import { validarId, validarRegistro, validarLogin, validarPerfil, validarCambioContrasena, validarActualizarUsuario } from '../middlewares/validacion.js';
import { limiteLogin, limiteRegistro } from '../middlewares/limites.js';

const router = express.Router();

router.param('id', validarId('Usuario no encontrado'));

// Rutas públicas
router.post('/registro', limiteRegistro, validarRegistro, registroUsuario);
router.post('/login', limiteLogin, validarLogin, loginUsuario);

// Rutas protegidas
router.get('/perfil', verificarToken, obtenerPerfil);
router.get('/me', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, validarPerfil, actualizarPerfil);
router.put('/cambiar-contrasena', verificarToken, limiteLogin, validarCambioContrasena, cambiarContrasena);

// Rutas solo para administrador
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);
router.put('/usuarios/:id', verificarToken, verificarAdmin, validarActualizarUsuario, actualizarUsuario);

export default router;
