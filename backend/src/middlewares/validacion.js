import { body, validationResult } from 'express-validator';

export function manejarValidacion(req, res, next) {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ error: errores.array()[0].msg, detalles: errores.array() });
    }
    next();
}

export const validarRegistro = [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
    body('email').isEmail().withMessage('Email inválido.'),
    body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    manejarValidacion
];

export const validarLogin = [
    body('email').isEmail().withMessage('Email inválido.'),
    body('contrasena').notEmpty().withMessage('La contraseña es obligatoria.'),
    manejarValidacion
];

export const validarItemCarrito = [
    body('producto_id').isInt({ min: 1 }).withMessage('producto_id inválido.'),
    body('cantidad').isInt({ min: 1 }).withMessage('cantidad debe ser mayor a 0.'),
    manejarValidacion
];