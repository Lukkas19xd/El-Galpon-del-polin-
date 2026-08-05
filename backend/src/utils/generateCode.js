import { pedidosDB } from '../db.js';

export async function generarCodigoUnico() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo;
    let existe = true;

    while (existe) {
        codigo = '';
        for (let i = 0; i < 6; i++) {
            codigo += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const encontrado = await pedidosDB.findOne({ numeroOrden: `RES-${codigo}` });
        existe = !!encontrado;
    }

    return codigo;
}