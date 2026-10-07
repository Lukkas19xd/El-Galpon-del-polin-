// ============ UTILIDADES COMPARTIDAS ============

// Todo texto que venga de la API o del usuario pasa por acá antes de ir a innerHTML:
// así un nombre como "<img onerror=...>" se muestra como texto y no se ejecuta.
const escaparHTML = (texto) => String(texto ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatearFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString('es-CL') : '—');
const formatearFechaLarga = (fecha) => (fecha
  ? new Date(fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  : '—');

// Fecha local en formato YYYY-MM-DD (toISOString usa UTC y puede correr el día)
const fechaISO = (fecha) => {
  const f = new Date(fecha);
  f.setMinutes(f.getMinutes() - f.getTimezoneOffset());
  return f.toISOString().slice(0, 10);
};

// "saco" para la leña, "unidad" para los polines
const unidadDe = (producto) => (producto?.tipo === 'lena' ? 'saco' : 'unidad');
const unidadPlural = (producto, cantidad) => {
  const unidad = unidadDe(producto);
  return cantidad === 1 ? unidad : (unidad === 'saco' ? 'sacos' : 'unidades');
};

const etiquetaEstado = (estado) => {
  const info = ESTADOS[estado];
  return `<span class="inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${info?.clase || 'bg-neutral-100 text-neutral-700'}">${escaparHTML(info?.nombre || estado)}</span>`;
};

// ============ LLAMADAS A LA API ============
// Envía la petición con el token, convierte la respuesta y lanza un Error con el
// mensaje de la API si algo falla. Si la sesión venció, la cierra.
async function api(ruta, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && tokenActual) headers.Authorization = `Bearer ${tokenActual}`;

  let response;
  try {
    response = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const sesionInvalida = response.status === 401 || (response.status === 403 && /desactivada/i.test(data.message || ''));
    if (sesionInvalida && auth && tokenActual) {
      cerrarSesion({ aviso: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
    }
    throw new Error(data.message || `Error del servidor (${response.status})`);
  }
  return data;
}

// ============ ESTADOS DE CARGA Y ERROR ============
function mostrarCargando(contenedor, texto = 'Cargando…') {
  contenedor.innerHTML = `
    <div class="flex items-center justify-center gap-3 py-10 text-neutral-500" role="status">
      <span class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-bosque" aria-hidden="true"></span>
      ${escaparHTML(texto)}
    </div>`;
}

// reintentar: texto de la llamada a repetir, ej: "cargarProductos()"
function mostrarFalla(contenedor, mensaje, reintentar) {
  contenedor.innerHTML = `
    <div class="rounded-md border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <p class="mb-3 font-semibold text-red-700">${escaparHTML(mensaje)}</p>
      ${reintentar ? `<button type="button" onclick="${reintentar}" class="rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">Reintentar</button>` : ''}
    </div>`;
}

// Desactiva el botón mientras corre la acción, para que no se envíe dos veces
async function conBotonOcupado(boton, textoOcupado, accion) {
  if (!boton) return accion();
  const textoOriginal = boton.innerHTML;
  boton.disabled = true;
  boton.textContent = textoOcupado;
  try {
    return await accion();
  } finally {
    boton.disabled = false;
    boton.innerHTML = textoOriginal;
  }
}

// ============ AVISOS ============
const ESTILOS_MENSAJE = {
  success: 'bg-green-50 text-green-800 border border-green-200',
  error: 'bg-red-50 text-red-800 border border-red-200',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200',
  info: 'bg-blue-50 text-blue-800 border border-blue-200'
};

function mostrarMensaje(mensaje, tipo = 'info') {
  const div = document.createElement('div');
  div.className = `rounded-md px-4 py-3 text-sm font-medium shadow-lg ${ESTILOS_MENSAJE[tipo] || ESTILOS_MENSAJE.info}`;
  div.textContent = mensaje;
  document.getElementById('avisos').appendChild(div);
  setTimeout(() => div.remove(), tipo === 'error' ? 6000 : 3500);
}

function mostrarError(elementId, mensaje) {
  const errorDiv = document.getElementById(elementId);
  errorDiv.textContent = mensaje;
  errorDiv.classList.remove('hidden');
}

function ocultarError(elementId) {
  document.getElementById(elementId)?.classList.add('hidden');
}

// ============ VENTANA MODAL ============
let focoAntesDelModal = null;

function abrirModal(html) {
  if (html !== undefined) document.getElementById('modalBody').innerHTML = html;
  focoAntesDelModal = document.activeElement;
  document.getElementById('modal').classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  // Lleva el foco al primer campo o botón del contenido
  const enfocable = document.querySelector('#modalBody input, #modalBody select, #modalBody textarea, #modalBody button')
    || document.querySelector('#modal button');
  enfocable?.focus();
}

function cerrarModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  focoAntesDelModal?.focus?.();
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !document.getElementById('modal').classList.contains('hidden')) {
    cerrarModal();
  }
});
