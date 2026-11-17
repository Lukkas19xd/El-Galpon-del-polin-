// ============ CATÁLOGO ============

// Pone los filtros según la dirección (#/productos?categoria=lena&q=...) y carga
function mostrarCatalogo(params) {
  document.getElementById('busquedaProducto').value = params.get('q') || '';
  document.getElementById('filtroTipo').value = params.get('tipo') || '';
  document.getElementById('filtroCategoria').value = params.get('categoria') || '';
  cargarProductos();
}

function leerFiltros() {
  const filtros = new URLSearchParams();
  const q = document.getElementById('busquedaProducto').value.trim();
  const tipo = document.getElementById('filtroTipo').value;
  const categoria = document.getElementById('filtroCategoria').value;
  if (q) filtros.set('q', q);
  if (tipo) filtros.set('tipo', tipo);
  if (categoria) filtros.set('categoria', categoria);
  return filtros;
}

// Guarda los filtros en la dirección sin crear una entrada nueva en el historial
// (el botón Atrás vuelve a la página anterior, no a cada letra escrita)
function aplicarFiltros() {
  const filtros = leerFiltros().toString();
  history.replaceState(null, '', `#/productos${filtros ? `?${filtros}` : ''}`);
  cargarProductos();
}

let pausaBusqueda;
function buscarConPausa() {
  clearTimeout(pausaBusqueda);
  pausaBusqueda = setTimeout(aplicarFiltros, 350);
}

// Si el usuario cambia los filtros mientras carga, solo se muestra la última respuesta
let consultaCatalogo = 0;

