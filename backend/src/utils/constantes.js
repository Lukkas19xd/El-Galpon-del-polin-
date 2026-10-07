// Valores válidos compartidos por validaciones, controladores y modelos.
// El frontend tiene sus propias copias (filtros y ESTADOS en app.js): si
// cambias algo acá, revisalo también allá.

export const TIPOS_PRODUCTO = ['impregnado', 'estandar', 'lena'];
export const CATEGORIAS_PRODUCTO = ['agricola', 'construccion', 'industrial', 'lena'];

// Estados de una reserva y a cuáles puede pasar cada uno
export const TRANSICIONES_ESTADO = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['listo', 'cancelado'],
  listo: ['retirado', 'cancelado'],
  retirado: [],
  cancelado: []
};

export const ESTADOS_PEDIDO = Object.keys(TRANSICIONES_ESTADO);

// Reservas que todavía apartan stock y esperan retiro
export const ESTADOS_ACTIVOS = ['pendiente', 'confirmado', 'listo'];
