// ============ MI CUENTA: PERFIL Y RESERVAS ============

async function cargarPerfilUsuario() {
  try {
    const { usuario } = await api('/auth/perfil');
    document.getElementById('perfilNombre').value = usuario.nombre;
    document.getElementById('perfilEmail').value = usuario.email;
    document.getElementById('perfilTelefono').value = usuario.telefono || '';
    document.getElementById('perfilDireccion').value = usuario.direccion || '';
    document.getElementById('perfilCiudad').value = usuario.ciudad || '';
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function handleActualizarPerfil(event) {
  event.preventDefault();

  try {
    const { usuario } = await conBotonOcupado(event.submitter, 'Guardando…', () => api('/auth/perfil', {
      method: 'PUT',
      body: {
        nombre: document.getElementById('perfilNombre').value.trim(),
        telefono: document.getElementById('perfilTelefono').value.trim(),
        direccion: document.getElementById('perfilDireccion').value.trim(),
        ciudad: document.getElementById('perfilCiudad').value.trim()
      }
    }));
    usuarioActual = usuario;
    almacen.guardar('usuario', usuarioActual);
    actualizarMenuSesion();
    mostrarMensaje('Datos guardados', 'success');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function handleCambiarContrasena(event) {
  event.preventDefault();
  const contrasenanueva = document.getElementById('contrasenaNueva').value;
  const confirmacion = document.getElementById('contrasenaConfirmacion').value;

  if (contrasenanueva !== confirmacion) {
    mostrarMensaje('Las contraseñas nuevas no coinciden', 'error');
    return;
  }

  try {
    await conBotonOcupado(event.submitter, 'Cambiando…', () => api('/auth/cambiar-contrasena', {
      method: 'PUT',
      body: {
        contrasenaActual: document.getElementById('contrasenaActual').value,
        contrasenanueva,
        confirmacion
      }
    }));
    document.getElementById('formContrasena').reset();
    mostrarMensaje('Contraseña cambiada', 'success');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// ============ MIS RESERVAS ============
const tarjetaResumen = (titulo, valor) => `
  <div class="rounded-md bg-neutral-50 p-4 text-center shadow-sm">
    <p class="mb-1 text-sm font-semibold text-neutral-500">${titulo}</p>
    <p class="text-2xl font-bold text-bosque">${valor}</p>
  </div>`;

const tarjetaReserva = (pedido) => `
  <article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h3 class="font-bold text-bosque">${escaparHTML(pedido.numeroOrden)}</h3>
      ${etiquetaEstado(pedido.estado)}
    </div>
    <p class="mb-2 text-sm text-neutral-600">
      Retiro: <strong class="capitalize">${formatearFechaLarga(pedido.fechaRetiro)}</strong>
      · Reservada el ${formatearFecha(pedido.createdAt)}
    </p>
    <ul class="mb-2 ml-5 list-disc text-sm text-neutral-700">
      ${(pedido.items || []).map((item) => `
        <li>${escaparHTML(item.producto?.nombre || 'Producto')} × ${item.cantidad}</li>`).join('')}
    </ul>
    <p class="text-right font-bold text-madera">${monedaCLP.format(pedido.total)}</p>
  </article>`;

async function cargarMisReservas() {
  const resumen = document.getElementById('misReservasResumen');
  const lista = document.getElementById('misReservasLista');
  document.getElementById('busquedaCodigo').value = '';
  resumen.innerHTML = '';
  mostrarCargando(lista, 'Cargando tus reservas…');

  try {
    const { pedidos } = await api('/pedidos/mis-pedidos');
    const contar = (estados) => pedidos.filter((p) => estados.includes(p.estado)).length;
    const porRetirar = pedidos.filter((p) => ['pendiente', 'confirmado', 'listo'].includes(p.estado));

    resumen.innerHTML = [
      tarjetaResumen('Reservas', pedidos.length),
      tarjetaResumen('Por retirar', porRetirar.length),
      tarjetaResumen('Listas para retiro', contar(['listo'])),
      tarjetaResumen('Por pagar al retirar', monedaCLP.format(porRetirar.reduce((suma, p) => suma + p.total, 0)))
    ].join('');

    lista.innerHTML = pedidos.length
      ? pedidos.map(tarjetaReserva).join('')
      : `<div class="rounded-md bg-neutral-50 p-8 text-center text-neutral-500">
           <p class="mb-3">Todavía no tienes reservas.</p>
           <a href="#/productos" class="font-bold text-madera underline-offset-2 hover:underline">Ver productos</a>
         </div>`;
  } catch (error) {
    mostrarFalla(lista, error.message, 'cargarMisReservas()');
  }
}

async function buscarReservaPorCodigo() {
  const codigo = document.getElementById('busquedaCodigo').value.trim();
  if (!codigo) {
    cargarMisReservas();
    return;
  }

  const lista = document.getElementById('misReservasLista');
  mostrarCargando(lista, 'Buscando…');

  try {
    const { pedido } = await api(`/pedidos/buscar?codigo=${encodeURIComponent(codigo)}`);
    lista.innerHTML = `
      ${tarjetaReserva(pedido)}
      <button type="button" onclick="cargarMisReservas()" class="text-sm font-bold text-madera underline-offset-2 hover:underline">← Ver todas mis reservas</button>`;
  } catch (error) {
    lista.innerHTML = `
      <div class="rounded-md bg-neutral-50 p-6 text-center text-neutral-600">
        <p class="mb-2">${escaparHTML(error.message)}</p>
        <button type="button" onclick="cargarMisReservas()" class="text-sm font-bold text-madera underline-offset-2 hover:underline">Ver todas mis reservas</button>
      </div>`;
  }
}
