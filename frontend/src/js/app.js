// ============ CONFIGURACIÓN ============
const API_URL = 'http://localhost:3000/api';
let tokenActual = localStorage.getItem('token');
let usuarioActual = JSON.parse(localStorage.getItem('usuario')) || null;
let carritoLocal = JSON.parse(localStorage.getItem('carrito')) || [];

const monedaCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP'
});

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', async () => {
  await window.seccionesListas;
  actualizarEstadoAutenticacion();
  renderNavUser();
  cargarProductos();
  if (tokenActual) {
    await validarSesion();
  }
});

// ============ GESTIÓN DE SESIÓN ============
function actualizarEstadoAutenticacion() {
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');
  const menuPerfil = document.getElementById('menuPerfil');
  const menuAdmin = document.getElementById('menuAdmin');
  const menuDashboard = document.getElementById('menuDashboard');
  const menuMisReservas = document.getElementById('menuMisReservas');

  if (tokenActual && usuarioActual) {
    btnLogin.style.display = 'inline-block';
    btnLogin.innerHTML = `<span>Hola, ${usuarioActual.nombre}</span>`;
    btnLogout.style.display = 'inline-block';
    menuPerfil.style.display = 'inline-block';
    menuDashboard.style.display = 'inline-block';
    menuMisReservas.style.display = 'inline-block';
    if (usuarioActual.rol === 'administrador') {
      menuAdmin.style.display = 'inline-block';
    } else {
      menuAdmin.style.display = 'none';
    }
  } else {
    btnLogin.style.display = 'inline-block';
    btnLogin.innerHTML = `<a href="#" onclick="cambiarVista('login')" class="btn-login">Iniciar Sesión</a>`;
    btnLogout.style.display = 'none';
    menuPerfil.style.display = 'none';
    menuAdmin.style.display = 'none';
    menuDashboard.style.display = 'none';
    menuMisReservas.style.display = 'none';
  }
}

function renderNavUser() {
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');
  const menuPerfil = document.getElementById('menuPerfil');
  const menuDashboard = document.getElementById('menuDashboard');
  const menuMisReservas = document.getElementById('menuMisReservas');

  if (tokenActual && usuarioActual) {
    btnLogin.innerHTML = `<span>Hola, ${usuarioActual.nombre}</span>`;
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'inline-block';
    menuPerfil.style.display = 'inline-block';
    menuDashboard.style.display = 'inline-block';
    menuMisReservas.style.display = 'inline-block';
    if (usuarioActual.rol !== 'administrador') {
      document.getElementById('menuAdmin').style.display = 'none';
    }
  } else {
    btnLogin.innerHTML = `<a href="#" onclick="cambiarVista('login')" class="btn-login">Iniciar Sesión</a>`;
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    menuPerfil.style.display = 'none';
    menuDashboard.style.display = 'none';
    menuMisReservas.style.display = 'none';
    document.getElementById('menuAdmin').style.display = 'none';
  }
}

async function validarSesion() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    if (!response.ok) {
      cerrarSesion();
      return;
    }
    const data = await response.json();
    usuarioActual = data.usuario;
    localStorage.setItem('usuario', JSON.stringify(usuarioActual));
    actualizarEstadoAutenticacion();
    renderNavUser();
    cargarContadorCarritoLocal();
  } catch (error) {
    cerrarSesion();
  }
}

function guardarCarritoLocal(carrito) {
  const items = carrito.items?.map(item => ({
    producto: item.producto,
    cantidad: item.cantidad,
    precio: item.precio
  })) || [];
  localStorage.setItem('carrito', JSON.stringify(items));
}

function cargarContadorCarritoLocal() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const total = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  document.getElementById('carritoContador').textContent = total;
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  tokenActual = null;
  usuarioActual = null;
  actualizarEstadoAutenticacion();
  renderNavUser();
  cambiarVista('inicio');
  cargarProductos();
  mostrarMensaje('Sesión cerrada', 'success');
}

