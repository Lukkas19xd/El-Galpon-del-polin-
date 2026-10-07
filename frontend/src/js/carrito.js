// ============ CARRITO Y RESERVA ============

const contarUnidades = (carrito) => (carrito?.items || []).reduce((suma, item) => suma + item.cantidad, 0);

// Con un número lo muestra; sin argumentos lo consulta a la API
async function actualizarContadorCarrito(cantidad) {
  const contador = document.getElementById('carritoContador');
  if (cantidad === undefined) {
    if (!tokenActual) {
      cantidad = 0;
    } else {
      try {
        cantidad = contarUnidades((await api('/carrito')).carrito);
      } catch {
        return;
      }
    }
  }
  contador.textContent = cantidad;
}

async function cargarCarrito() {
  const estado = document.getElementById('carritoEstado');
  const vacio = document.getElementById('carritoVacio');
  const contenido = document.getElementById('carritoContenido');
  vacio.classList.add('hidden');
  contenido.classList.add('hidden');
  mostrarCargando(estado, 'Cargando tu carrito…');

  try {
    const { carrito } = await api('/carrito');
    estado.innerHTML = '';
    actualizarContadorCarrito(contarUnidades(carrito));

    if (!carrito.items.length) {
      vacio.classList.remove('hidden');
      return;
    }

    document.getElementById('carritoItems').innerHTML = carrito.items.map((item) => {
      const producto = item.producto;
      const id = escaparHTML(producto._id);
      return `
        <li class="flex flex-wrap items-center gap-4 py-4">
          <div class="min-w-[12rem] flex-1">
            <p class="font-bold text-bosque">${escaparHTML(producto.nombre)}</p>
            <p class="text-sm text-neutral-500">${monedaCLP.format(item.precio)} / ${unidadDe(producto)}</p>
          </div>
          <div class="flex items-center gap-2">
            <label for="carrito-${id}" class="text-sm text-neutral-600">Cantidad</label>
            <input type="number" id="carrito-${id}" min="1" max="${producto.stock}" value="${item.cantidad}" inputmode="numeric"
                   class="w-20 rounded-md border border-neutral-300 px-2 py-1 text-center"
                   onchange="actualizarCantidadCarrito('${id}', this.value)">
          </div>
          <p class="w-28 text-right font-bold">${monedaCLP.format(item.cantidad * item.precio)}</p>
          <button type="button" onclick="eliminarDelCarrito('${id}', this)" aria-label="Quitar ${escaparHTML(producto.nombre)} del carrito"
                  class="rounded-md px-3 py-1 text-sm font-bold text-red-700 hover:bg-red-50">Quitar</button>
        </li>`;
    }).join('');
    document.getElementById('carritoTotal').textContent = monedaCLP.format(carrito.total);
    contenido.classList.remove('hidden');
  } catch (error) {
    mostrarFalla(estado, error.message, 'cargarCarrito()');
  }
}

async function actualizarCantidadCarrito(productoId, cantidad) {
  const valor = parseInt(cantidad, 10);
  if (!Number.isInteger(valor) || valor < 0) {
    mostrarMensaje('Ingresa una cantidad válida', 'error');
    cargarCarrito();
    return;
  }

  try {
    await api('/carrito/actualizar', { method: 'PUT', body: { productoId, cantidad: valor } });
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
  cargarCarrito();
}

async function eliminarDelCarrito(productoId, boton) {
  try {
    await conBotonOcupado(boton, 'Quitando…', () =>
      api(`/carrito/producto/${encodeURIComponent(productoId)}`, { method: 'DELETE' }));
    mostrarMensaje('Producto quitado del carrito', 'success');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
  cargarCarrito();
}

// ============ CONFIRMAR RESERVA ============
async function prepararCheckout() {
  ocultarError('checkoutError');
  configurarFechaRetiro();

  // Si la cuenta no tiene teléfono, se pide acá: el negocio lo necesita para avisar
  const sinTelefono = !usuarioActual?.telefono;
  document.getElementById('checkoutBloqueTelefono').classList.toggle('hidden', !sinTelefono);
  document.getElementById('checkoutTelefono').required = sinTelefono;

  const resumen = document.getElementById('resumenPedido');
  mostrarCargando(resumen);

  try {
    const { carrito } = await api('/carrito');
    if (!carrito.items.length) {
      mostrarMensaje('Tu carrito está vacío', 'warning');
      irA('carrito');
      return;
    }

    resumen.innerHTML = `
      <ul class="divide-y divide-neutral-200">
        ${carrito.items.map((item) => `
          <li class="flex justify-between gap-4 py-2 text-sm">
            <span>${escaparHTML(item.producto.nombre)} × ${item.cantidad}</span>
            <span class="font-semibold">${monedaCLP.format(item.cantidad * item.precio)}</span>
          </li>`).join('')}
        <li class="flex justify-between pt-4 text-lg font-bold text-madera">
          <span>Total</span><span>${monedaCLP.format(carrito.total)}</span>
        </li>
      </ul>
      <p class="mt-2 text-xs text-neutral-500">Se cobra el precio vigente al confirmar la reserva.</p>`;
  } catch (error) {
    mostrarFalla(resumen, error.message, 'prepararCheckout()');
  }
}

async function handleCompra(event) {
  event.preventDefault();
  ocultarError('checkoutError');

  const fechaRetiro = document.getElementById('checkoutFechaRetiro').value;
  const nota = document.getElementById('checkoutNota').value.trim();
  const telefono = document.getElementById('checkoutTelefono').value.trim();

  try {
    const data = await conBotonOcupado(event.submitter, 'Reservando…', async () => {
      if (!usuarioActual?.telefono && telefono) {
        const perfil = await api('/auth/perfil', { method: 'PUT', body: { telefono } });
        usuarioActual = perfil.usuario;
        almacen.guardar('usuario', usuarioActual);
      }
      return api('/pedidos', { method: 'POST', body: { fechaRetiro, nota } });
    });

    document.getElementById('formCheckout').reset();
    actualizarContadorCarrito(0);
    mostrarMensaje(`¡Reserva ${data.pedido.numeroOrden} creada! Te enviamos la confirmación por correo.`, 'success');
    irA('mis-reservas');
  } catch (error) {
    mostrarError('checkoutError', error.message);
  }
}
