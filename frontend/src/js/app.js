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
  mostrarMensaje('Sesión cerrada', 'success');
}

// ============ NAVEGACIÓN ============
function cambiarVista(vista) {
  // Ocultar todas las secciones
  document.querySelectorAll('main > section').forEach(section => {
    section.classList.remove('vista-activa');
    section.style.display = 'none';
  });

  // Mostrar la sección seleccionada
  const seccion = document.getElementById(`seccion-${vista}`);
  if (seccion) {
    seccion.classList.add('vista-activa');
    seccion.style.display = 'block';

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

function cambiarTab(tab) {
  document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(tab).style.display = 'block';
  event.target.classList.add('active');
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
  card.className = 'producto-card';
  card.innerHTML = `
    <div class="producto-header">
      <h3>${producto.nombre}</h3>
      <span class="producto-tipo">${producto.tipo === 'impregnado' ? 'Impregnado' : 'Estándar'}</span>
    </div>
    <div class="producto-body">
      <p class="producto-descripcion">${producto.descripcion.substring(0, 100)}...</p>
      <div class="producto-info">
        <span class="producto-precio">$${producto.precio.toFixed(2)}</span>
        <span class="producto-stock">Stock: ${producto.stock}</span>
      </div>
      <div class="producto-acciones">
        <input type="number" id="cantidad-${producto._id}" min="1" max="${producto.stock}" value="1">
        ${tokenActual ? `<button onclick="agregarAlCarrito('${producto._id}')">Agregar</button>` : `<button onclick="cambiarVista('login')">Comprar</button>`}
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
            <td>${item.producto.nombre}</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>
              <input type="number" min="1" value="${item.cantidad}" 
                onchange="actualizarCantidadCarrito('${item.producto._id}', this.value)">
            </td>
            <td>$${(item.cantidad * item.precio).toFixed(2)}</td>
            <td>
              <button class="btn-eliminar btn-pequeno" 
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

    let html = '<ul>';
    carrito.items.forEach(item => {
      html += `<li>${item.producto.nombre} (x${item.cantidad}): $${(item.cantidad * item.precio).toFixed(2)}</li>`;
    });
    html += `</ul><hr><p><strong>Total: $${carrito.total.toFixed(2)}</strong></p>`;

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
      html = '<table class="carrito-tabla"><thead><tr><th>Orden</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>';
      pedidos.forEach(pedido => {
        const fecha = new Date(pedido.createdAt).toLocaleDateString('es-CL');
        html += `<tr>
          <td>${pedido.numeroOrden}</td>
          <td>${monedaCLP.format(pedido.total)}</td>
          <td>${pedido.estado}</td>
          <td>${fecha}</td>
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

    const html = `
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3>Pedidos totales</h3>
          <p>${pedidos.length}</p>
        </div>
        <div class="dashboard-card">
          <h3>Total pagado</h3>
          <p>${monedaCLP.format(totales.total)}</p>
        </div>
        <div class="dashboard-card">
          <h3>Pendientes</h3>
          <p>${totales.pendiente || 0}</p>
        </div>
        <div class="dashboard-card">
          <h3>Entregados</h3>
          <p>${totales.entregado || 0}</p>
        </div>
        <div class="dashboard-card">
          <h3>Cancelados</h3>
          <p>${totales.cancelado || 0}</p>
        </div>
      </div>
    `;

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
      <div class="busqueda-reserva">
        <h3>Reserva encontrada</h3>
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
        <td>${producto.nombre}</td>
        <td>$${producto.precio.toFixed(2)}</td>
        <td>${producto.stock}</td>
        <td>${producto.tipo}</td>
        <td>
          <button class="btn-editar" onclick="editarProducto('${producto._id}')">Editar</button>
          <button class="btn-eliminar" onclick="eliminarProductoAdmin('${producto._id}')">Eliminar</button>
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
        <td>${pedido.numeroOrden}</td>
        <td>${pedido.usuario.nombre}</td>
        <td>${monedaCLP.format(pedido.total)}</td>
        <td>${pedido.estado}</td>
        <td>${fecha}</td>
        <td>
          <button class="btn-editar" onclick="abrirDetallesPedido('${pedido._id}')">Ver Detalles</button>
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
        <td>${usuario.nombre}</td>
        <td>${usuario.email}</td>
        <td>${usuario.rol}</td>
        <td>${usuario.activo ? 'Activo' : 'Inactivo'}</td>
        <td>
          <button class="btn-editar" onclick="editarUsuario('${usuario._id}')">Editar</button>
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
      <h3>Pedido: ${pedido.numeroOrden}</h3>
      <p><strong>Cliente:</strong> ${pedido.usuario.nombre}</p>
      <p><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
      <p><strong>Estado actual:</strong> ${pedido.estado}</p>
      <h4>Cambiar Estado:</h4>
      <select id="nuevoEstado">
        <option value="pendiente">Pendiente</option>
        <option value="confirmado">Confirmado</option>
        <option value="enviado">Enviado</option>
        <option value="entregado">Entregado</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <button class="btn-primario" onclick="actualizarEstadoPedido('${pedidoId}')">Actualizar</button>
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
  document.getElementById('modal').classList.add('show');
}

function cerrarModal() {
  document.getElementById('modal').classList.remove('show');
}

function mostrarMensaje(mensaje, tipo = 'info') {
  const mainContent = document.querySelector('.main-content');
  const div = document.createElement('div');
  div.className = `${tipo}-message`;
  div.textContent = mensaje;
  div.style.position = 'fixed';
  div.style.top = '80px';
  div.style.right = '20px';
  div.style.zIndex = '9999';
  div.style.padding = '1rem';
  div.style.borderRadius = '4px';
  div.style.maxWidth = '300px';
  mainContent.appendChild(div);

  setTimeout(() => div.remove(), 3000);
}

function mostrarError(elementId, mensaje) {
  const errorDiv = document.getElementById(elementId);
  errorDiv.textContent = mensaje;
  errorDiv.classList.add('show');
  setTimeout(() => errorDiv.classList.remove('show'), 3000);
}

// Cerrar modal al hacer clic afuera
window.onclick = function(event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    cerrarModal();
  }
};