// ============ NAVEGACIÓN ============
function cambiarVista(vista) {
  // Ocultar todas las secciones
  document.querySelectorAll('#main-content > section').forEach(section => {
    section.classList.add('hidden');
  });

  // Mostrar la sección seleccionada
  const seccion = document.getElementById(`seccion-${vista}`);
  if (seccion) {
    seccion.classList.remove('hidden');

    // Cargar contenido específico
    if (vista === 'admin') {
      if (!tokenActual || usuarioActual.rol !== 'administrador') {
        mostrarMensaje('No tienes permisos para acceder al panel de administrador', 'error');
        cambiarVista('inicio');
        return;
      }
      cargarProductosAdmin();
      cargarPedidosAdmin();
      cargarUsuarios();
    } else if (vista === 'carrito') {
      if (!tokenActual) {
        mostrarMensaje('Debes iniciar sesión para ver el carrito', 'error');
        cambiarVista('login');
        return;
      }
      cargarCarrito();
    } else if (vista === 'checkout') {
      if (!tokenActual) {
        mostrarMensaje('Debes iniciar sesión para completar la compra', 'error');
        cambiarVista('login');
        return;
      }
      cargarResumenPedido();
    } else if (vista === 'perfil') {
      if (!tokenActual) {
        mostrarMensaje('Debes iniciar sesión', 'error');
        cambiarVista('login');
        return;
      }
      cargarPerfilUsuario();
    } else if (vista === 'dashboard') {
      if (!tokenActual) {
        mostrarMensaje('Debes iniciar sesión para ver el dashboard', 'error');
        cambiarVista('login');
        return;
      }
      cargarDashboard();
    } else if (vista === 'mis-reservas') {
      if (!tokenActual) {
        mostrarMensaje('Debes iniciar sesión para ver tus reservas', 'error');
        cambiarVista('login');
        return;
      }
      cargarMisPedidos();
    }
  }
}

const TAB_ACTIVO = ['border-madera', 'text-madera'];
const TAB_INACTIVO = ['border-transparent', 'text-neutral-600', 'hover:bg-neutral-100'];

function cambiarTab(tab) {
  document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(el => {
    el.classList.remove(...TAB_ACTIVO);
    el.classList.add(...TAB_INACTIVO);
  });

  document.getElementById(tab).classList.remove('hidden');
  event.target.classList.remove(...TAB_INACTIVO);
  event.target.classList.add(...TAB_ACTIVO);
}

// ============ AUTENTICACIÓN ============
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const contrasena = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contrasena })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en el login');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    tokenActual = data.token;
    usuarioActual = data.usuario;

    actualizarEstadoAutenticacion();
    renderNavUser();
    document.getElementById('formLogin').reset();
    mostrarMensaje('Login exitoso', 'success');
    cambiarVista('inicio');
    cargarProductos();
  } catch (error) {
    mostrarError('loginError', error.message);
  }
}

async function handleRegistro(event) {
  event.preventDefault();
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const contrasena = document.getElementById('regPassword').value;
  const confirmacion = document.getElementById('regConfirm').value;

  try {
    const response = await fetch(`${API_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, contrasena, confirmacion })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en el registro');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    tokenActual = data.token;
    usuarioActual = data.usuario;

    actualizarEstadoAutenticacion();
    renderNavUser();
    document.getElementById('formRegistro').reset();
    mostrarMensaje('Registro exitoso', 'success');
    cambiarVista('inicio');
    cargarProductos();
  } catch (error) {
    mostrarError('regError', error.message);
  }
}

// ============ PRODUCTOS ============
async function cargarProductos() {
  try {
    const tipo = document.getElementById('filtroTipo').value;
    const categoria = document.getElementById('filtroCategoria').value;
    let url = `${API_URL}/productos?limite=100`;
    if (tipo) url += `&tipo=${tipo}`;
    if (categoria) url += `&categoria=${categoria}`;

    const response = await fetch(url);
    const data = await response.json();

    const grid = document.getElementById('productosGrid');
    grid.innerHTML = '';

    if (data.productos && data.productos.length > 0) {
      data.productos.forEach(producto => {
        const card = crearTarjetaProducto(producto);
        grid.appendChild(card);
      });
    } else {
      grid.innerHTML = '<p>No hay productos disponibles</p>';
    }
  } catch (error) {
    console.error('Error cargando productos:', error);
  }
}

function crearTarjetaProducto(producto) {
  const card = document.createElement('div');
  card.className = 'overflow-hidden rounded-lg border-l-4 border-madera bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl';
  card.innerHTML = `
    <div class="bg-gradient-to-br from-bosque to-bosque-claro p-4 text-white">
      <h3 class="text-lg font-bold">${producto.nombre}</h3>
      <span class="mt-2 inline-block rounded-full bg-madera px-3 py-1 text-xs">${producto.tipo === 'impregnado' ? 'Impregnado' : 'Estándar'}</span>
    </div>
    <div class="p-4">
      <p class="mb-4 text-sm text-neutral-600">${producto.descripcion.substring(0, 100)}...</p>
      <div class="mb-4 flex items-center justify-between border-y border-neutral-100 py-3">
        <span class="text-xl font-bold text-madera">$${producto.precio.toFixed(2)}</span>
        <span class="text-sm text-neutral-500">Stock: ${producto.stock}</span>
      </div>
      <div class="flex gap-2">
        <input type="number" id="cantidad-${producto._id}" min="1" max="${producto.stock}" value="1" class="w-16 rounded-md border border-neutral-300 px-2 py-2 text-center">
        ${tokenActual
          ? `<button class="flex-1 rounded-md bg-bosque px-2 py-2 font-bold text-white hover:bg-bosque-claro" onclick="agregarAlCarrito('${producto._id}')">Agregar</button>`
          : `<button class="flex-1 rounded-md bg-bosque px-2 py-2 font-bold text-white hover:bg-bosque-claro" onclick="cambiarVista('login')">Comprar</button>`}
      </div>
    </div>
  `;
  return card;
}

function aplicarFiltros() {
  cargarProductos();
}

async function agregarAlCarrito(productoId) {
  if (!tokenActual) {
    cambiarVista('login');
    return;
  }

  try {
    const cantidad = parseInt(document.getElementById(`cantidad-${productoId}`).value);
    if (cantidad < 1) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    const response = await fetch(`${API_URL}/carrito/agregar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ productoId, cantidad })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al agregar al carrito');
    }

    cargarCarrito();
    mostrarMensaje('Producto agregado al carrito', 'success');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// ============ CARRITO ============
