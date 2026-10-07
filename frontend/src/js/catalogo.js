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
        <div class="col-span-full rounded-md bg-neutral-50 p-8 text-center text-neutral-500">
          <p class="mb-3">No encontramos productos con esos filtros.</p>
          <a href="#/productos" class="font-bold text-madera underline-offset-2 hover:underline">Ver todo el catálogo</a>
        </div>`;
      return;
    }
    grid.innerHTML = productos.map(crearTarjetaProducto).join('');
  } catch (error) {
    if (consulta !== consultaCatalogo) return;
    mostrarFalla(grid, error.message, 'cargarProductos()');
  }
}

function imagenProducto(producto) {
  if (producto.imagen) {
    return `<img src="${escaparHTML(producto.imagen)}" alt="${escaparHTML(producto.nombre)}" loading="lazy" class="h-44 w-full object-cover">`;
  }
  // Sin foto: un fondo con un ícono según el tipo de producto
  return `
    <div class="flex h-44 items-center justify-center bg-gradient-to-br from-bosque to-bosque-claro text-6xl" aria-hidden="true">
      ${producto.tipo === 'lena' ? '🪵' : '🌲'}
    </div>`;
}

function disponibilidad(producto) {
  if (producto.stock <= 0) return '<span class="font-semibold text-red-700">Agotado</span>';
  const cantidad = `${producto.stock} ${unidadPlural(producto, producto.stock)}`;
  if (producto.stock <= 10) return `<span class="font-semibold text-amber-700">¡Quedan ${cantidad}!</span>`;
  return `<span class="text-neutral-500">${cantidad} disponibles</span>`;
}

function crearTarjetaProducto(producto) {
  const id = escaparHTML(producto._id);
  const descripcion = producto.descripcion || '';
  const agotado = producto.stock <= 0;

  let accion;
  if (agotado) {
    accion = '<button type="button" disabled class="w-full cursor-not-allowed rounded-md bg-neutral-300 px-3 py-2 font-bold text-neutral-600">Sin stock</button>';
  } else if (tokenActual) {
    accion = `
      <div class="flex gap-2">
        <label for="cantidad-${id}" class="sr-only">Cantidad de ${escaparHTML(producto.nombre)}</label>
        <input type="number" id="cantidad-${id}" min="1" max="${producto.stock}" value="1" inputmode="numeric"
               class="w-20 rounded-md border border-neutral-300 px-2 py-2 text-center">
        <button type="button" onclick="agregarAlCarrito('${id}', this)"
                class="flex-1 rounded-md bg-bosque px-3 py-2 font-bold text-white hover:bg-bosque-claro disabled:cursor-wait disabled:opacity-60">Agregar al carrito</button>
      </div>`;
  } else {
    accion = `<a href="#/login" onclick="destinoTrasLogin = 'productos'" class="block rounded-md bg-bosque px-3 py-2 text-center font-bold text-white hover:bg-bosque-claro">Inicia sesión para reservar</a>`;
  }

  return `
    <article class="flex flex-col overflow-hidden rounded-lg bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      ${imagenProducto(producto)}
      <div class="flex flex-1 flex-col p-4">
        <span class="mb-2 self-start rounded-full bg-madera/10 px-3 py-1 text-xs font-bold text-madera">${escaparHTML(NOMBRES_TIPO[producto.tipo] || producto.tipo)}</span>
        <h3 class="mb-2 text-lg font-bold text-bosque">${escaparHTML(producto.nombre)}</h3>
        <p class="mb-4 flex-1 text-sm text-neutral-600">${escaparHTML(descripcion.length > 140 ? `${descripcion.slice(0, 140)}…` : descripcion)}</p>
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-y border-neutral-100 py-3">
          <p><span class="text-xl font-bold text-madera">${monedaCLP.format(producto.precio)}</span>
             <span class="text-sm text-neutral-500">/ ${unidadDe(producto)}</span></p>
          <p class="text-sm">${disponibilidad(producto)}</p>
        </div>
        ${accion}
      </div>
    </article>`;
}

async function agregarAlCarrito(productoId, boton) {
  if (!tokenActual) {
    irA('login');
    return;
  }

  const cantidad = parseInt(document.getElementById(`cantidad-${productoId}`).value, 10);
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
