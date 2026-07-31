export function generarCodigoPedido() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let sufijo = '';
    for (let i = 0; i < 6; i++) {
        sufijo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PED-${sufijo}`;
}