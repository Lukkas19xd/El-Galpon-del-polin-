// ============ NAVEGACIÓN CON RUTAS (#/productos, #/carrito, ...) ============
// Cada vista tiene su dirección: el botón Atrás funciona, al recargar se queda
// en la misma vista y se puede compartir un enlace directo (ej: #/productos?categoria=lena).

const RUTAS = {
  inicio: { titulo: 'Polines y Leña' },
  productos: { titulo: 'Catálogo', cargar: mostrarCatalogo },
  login: { titulo: 'Iniciar sesión' },
  registro: { titulo: 'Crear cuenta' },
  carrito: { titulo: 'Carrito', sesion: true, cargar: cargarCarrito },
  reservar: { titulo: 'Confirmar reserva', seccion: 'checkout', sesion: true, cargar: prepararCheckout },
  'mis-reservas': { titulo: 'Mis reservas', sesion: true, cargar: cargarMisReservas },
  perfil: { titulo: 'Mi perfil', sesion: true, cargar: cargarPerfilUsuario },
  admin: { titulo: 'Administrador', sesion: true, admin: true, cargar: cargarAdmin }
};

// A dónde volver después de iniciar sesión (si se pidió una vista protegida)
let destinoTrasLogin = null;

// Hasta que las vistas terminen de cargarse no hay nada que mostrar; app.js lo
// activa y muestra la ruta que haya en ese momento
let navegacionLista = false;

function irA(ruta) {
  const destino = `#/${ruta}`;
  if (window.location.hash === destino) {
    mostrarRutaActual();
  } else {
    window.location.hash = destino;
  }
}

function irDespuesDelLogin() {
  const destino = destinoTrasLogin || 'inicio';
  destinoTrasLogin = null;
  irA(destino);
}

function leerRuta() {
  const [nombre, consulta] = window.location.hash.replace(/^#\/?/, '').split('?');
  return { nombre: nombre || 'inicio', params: new URLSearchParams(consulta || '') };
}

function mostrarRutaActual() {
  if (!navegacionLista) return;
  const { nombre, params } = leerRuta();
  const ruta = RUTAS[nombre];

  if (!ruta) {
    irA('inicio');
    return;
  }

  if (ruta.sesion && !tokenActual) {
    destinoTrasLogin = window.location.hash.replace(/^#\//, '');
    document.getElementById('loginMotivo').textContent = 'Inicia sesión para continuar.';
    irA('login');
    return;
  }
  if (ruta.admin && usuarioActual?.rol !== 'administrador') {
    mostrarMensaje('No tienes permisos para entrar al panel de administrador', 'error');
    irA('inicio');
    return;
  }

  document.querySelectorAll('#main-content > section').forEach((seccion) => seccion.classList.add('hidden'));
  document.getElementById(`seccion-${ruta.seccion || nombre}`).classList.remove('hidden');
  document.title = `${ruta.titulo} | Agroforestal Monte Redondo`;

  marcarEnlaceActivo(nombre);
  cerrarMenu();
  window.scrollTo(0, 0);
  ruta.cargar?.(params);
}

function marcarEnlaceActivo(nombre) {
  document.querySelectorAll('.enlace-menu').forEach((enlace) => {
    const activo = enlace.dataset.ruta === nombre;
    enlace.classList.toggle('bg-white/15', activo);
    if (activo) {
      enlace.setAttribute('aria-current', 'page');
    } else {
      enlace.removeAttribute('aria-current');
    }
  });
}

// ============ MENÚ EN CELULAR ============
function alternarMenu() {
  const menu = document.getElementById('menuPrincipal');
  const abierto = menu.classList.contains('hidden');
  menu.classList.toggle('hidden', !abierto);
  menu.classList.toggle('flex', abierto);
  document.getElementById('btnMenu').setAttribute('aria-expanded', String(abierto));
}

function cerrarMenu() {
  const menu = document.getElementById('menuPrincipal');
  menu.classList.add('hidden');
  menu.classList.remove('flex');
  document.getElementById('btnMenu').setAttribute('aria-expanded', 'false');
}

window.addEventListener('hashchange', mostrarRutaActual);
