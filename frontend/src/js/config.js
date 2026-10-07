// ============ CONFIGURACIÓN Y ESTADO GLOBAL ============
// Los scripts de src/js/ se cargan en orden desde index.html y comparten estas
// variables globales (no son módulos porque los onclick del HTML llaman funciones globales).

// En desarrollo el frontend corre aparte (puerto 8000) y la API en el 3000;
// en producción el backend sirve las dos cosas desde el mismo dominio.
const API_URL = window.location.port === '8000'
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`;

// Al publicar un cambio grande, actualizar esta fecha: cada navegador borra lo
// que tenía guardado de la página (sesión, usuario, carrito) la próxima vez que
// la abra, para no arrastrar datos de la versión anterior.
// Debe coincidir con el ?v= de los <script> y el CSS en index.html.
const VERSION_DATOS = '2026-10-08';

const almacen = {
  leer(clave) {
    try { return JSON.parse(localStorage.getItem(clave)); } catch { return null; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* almacenamiento bloqueado */ }
  },
  borrar(clave) {
    try { localStorage.removeItem(clave); } catch { /* almacenamiento bloqueado */ }
  }
};

try {
  if (localStorage.getItem('versionDatos') !== VERSION_DATOS) {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('versionDatos', VERSION_DATOS);
  }
} catch {
  // Navegación privada o almacenamiento bloqueado: no hay nada que limpiar
}

let tokenActual = almacen.leer('token');
let usuarioActual = almacen.leer('usuario');

// Datos del negocio (ubicación, horario, WhatsApp, días de retiro) desde GET /api/negocio
let negocioInfo = null;

// ============ CONSTANTES ============
const monedaCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

const NOMBRES_TIPO = { impregnado: 'Impregnado', estandar: 'Estándar', lena: 'Leña' };
const NOMBRES_CATEGORIA = { agricola: 'Agrícola', construccion: 'Construcción', industrial: 'Industrial', lena: 'Leña en saco' };

const DIAS_PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

// Estados de una reserva: nombre, color y a cuáles puede pasar (igual que TRANSICIONES_ESTADO en el backend)
const ESTADOS = {
  pendiente: { nombre: 'Pendiente', clase: 'bg-amber-100 text-amber-800', siguientes: ['confirmado', 'cancelado'] },
  confirmado: { nombre: 'Confirmada', clase: 'bg-blue-100 text-blue-800', siguientes: ['listo', 'cancelado'] },
  listo: { nombre: 'Lista para retiro', clase: 'bg-green-100 text-green-800', siguientes: ['retirado', 'cancelado'] },
  retirado: { nombre: 'Retirada', clase: 'bg-neutral-200 text-neutral-700', siguientes: [] },
  cancelado: { nombre: 'Cancelada', clase: 'bg-red-100 text-red-700', siguientes: [] }
};

// Texto del botón que lleva a cada estado
const ACCIONES_ESTADO = {
  confirmado: 'Confirmar',
  listo: 'Marcar lista',
  retirado: 'Marcar retirada',
  cancelado: 'Cancelar'
};
