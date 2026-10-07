// ============ PANEL DE ADMINISTRADOR ============

const TAB_ACTIVO = ['border-madera', 'text-madera'];
const TAB_INACTIVO = ['border-transparent', 'text-neutral-600', 'hover:bg-neutral-100'];

// Lo último que se cargó, para abrir los formularios de edición sin volver a pedirlo
let productosAdmin = new Map();
let usuariosAdmin = new Map();

function cargarAdmin() {
  cargarRetirosAdmin();
  cargarProductosAdmin();
  cargarPedidosAdmin();
  cargarUsuarios();
}

function cambiarTab(tab, boton) {
  document.querySelectorAll('.admin-tab-content').forEach((panel) => panel.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach((otro) => {
    otro.classList.remove(...TAB_ACTIVO);
    otro.classList.add(...TAB_INACTIVO);
    otro.setAttribute('aria-selected', 'false');
  });

  document.getElementById(tab).classList.remove('hidden');
  boton.classList.remove(...TAB_INACTIVO);
  boton.classList.add(...TAB_ACTIVO);
  boton.setAttribute('aria-selected', 'true');
}

const botonTabla = (texto, onclick, color = 'bg-bosque') =>
  `<button type="button" onclick="${onclick}" class="rounded-md ${color} px-3 py-1 text-sm font-bold text-white hover:opacity-80">${texto}</button>`;

const celdaVacia = (columnas, texto) =>
  `<tr><td colspan="${columnas}" class="p-6 text-center text-neutral-500">${texto}</td></tr>`;

const filaFalla = (columnas, mensaje, reintentar) => `
  <tr><td colspan="${columnas}" class="p-6 text-center">
    <span class="font-semibold text-red-700">${escaparHTML(mensaje)}</span>
    <button type="button" onclick="${reintentar}" class="ml-3 font-bold text-madera underline">Reintentar</button>
  </td></tr>`;

// ============ PRODUCTOS ============
async function cargarProductosAdmin() {
  const tabla = document.getElementById('adminProductosTable');
  tabla.innerHTML = celdaVacia(6, 'Cargando…');

  try {
    const { productos } = await api('/productos/admin/todos');
    productosAdmin = new Map(productos.map((p) => [p._id, p]));

    tabla.innerHTML = productos.length ? productos.map((producto) => {
      const id = escaparHTML(producto._id);
      return `
        <tr class="${producto.activo ? '' : 'bg-neutral-50 text-neutral-400'}">
          <td class="p-3 font-semibold">${escaparHTML(producto.nombre)}</td>
          <td class="p-3">${monedaCLP.format(producto.precio)}</td>
          <td class="p-3 ${producto.stock <= 10 ? 'font-bold text-amber-700' : ''}">${producto.stock}</td>
          <td class="p-3">${escaparHTML(NOMBRES_CATEGORIA[producto.categoria] || producto.categoria)}</td>
          <td class="p-3">${producto.activo ? 'Visible' : 'Oculto'}</td>
          <td class="space-x-1 whitespace-nowrap p-3 text-right">
            ${botonTabla('Editar', `abrirFormProducto('${id}')`, 'bg-blue-600')}
            ${producto.activo
              ? botonTabla('Ocultar', `cambiarVisibilidadProducto('${id}', false)`, 'bg-neutral-600')
              : botonTabla('Mostrar', `cambiarVisibilidadProducto('${id}', true)`)}
          </td>
        </tr>`;
    }).join('') : celdaVacia(6, 'No hay productos.');
  } catch (error) {
    tabla.innerHTML = filaFalla(6, error.message, 'cargarProductosAdmin()');
  }
}

const opciones = (valores, seleccionado) => Object.entries(valores)
  .map(([valor, texto]) => `<option value="${valor}" ${valor === seleccionado ? 'selected' : ''}>${texto}</option>`)
  .join('');

// Mismo formulario para crear (sin id) y para editar
function abrirFormProducto(productoId) {
  const producto = productoId ? productosAdmin.get(productoId) : null;
  const valor = (campo) => escaparHTML(producto?.[campo] ?? '');
  const campoClase = 'w-full rounded-md border border-neutral-300 px-3 py-2';

  abrirModal(`
    <h3 id="modalTitulo" class="mb-4 text-lg font-bold text-bosque">${producto ? 'Editar producto' : 'Nuevo producto'}</h3>
    <form onsubmit="guardarProducto(event, ${producto ? `'${escaparHTML(producto._id)}'` : 'null'})" class="space-y-4">
      <div>
        <label for="prodNombre" class="mb-1 block text-sm font-semibold">Nombre</label>
        <input id="prodNombre" required maxlength="150" value="${valor('nombre')}" class="${campoClase}">
      </div>
      <div>
        <label for="prodDescripcion" class="mb-1 block text-sm font-semibold">Descripción</label>
        <textarea id="prodDescripcion" rows="3" maxlength="2000" class="${campoClase}">${valor('descripcion')}</textarea>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="prodPrecio" class="mb-1 block text-sm font-semibold">Precio (CLP)</label>
          <input id="prodPrecio" type="number" required min="0" step="1" value="${valor('precio')}" class="${campoClase}">
        </div>
        <div>
          <label for="prodStock" class="mb-1 block text-sm font-semibold">Stock</label>
          <input id="prodStock" type="number" required min="0" step="1" value="${valor('stock')}" class="${campoClase}">
        </div>
        <div>
          <label for="prodTipo" class="mb-1 block text-sm font-semibold">Tipo</label>
          <select id="prodTipo" class="${campoClase}">${opciones(NOMBRES_TIPO, producto?.tipo)}</select>
        </div>
        <div>
          <label for="prodCategoria" class="mb-1 block text-sm font-semibold">Categoría</label>
          <select id="prodCategoria" class="${campoClase}">${opciones(NOMBRES_CATEGORIA, producto?.categoria)}</select>
        </div>
      </div>
      <div>
        <label for="prodImagen" class="mb-1 block text-sm font-semibold">Foto (opcional)</label>
        <input id="prodImagen" value="${valor('imagen')}" placeholder="https://… o src/img/productos/lena.jpg" class="${campoClase}">
        <p class="mt-1 text-xs text-neutral-500">Dirección de una imagen en internet (https) o un archivo dentro de frontend/src/img/.</p>
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input id="prodActivo" type="checkbox" ${producto?.activo === false ? '' : 'checked'}>
        Visible en el catálogo
      </label>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" onclick="cerrarModal()" class="rounded-md px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100">Cancelar</button>
        <button type="submit" class="rounded-md bg-madera px-6 py-2 font-bold text-white shadow hover:bg-madera-claro disabled:opacity-60">Guardar</button>
      </div>
    </form>`);
}

async function guardarProducto(event, productoId) {
  event.preventDefault();
  const datos = {
    nombre: document.getElementById('prodNombre').value.trim(),
    descripcion: document.getElementById('prodDescripcion').value.trim(),
    precio: Number(document.getElementById('prodPrecio').value),
    stock: Number(document.getElementById('prodStock').value),
    tipo: document.getElementById('prodTipo').value,
    categoria: document.getElementById('prodCategoria').value,
    imagen: document.getElementById('prodImagen').value.trim(),
    activo: document.getElementById('prodActivo').checked
  };

  try {
    await conBotonOcupado(event.submitter, 'Guardando…', () => (productoId
      ? api(`/productos/${productoId}`, { method: 'PUT', body: datos })
      : api('/productos', { method: 'POST', body: datos })));
    cerrarModal();
    mostrarMensaje(productoId ? 'Producto actualizado' : 'Producto creado', 'success');
    cargarProductosAdmin();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// Ocultar no borra el producto: puede estar en reservas antiguas
async function cambiarVisibilidadProducto(productoId, activo) {
  try {
    await api(`/productos/${productoId}`, { method: 'PUT', body: { activo } });
    mostrarMensaje(activo ? 'El producto vuelve a aparecer en el catálogo' : 'Producto oculto del catálogo', 'success');
    cargarProductosAdmin();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// ============ RESERVAS ============
async function cargarPedidosAdmin() {
  const tabla = document.getElementById('adminPedidosTable');
  tabla.innerHTML = celdaVacia(7, 'Cargando…');

  try {
    const { pedidos } = await api('/pedidos?limite=100');
    tabla.innerHTML = pedidos.length ? pedidos.map((pedido) => `
      <tr>
        <td class="p-3 font-semibold">${escaparHTML(pedido.numeroOrden)}</td>
        <td class="p-3">${escaparHTML(pedido.usuario?.nombre)}</td>
        <td class="p-3">${monedaCLP.format(pedido.total)}</td>
        <td class="p-3">${etiquetaEstado(pedido.estado)}</td>
        <td class="p-3">${formatearFecha(pedido.createdAt)}</td>
        <td class="p-3">${formatearFecha(pedido.fechaRetiro)}</td>
        <td class="p-3 text-right">${botonTabla('Ver', `abrirDetallesPedido('${escaparHTML(pedido._id)}')`, 'bg-blue-600')}</td>
      </tr>`).join('') : celdaVacia(7, 'Todavía no hay reservas.');
  } catch (error) {
    tabla.innerHTML = filaFalla(7, error.message, 'cargarPedidosAdmin()');
  }
}

const resumenItems = (pedido) => (pedido.items || []).map((item) =>
  `<li>${escaparHTML(item.producto?.nombre || 'Producto')} × ${item.cantidad}</li>`).join('');

const botonesEstado = (pedido) => (ESTADOS[pedido.estado]?.siguientes || []).map((estado) => `
  <button type="button" class="rounded-md px-3 py-2 text-sm font-bold text-white shadow hover:opacity-90 disabled:opacity-60 ${estado === 'cancelado' ? 'bg-red-600' : 'bg-bosque'}"
          onclick="cambiarEstadoReserva('${escaparHTML(pedido._id)}', '${estado}', this)">${ACCIONES_ESTADO[estado]}</button>`).join('');

const contactoCliente = (usuario) => {
  const telefono = usuario?.telefono
    ? `<a class="text-bosque underline" href="tel:${escaparHTML(usuario.telefono.replace(/[^0-9+]/g, ''))}">${escaparHTML(usuario.telefono)}</a>`
    : 'sin teléfono';
  return `${telefono} · ${escaparHTML(usuario?.email)}`;
};

async function abrirDetallesPedido(pedidoId) {
  try {
    const { pedido } = await api(`/pedidos/${pedidoId}`);
    const botones = botonesEstado(pedido);

    abrirModal(`
      <h3 id="modalTitulo" class="mb-3 text-lg font-bold text-bosque">Reserva ${escaparHTML(pedido.numeroOrden)}</h3>
      <p class="mb-1"><strong>Cliente:</strong> ${escaparHTML(pedido.usuario?.nombre)}</p>
      <p class="mb-1"><strong>Contacto:</strong> ${contactoCliente(pedido.usuario)}</p>
      <p class="mb-1"><strong>Retiro:</strong> <span class="capitalize">${formatearFechaLarga(pedido.fechaRetiro)}</span></p>
      <p class="mb-1"><strong>Total:</strong> ${monedaCLP.format(pedido.total)}</p>
      ${pedido.nota ? `<p class="mb-1"><strong>Nota:</strong> ${escaparHTML(pedido.nota)}</p>` : ''}
      <ul class="mb-3 ml-5 list-disc text-sm text-neutral-700">${resumenItems(pedido)}</ul>
      <p class="mb-4"><strong>Estado:</strong> ${etiquetaEstado(pedido.estado)}</p>
      ${botones
        ? `<div class="flex flex-wrap gap-2">${botones}</div>`
        : '<p class="text-sm text-neutral-500">Esta reserva ya está cerrada.</p>'}`);
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function cambiarEstadoReserva(pedidoId, estado, boton) {
  if (estado === 'cancelado' && !confirm('¿Cancelar esta reserva? El stock vuelve a quedar disponible.')) return;

  try {
    await conBotonOcupado(boton, 'Guardando…', () =>
      api(`/pedidos/${pedidoId}/estado`, { method: 'PUT', body: { estado } }));
    const aviso = estado === 'listo' ? ' Se avisó al cliente por correo.' : '';
    mostrarMensaje(`Reserva marcada como "${ESTADOS[estado].nombre}".${aviso}`, 'success');
    cerrarModal();
    cargarRetirosAdmin();
    cargarPedidosAdmin();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// ============ RETIROS ============
async function cargarRetirosAdmin() {
  const contenedor = document.getElementById('adminRetiros');
  mostrarCargando(contenedor);

  try {
    const { pedidos } = await api('/pedidos/retiros');
    if (pedidos.length === 0) {
      contenedor.innerHTML = '<p class="text-neutral-500">No hay reservas pendientes de retiro.</p>';
      return;
    }

    // Agrupar por día de retiro; los días pasados van todos juntos como "atrasados".
    // Vienen ordenados por fecha, así que el orden de inserción ya es el correcto.
    const hoy = fechaISO(new Date());
    const manana = fechaISO(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const grupos = new Map();
    pedidos.forEach((pedido) => {
      const dia = fechaISO(pedido.fechaRetiro);
      const clave = dia < hoy ? 'atrasados' : dia;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(pedido);
    });

    const tituloGrupo = (clave, cantidad) => {
      const total = `<span class="ml-2 text-sm font-normal text-neutral-500">(${cantidad})</span>`;
      const fechaLarga = (dia) => formatearFechaLarga(`${dia}T12:00:00`);
      if (clave === 'atrasados') return `<h4 class="font-bold text-red-700">⚠️ Atrasadas: no se retiraron en su fecha ${total}</h4>`;
      if (clave === hoy) return `<h4 class="font-bold text-bosque">Hoy · ${fechaLarga(clave)} ${total}</h4>`;
      if (clave === manana) return `<h4 class="font-bold text-bosque">Mañana · ${fechaLarga(clave)} ${total}</h4>`;
      return `<h4 class="font-bold capitalize text-neutral-700">${fechaLarga(clave)} ${total}</h4>`;
    };

    const tarjeta = (pedido) => `
      <div class="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div class="min-w-0 space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="font-bold text-bosque underline-offset-2 hover:underline" onclick="abrirDetallesPedido('${escaparHTML(pedido._id)}')">${escaparHTML(pedido.numeroOrden)}</button>
            ${etiquetaEstado(pedido.estado)}
            <span class="text-xs text-neutral-500">Retiro: ${formatearFecha(pedido.fechaRetiro)}</span>
          </div>
          <p class="text-sm"><strong>${escaparHTML(pedido.usuario?.nombre)}</strong> · ${contactoCliente(pedido.usuario)}</p>
          <ul class="ml-5 list-disc text-sm text-neutral-600">${resumenItems(pedido)}</ul>
          ${pedido.nota ? `<p class="text-sm italic text-neutral-500">“${escaparHTML(pedido.nota)}”</p>` : ''}
        </div>
        <div class="space-y-2 text-right">
          <p class="text-lg font-bold text-madera">${monedaCLP.format(pedido.total)}</p>
          <div class="flex flex-wrap justify-end gap-2">${botonesEstado(pedido)}</div>
        </div>
      </div>`;

    contenedor.innerHTML = [...grupos].map(([clave, lista]) => `
      <div class="space-y-3">
        ${tituloGrupo(clave, lista.length)}
        ${lista.map(tarjeta).join('')}
      </div>`).join('');
  } catch (error) {
    mostrarFalla(contenedor, error.message, 'cargarRetirosAdmin()');
  }
}

// ============ USUARIOS ============
async function cargarUsuarios() {
  const tabla = document.getElementById('adminUsuariosTable');
  tabla.innerHTML = celdaVacia(6, 'Cargando…');

  try {
    const { usuarios } = await api('/auth/usuarios');
    usuariosAdmin = new Map(usuarios.map((u) => [u._id, u]));

    tabla.innerHTML = usuarios.map((usuario) => `
      <tr class="${usuario.activo ? '' : 'bg-neutral-50 text-neutral-400'}">
        <td class="p-3 font-semibold">${escaparHTML(usuario.nombre)}</td>
        <td class="p-3">${escaparHTML(usuario.email)}</td>
        <td class="p-3">${escaparHTML(usuario.telefono || '—')}</td>
        <td class="p-3">${usuario.rol === 'administrador' ? 'Administrador' : 'Cliente'}</td>
        <td class="p-3">${usuario.activo ? 'Activo' : 'Desactivado'}</td>
        <td class="p-3 text-right">${botonTabla('Editar', `abrirFormUsuario('${escaparHTML(usuario._id)}')`, 'bg-blue-600')}</td>
      </tr>`).join('');
  } catch (error) {
    tabla.innerHTML = filaFalla(6, error.message, 'cargarUsuarios()');
  }
}

function abrirFormUsuario(usuarioId) {
  const usuario = usuariosAdmin.get(usuarioId);
  if (!usuario) return;
  const esUnoMismo = usuario._id === usuarioActual?._id || usuario._id === usuarioActual?.id;

  abrirModal(`
    <h3 id="modalTitulo" class="mb-1 text-lg font-bold text-bosque">${escaparHTML(usuario.nombre)}</h3>
    <p class="mb-4 text-sm text-neutral-500">${escaparHTML(usuario.email)}</p>
    <form onsubmit="guardarUsuario(event, '${escaparHTML(usuario._id)}')" class="space-y-4">
      <div>
        <label for="usuarioRol" class="mb-1 block text-sm font-semibold">Rol</label>
        <select id="usuarioRol" ${esUnoMismo ? 'disabled' : ''} class="w-full rounded-md border border-neutral-300 px-3 py-2">
          ${opciones({ cliente: 'Cliente', administrador: 'Administrador' }, usuario.rol)}
        </select>
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input id="usuarioActivo" type="checkbox" ${usuario.activo ? 'checked' : ''} ${esUnoMismo ? 'disabled' : ''}>
        Cuenta activa (si la desactivas, pierde el acceso al instante)
      </label>
      ${esUnoMismo ? '<p class="text-sm text-amber-700">Es tu propia cuenta: no puedes quitarte el acceso.</p>' : ''}
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" onclick="cerrarModal()" class="rounded-md px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100">Cancelar</button>
        <button type="submit" ${esUnoMismo ? 'disabled' : ''} class="rounded-md bg-madera px-6 py-2 font-bold text-white shadow hover:bg-madera-claro disabled:opacity-60">Guardar</button>
      </div>
    </form>`);
}

async function guardarUsuario(event, usuarioId) {
  event.preventDefault();
  try {
    await conBotonOcupado(event.submitter, 'Guardando…', () => api(`/auth/usuarios/${usuarioId}`, {
      method: 'PUT',
      body: {
        rol: document.getElementById('usuarioRol').value,
        activo: document.getElementById('usuarioActivo').checked
      }
    }));
    cerrarModal();
    mostrarMensaje('Usuario actualizado', 'success');
    cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}