async function cargarProductos() {
  const grid = document.getElementById('productosGrid');
  const resumen = document.getElementById('productosResumen');
  const consulta = ++consultaCatalogo;
  const filtros = leerFiltros();
  filtros.set('limite', '100');

  mostrarCargando(grid, 'Cargando productos…');
  resumen.textContent = '';

  try {
    const data = await api(`/productos?${filtros}`, { auth: false });
    if (consulta !== consultaCatalogo) return;

    const productos = data.productos || [];
    resumen.textContent = productos.length === 1 ? '1 producto' : `${productos.length} productos`;

    if (productos.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full rounded-xl border border-white/[0.08] bg-carbon p-10 text-center text-white/60">
          <p class="mb-4">No encontramos productos con esos filtros.</p>
          <a href="#/productos" class="inline-block rounded-full bg-oro px-5 py-2 text-sm font-bold text-tinta hover:bg-oro-claro">Ver todo el catálogo</a>
        </div>`;
      return;
    }
    grid.innerHTML = productos.map((producto) => crearTarjetaProducto(producto, 'catalogo')).join('');
  } catch (error) {
    if (consulta !== consultaCatalogo) return;
    mostrarFalla(grid, error.message, 'cargarProductos()');
  }
}

// Ilustraciones para los productos sin foto (se dibujan sobre el fondo crema)
const ILUSTRACION_LENA = `
  <svg viewBox="0 0 120 120" class="h-32 w-32" aria-hidden="true">
    <ellipse cx="60" cy="108" rx="40" ry="5" fill="#000" opacity=".08"/>
    <g stroke="#6E4524" stroke-width="2.5" fill="#D4A96A"><circle cx="46" cy="36" r="9"/><circle cx="62" cy="30" r="9"/><circle cx="76" cy="38" r="9"/></g>
    <path d="M32 50 Q22 102 40 106 H80 Q98 102 88 50 Z" fill="#B98C55"/>
    <rect x="30" y="44" width="60" height="9" rx="4" fill="#6E4524"/>
  </svg>`;

const ILUSTRACION_POLINES = `
  <svg viewBox="0 0 120 120" class="h-32 w-32" aria-hidden="true">
    <ellipse cx="60" cy="106" rx="44" ry="5" fill="#000" opacity=".08"/>
    <rect x="24" y="24" width="18" height="82" rx="9" fill="#7E5230"/>
    <rect x="51" y="12" width="18" height="94" rx="9" fill="#9C6A3E"/>
    <rect x="78" y="30" width="18" height="76" rx="9" fill="#7E5230"/>
    <path d="M24 52h18M24 80h18M51 42h18M51 72h18M78 58h18M78 86h18" stroke="#3E2814" stroke-opacity=".3" stroke-width="2"/>
    <ellipse cx="33" cy="28" rx="7" ry="3" fill="#D8B27A"/><ellipse cx="60" cy="16" rx="7" ry="3" fill="#D8B27A"/><ellipse cx="87" cy="34" rx="7" ry="3" fill="#D8B27A"/>
  </svg>`;

function imagenProducto(producto) {
  if (producto.imagen) {
    return `<img src="${escaparHTML(producto.imagen)}" alt="${escaparHTML(producto.nombre)}" loading="lazy" class="h-full w-full object-cover">`;
  }
  return producto.tipo === 'lena' ? ILUSTRACION_LENA : ILUSTRACION_POLINES;
}

function disponibilidad(producto) {
  if (producto.stock <= 0) return '<span class="font-semibold text-red-400">Agotado</span>';
  const cantidad = `${producto.stock} ${unidadPlural(producto, producto.stock)}`;
  if (producto.stock <= 10) return `<span class="font-semibold text-amber-400">¡Quedan ${cantidad}!</span>`;
  return `<span class="text-white/50">${cantidad} disponibles</span>`;
}

// contexto: dónde se muestra la tarjeta ('catalogo' o 'inicio'). Las dos vistas
// están en la página a la vez, así que los id de los campos deben ser distintos.
function crearTarjetaProducto(producto, contexto = 'catalogo') {
  const id = escaparHTML(producto._id);
  const idCantidad = `cantidad-${contexto}-${id}`;
  const descripcion = producto.descripcion || '';
  const agotado = producto.stock <= 0;

  let accion;
  if (agotado) {
    accion = '<button type="button" disabled class="w-full cursor-not-allowed rounded-full bg-white/10 px-3 py-2.5 font-semibold text-white/50">Sin stock</button>';
  } else if (tokenActual) {
    accion = `
      <div class="flex gap-2">
        <label for="${idCantidad}" class="sr-only">Cantidad de ${escaparHTML(producto.nombre)}</label>
        <input type="number" id="${idCantidad}" min="1" max="${producto.stock}" value="1" inputmode="numeric"
               class="w-16 rounded-full border border-white/10 bg-carbon-bajo px-2 py-2 text-center text-hueso focus:border-oro/60 focus:outline-none">
        <button type="button" onclick="agregarAlCarrito('${id}', this)"
                class="flex-1 rounded-full bg-oro px-3 py-2 text-sm font-bold text-tinta hover:bg-oro-claro disabled:cursor-wait disabled:opacity-60">Agregar</button>
      </div>`;
  } else {
    accion = `<a href="#/login" onclick="destinoTrasLogin = 'productos'" class="block rounded-full border border-white/20 px-3 py-2.5 text-center text-sm font-semibold text-hueso hover:border-oro/60">Inicia sesión para reservar</a>`;
  }

  return `
    <article class="flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-carbon transition hover:-translate-y-1 hover:border-oro/40">
      <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-papel">
        ${imagenProducto(producto)}
        <span class="absolute left-3 top-3 rounded-full bg-oro px-3 py-1 text-xs font-bold text-tinta">${escaparHTML(NOMBRES_TIPO[producto.tipo] || producto.tipo)}</span>
      </div>
      <div class="flex flex-1 flex-col p-4">
        <p class="text-sm text-white/50">${escaparHTML(NOMBRES_CATEGORIA[producto.categoria] || producto.categoria || '')}</p>
        <h3 class="mt-1 text-lg font-semibold leading-snug text-hueso">${escaparHTML(producto.nombre)}</h3>
        <p class="mt-2 line-clamp-2 text-sm text-white/55" title="${escaparHTML(descripcion)}">${escaparHTML(descripcion)}</p>
        <div class="mb-4 mt-auto pt-4">
          <p><span class="text-2xl font-bold text-hueso">${monedaCLP.format(producto.precio)}</span>
             <span class="text-sm text-white/50">/ ${unidadDe(producto)}</span></p>
          <p class="mt-1 text-sm">${disponibilidad(producto)}</p>
        </div>
        ${accion}
      </div>
    </article>`;
}

// ============ DESTACADOS EN EL INICIO ============
async function cargarDestacados() {
  const carrusel = document.getElementById('destacadosCarrusel');
  mostrarCargando(carrusel, 'Cargando productos…');
  try {
    const data = await api('/productos?limite=12', { auth: false });
    const productos = data.productos || [];
    carrusel.innerHTML = productos.length
      ? productos.map((producto) => `
          <div class="w-[78%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">${crearTarjetaProducto(producto, 'inicio')}</div>`).join('')
      : '<p class="py-10 text-white/50">Pronto publicaremos nuestros productos.</p>';
  } catch (error) {
    mostrarFalla(carrusel, error.message, 'cargarDestacados()');
  }
}

// direccion: -1 (atrás) o 1 (adelante); avanza casi una pantalla del carrusel
function moverCarrusel(id, direccion) {
  const carrusel = document.getElementById(id);
  carrusel.scrollBy({ left: direccion * carrusel.clientWidth * 0.9, behavior: 'smooth' });
}

async function agregarAlCarrito(productoId, boton) {
  if (!tokenActual) {
    irA('login');
    return;
  }

  // La cantidad está en la misma tarjeta que el botón
  const campo = boton.closest('article').querySelector('input[type="number"]');
  const cantidad = parseInt(campo.value, 10);
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    mostrarMensaje('Ingresa una cantidad válida', 'error');
    return;
  }

  try {
    const data = await conBotonOcupado(boton, 'Agregando…', () =>
      api('/carrito/agregar', { method: 'POST', body: { productoId, cantidad } }));
    actualizarContadorCarrito(contarUnidades(data.carrito));
    mostrarMensaje('Agregado al carrito', 'success');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}