async function cargarCarrito() {
  if (!tokenActual) return;

  try {
    const response = await fetch(`${API_URL}/carrito`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const carrito = data.carrito;
    carritoLocal = carrito.items.map(item => ({
      producto: item.producto,
      cantidad: item.cantidad,
      precio: item.precio
    }));
    localStorage.setItem('carrito', JSON.stringify(carritoLocal));

    const carritoVacio = document.getElementById('carritoVacio');
    const carritoContenido = document.getElementById('carritoContenido');

    if (!carrito.items || carrito.items.length === 0) {
      carritoVacio.style.display = 'block';
      carritoContenido.style.display = 'none';
    } else {
      carritoVacio.style.display = 'none';
      carritoContenido.style.display = 'block';

      let html = '';
      carrito.items.forEach(item => {
        html += `
          <tr>
            <td class="p-4">${item.producto.nombre}</td>
            <td class="p-4">$${item.precio.toFixed(2)}</td>
            <td class="p-4">
              <input type="number" min="1" value="${item.cantidad}" class="w-20 rounded-md border border-neutral-300 px-2 py-1"
                onchange="actualizarCantidadCarrito('${item.producto._id}', this.value)">
            </td>
            <td class="p-4">$${(item.cantidad * item.precio).toFixed(2)}</td>
            <td class="p-4">
              <button class="rounded-md bg-red-600 px-3 py-1 text-sm font-bold text-white hover:opacity-80"
                onclick="eliminarDelCarrito('${item.producto._id}')">Eliminar</button>
            </td>
          </tr>
        `;
      });

      document.getElementById('carritoItems').innerHTML = html;
      document.getElementById('carritoTotal').textContent = carrito.total.toFixed(2);
      actualizarContadorCarrito(carrito);
    }
  } catch (error) {
    console.error('Error cargando carrito:', error);
  }
}

async function actualizarCantidadCarrito(productoId, cantidad) {
  if (!tokenActual) return;

  try {
    const response = await fetch(`${API_URL}/carrito/actualizar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ productoId, cantidad: parseInt(cantidad) })
    });

    if (!response.ok) {
      throw new Error('Error al actualizar carrito');
    }

    cargarCarrito();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function eliminarDelCarrito(productoId) {
  if (!tokenActual) return;

  try {
    const response = await fetch(`${API_URL}/carrito/producto/${productoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar del carrito');
    }

    cargarCarrito();
    mostrarMensaje('Producto eliminado del carrito', 'success');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

function actualizarContadorCarrito(carrito) {
  const total = carrito.items.reduce((sum, item) => sum + item.cantidad, 0);
  document.getElementById('carritoContador').textContent = total;
}

// ============ CHECKOUT ============
async function cargarResumenPedido() {
  if (!tokenActual) return;

  try {
    const response = await fetch(`${API_URL}/carrito`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const carrito = data.carrito;
    carritoLocal = carrito.items.map(item => ({
      producto: item.producto,
      cantidad: item.cantidad,
      precio: item.precio
    }));
    localStorage.setItem('carrito', JSON.stringify(carritoLocal));

    let html = '<ul class="divide-y divide-neutral-200">';
    carrito.items.forEach(item => {
      html += `<li class="py-2 text-sm">${item.producto.nombre} (x${item.cantidad}): $${(item.cantidad * item.precio).toFixed(2)}</li>`;
    });
    html += `<li class="pt-4 text-lg font-bold text-madera">Total: $${carrito.total.toFixed(2)}</li></ul>`;

    document.getElementById('resumenPedido').innerHTML = html;
  } catch (error) {
    console.error('Error cargando resumen:', error);
  }
}

async function handleCompra(event) {
  event.preventDefault();

  if (!tokenActual) {
    cambiarVista('login');
    return;
  }

  try {
    const calle = document.getElementById('checkoutCalle').value;
    const numero = document.getElementById('checkoutNumero').value;
    const ciudad = document.getElementById('checkoutCiudad').value;
    const codigoPostal = document.getElementById('checkoutCP').value;
    const metodoPago = document.querySelector('input[name="metodoPago"]:checked').value;

    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({
        metodoPago,
        direccionEntrega: {
          calle,
          numero,
          ciudad,
          codigoPostal
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al crear el pedido');
    }

    mostrarMensaje(`Pedido creado exitosamente: ${data.pedido.numeroOrden}`, 'success');
    document.getElementById('formCheckout').reset();
    cambiarVista('perfil');
  } catch (error) {
    mostrarError('checkoutError', error.message);
  }
}

// ============ PERFIL DE USUARIO ============
async function cargarPerfilUsuario() {
  if (!tokenActual) return;

  try {
    const response = await fetch(`${API_URL}/auth/perfil`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const usuario = data.usuario;

    document.getElementById('perfilNombre').value = usuario.nombre;
    document.getElementById('perfilEmail').value = usuario.email;
    document.getElementById('perfilTelefono').value = usuario.telefono || '';
    document.getElementById('perfilDireccion').value = usuario.direccion || '';
    document.getElementById('perfilCiudad').value = usuario.ciudad || '';

    cargarMisPedidos();
  } catch (error) {
    console.error('Error cargando perfil:', error);
  }
}

async function handleActualizarPerfil(event) {
  event.preventDefault();

  if (!tokenActual) return;

  try {
    const nombre = document.getElementById('perfilNombre').value;
    const telefono = document.getElementById('perfilTelefono').value;
    const direccion = document.getElementById('perfilDireccion').value;
    const ciudad = document.getElementById('perfilCiudad').value;

    const response = await fetch(`${API_URL}/auth/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ nombre, telefono, direccion, ciudad })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar perfil');
    }

    mostrarMensaje('Perfil actualizado exitosamente', 'success');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function cargarMisPedidos() {
  if (!tokenActual) return;

  try {
    const response = await fetch(`${API_URL}/pedidos/mis-pedidos`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const pedidos = data.pedidos || [];

    let html = '';
    if (pedidos.length === 0) {
      html = '<p>No tienes pedidos realizados</p>';
    } else {
      html = `<table class="w-full border-collapse">
        <thead><tr class="bg-neutral-100 text-left text-sm font-bold text-neutral-700">
          <th class="p-4">Orden</th><th class="p-4">Total</th><th class="p-4">Estado</th><th class="p-4">Fecha</th>
        </tr></thead>
        <tbody class="divide-y divide-neutral-100">`;
      pedidos.forEach(pedido => {
        const fecha = new Date(pedido.createdAt).toLocaleDateString('es-CL');
        html += `<tr>
          <td class="p-4">${pedido.numeroOrden}</td>
          <td class="p-4">${monedaCLP.format(pedido.total)}</td>
          <td class="p-4">${pedido.estado}</td>
          <td class="p-4">${fecha}</td>
        </tr>`;
      });
      html += '</tbody></table>';
    }

    document.getElementById('misPedidos').innerHTML = html;
  } catch (error) {
    console.error('Error cargando pedidos:', error);
  }
}

async function cargarDashboard() {
  if (!tokenActual) return;

  try {
    const response = await fetch(`${API_URL}/pedidos/mis-pedidos`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const pedidos = data.pedidos || [];
    const totales = pedidos.reduce((acc, pedido) => {
      acc.total += pedido.total;
      acc[pedido.estado] = (acc[pedido.estado] || 0) + 1;
      return acc;
    }, { total: 0 });

    const tarjeta = (titulo, valor) => `
      <div class="rounded-md bg-white p-6 text-center shadow">
        <h3 class="mb-2 text-sm font-semibold text-neutral-500">${titulo}</h3>
        <p class="text-2xl font-bold text-bosque">${valor}</p>
      </div>
    `;

    const html = [
      tarjeta('Pedidos totales', pedidos.length),
      tarjeta('Total pagado', monedaCLP.format(totales.total)),
      tarjeta('Pendientes', totales.pendiente || 0),
      tarjeta('Entregados', totales.entregado || 0),
      tarjeta('Cancelados', totales.cancelado || 0)
    ].join('');

    document.getElementById('dashboardStats').innerHTML = html;
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

async function buscarReservaPorCodigo() {
  if (!tokenActual) {
    cambiarVista('login');
    return;
  }

  const codigo = document.getElementById('busquedaCodigo').value.trim();
  if (!codigo) {
    mostrarMensaje('Ingresa un código de reserva para buscar', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/pedidos/buscar?codigo=${encodeURIComponent(codigo)}`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Reserva no encontrada');
    }

    const pedido = data.pedido;
    const fecha = new Date(pedido.createdAt).toLocaleDateString('es-CL');
    const resultado = `
      <div class="space-y-2 rounded-md bg-white p-6 shadow">
        <h3 class="mb-2 text-lg font-bold text-bosque">Reserva encontrada</h3>
        <p><strong>Código:</strong> ${pedido.numeroOrden}</p>
        <p><strong>Total:</strong> ${monedaCLP.format(pedido.total)}</p>
        <p><strong>Estado:</strong> ${pedido.estado}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Cliente:</strong> ${pedido.usuario.nombre}</p>
      </div>
    `;

    document.getElementById('misReservasResultados').innerHTML = resultado;
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// ============ PANEL DE ADMINISTRADOR ============
async function cargarProductosAdmin() {
  if (!tokenActual || usuarioActual.rol !== 'administrador') return;

  try {
    const response = await fetch(`${API_URL}/productos?limite=100`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const productos = data.productos || [];

    let html = '';
    productos.forEach(producto => {
      html += `<tr>
        <td class="p-4">${producto.nombre}</td>
        <td class="p-4">$${producto.precio.toFixed(2)}</td>
        <td class="p-4">${producto.stock}</td>
        <td class="p-4">${producto.tipo}</td>
        <td class="p-4 space-x-2">
          <button class="rounded-md bg-blue-600 px-3 py-1 text-sm font-bold text-white hover:opacity-80" onclick="editarProducto('${producto._id}')">Editar</button>
          <button class="rounded-md bg-red-600 px-3 py-1 text-sm font-bold text-white hover:opacity-80" onclick="eliminarProductoAdmin('${producto._id}')">Eliminar</button>
        </td>
      </tr>`;
    });

    document.getElementById('adminProductosTable').innerHTML = html;
  } catch (error) {
    console.error('Error cargando productos admin:', error);
  }
}

function mostrarFormNuevoProducto() {
  document.getElementById('formNuevoProducto').style.display = 'block';
}

function cancelarFormProducto() {
  document.getElementById('formNuevoProducto').style.display = 'none';
}

async function handleNuevoProducto(event) {
  event.preventDefault();

  if (!tokenActual || usuarioActual.rol !== 'administrador') return;

  try {
    const nombre = document.getElementById('adminProdNombre').value;
    const descripcion = document.getElementById('adminProdDesc').value;
    const precio = parseFloat(document.getElementById('adminProdPrecio').value);
    const stock = parseInt(document.getElementById('adminProdStock').value);
    const tipo = document.getElementById('adminProdTipo').value;

    const response = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ nombre, descripcion, precio, stock, tipo, categoria: 'industrial' })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al crear producto');
    }

    mostrarMensaje('Producto creado exitosamente', 'success');
    document.getElementById('formNuevoProducto').reset();
    cancelarFormProducto();
    cargarProductosAdmin();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function eliminarProductoAdmin(productoId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

  if (!tokenActual || usuarioActual.rol !== 'administrador') return;

  try {
    const response = await fetch(`${API_URL}/productos/${productoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar producto');
    }

    mostrarMensaje('Producto eliminado exitosamente', 'success');
    cargarProductosAdmin();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function cargarPedidosAdmin() {
  if (!tokenActual || usuarioActual.rol !== 'administrador') return;

  try {
    const response = await fetch(`${API_URL}/pedidos`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const pedidos = data.pedidos || [];

    let html = '';
    pedidos.forEach(pedido => {
      const fecha = new Date(pedido.createdAt).toLocaleDateString('es-CL');
      html += `<tr>
        <td class="p-4">${pedido.numeroOrden}</td>
        <td class="p-4">${pedido.usuario.nombre}</td>
        <td class="p-4">${monedaCLP.format(pedido.total)}</td>
        <td class="p-4">${pedido.estado}</td>
        <td class="p-4">${fecha}</td>
        <td class="p-4">
          <button class="rounded-md bg-blue-600 px-3 py-1 text-sm font-bold text-white hover:opacity-80" onclick="abrirDetallesPedido('${pedido._id}')">Ver Detalles</button>
        </td>
      </tr>`;
    });

    document.getElementById('adminPedidosTable').innerHTML = html;
  } catch (error) {
    console.error('Error cargando pedidos admin:', error);
  }
}

async function cargarUsuarios() {
  if (!tokenActual || usuarioActual.rol !== 'administrador') return;

  try {
    const response = await fetch(`${API_URL}/auth/usuarios`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const usuarios = data.usuarios || [];

    let html = '';
    usuarios.forEach(usuario => {
      html += `<tr>
        <td class="p-4">${usuario.nombre}</td>
        <td class="p-4">${usuario.email}</td>
        <td class="p-4">${usuario.rol}</td>
        <td class="p-4">${usuario.activo ? 'Activo' : 'Inactivo'}</td>
        <td class="p-4">
          <button class="rounded-md bg-blue-600 px-3 py-1 text-sm font-bold text-white hover:opacity-80" onclick="editarUsuario('${usuario._id}')">Editar</button>
        </td>
      </tr>`;
    });

    document.getElementById('adminUsuariosTable').innerHTML = html;
  } catch (error) {
    console.error('Error cargando usuarios admin:', error);
  }
}

async function abrirDetallesPedido(pedidoId) {
  if (!tokenActual) return;

  try {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    const data = await response.json();
    const pedido = data.pedido;

    let html = `
      <h3 class="mb-3 text-lg font-bold text-bosque">Pedido: ${pedido.numeroOrden}</h3>
      <p class="mb-1"><strong>Cliente:</strong> ${pedido.usuario.nombre}</p>
      <p class="mb-1"><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
      <p class="mb-4"><strong>Estado actual:</strong> ${pedido.estado}</p>
      <h4 class="mb-2 font-semibold text-neutral-700">Cambiar Estado:</h4>
      <select id="nuevoEstado" class="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2">
        <option value="pendiente">Pendiente</option>
        <option value="confirmado">Confirmado</option>
        <option value="enviado">Enviado</option>
        <option value="entregado">Entregado</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <button class="w-full rounded-md bg-madera px-6 py-3 font-bold text-white shadow hover:bg-madera-claro" onclick="actualizarEstadoPedido('${pedidoId}')">Actualizar</button>
    `;

    document.getElementById('modalBody').innerHTML = html;
    abrirModal();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function actualizarEstadoPedido(pedidoId) {
  if (!tokenActual) return;

  try {
    const nuevoEstado = document.getElementById('nuevoEstado').value;
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!response.ok) {
      throw new Error('Error al actualizar estado');
    }

    mostrarMensaje('Estado del pedido actualizado', 'success');
    cerrarModal();
    cargarPedidosAdmin();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// ============ UTILIDADES ============
function abrirModal() {
  document.getElementById('modal').classList.remove('hidden');
}

function cerrarModal() {
  document.getElementById('modal').classList.add('hidden');
}

const ESTILOS_MENSAJE = {
  success: 'bg-green-50 text-green-700 border border-green-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200'
};

function mostrarMensaje(mensaje, tipo = 'info') {
  const div = document.createElement('div');
  div.className = `fixed top-20 right-5 z-[200] max-w-xs rounded-md px-4 py-3 text-sm font-medium shadow-lg ${ESTILOS_MENSAJE[tipo] || ESTILOS_MENSAJE.info}`;
  div.textContent = mensaje;
  document.body.appendChild(div);

  setTimeout(() => div.remove(), 3000);
}

function mostrarError(elementId, mensaje) {
  const errorDiv = document.getElementById(elementId);
  errorDiv.textContent = mensaje;
  errorDiv.classList.remove('hidden');
  setTimeout(() => errorDiv.classList.add('hidden'), 3000);
}

// Cerrar modal al hacer clic afuera
window.onclick = function(event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    cerrarModal();
  }
};
