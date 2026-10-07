// ============ SESIÓN: LOGIN, REGISTRO Y SALIDA ============

function guardarSesion(token, usuario) {
  tokenActual = token;
  usuarioActual = usuario;
  almacen.guardar('token', token);
  almacen.guardar('usuario', usuario);
}

// Muestra u oculta las opciones del menú según haya sesión y rol
function actualizarMenuSesion() {
  const conSesion = Boolean(tokenActual && usuarioActual);
  const esAdmin = conSesion && usuarioActual.rol === 'administrador';

  document.querySelectorAll('[data-solo]').forEach((elemento) => {
    const visible = {
      sesion: conSesion,
      visitante: !conSesion,
      admin: esAdmin
    }[elemento.dataset.solo];
    elemento.classList.toggle('hidden', !visible);
  });

  // textContent: el nombre lo escribe el usuario, nunca va como HTML
  document.getElementById('navNombreUsuario').textContent = conSesion ? `(${usuarioActual.nombre.split(' ')[0]})` : '';
}

// Confirma con el servidor que la sesión guardada sigue valiendo y trae el perfil completo
async function validarSesion() {
  if (!tokenActual) return;
  try {
    const data = await api('/auth/me');
    usuarioActual = data.usuario;
    almacen.guardar('usuario', usuarioActual);
    actualizarMenuSesion();
    actualizarContadorCarrito();
  } catch {
    // api() ya cerró la sesión si el token no sirve; si fue un problema de red, se mantiene
  }
}

async function handleLogin(event) {
  event.preventDefault();
  ocultarError('loginError');
  const boton = event.submitter;

  try {
    await conBotonOcupado(boton, 'Entrando…', async () => {
      const data = await api('/auth/login', {
        method: 'POST',
        auth: false,
        body: {
          email: document.getElementById('loginEmail').value.trim(),
          contrasena: document.getElementById('loginPassword').value
        }
      });
      guardarSesion(data.token, data.usuario);
      await validarSesion();
    });

    document.getElementById('formLogin').reset();
    mostrarMensaje(`¡Hola, ${usuarioActual.nombre}!`, 'success');
    irDespuesDelLogin();
  } catch (error) {
    mostrarError('loginError', error.message);
  }
}

async function handleRegistro(event) {
  event.preventDefault();
  ocultarError('regError');
  const contrasena = document.getElementById('regPassword').value;

  if (contrasena !== document.getElementById('regConfirm').value) {
    mostrarError('regError', 'Las contraseñas no coinciden.');
    return;
  }

  try {
    await conBotonOcupado(event.submitter, 'Creando cuenta…', async () => {
      const data = await api('/auth/registro', {
        method: 'POST',
        auth: false,
        body: {
          nombre: document.getElementById('regNombre').value.trim(),
          email: document.getElementById('regEmail').value.trim(),
          telefono: document.getElementById('regTelefono').value.trim(),
          contrasena,
          confirmacion: contrasena
        }
      });
      guardarSesion(data.token, data.usuario);
      await validarSesion();
    });

    document.getElementById('formRegistro').reset();
    mostrarMensaje('¡Cuenta creada! Ya puedes reservar.', 'success');
    irDespuesDelLogin();
  } catch (error) {
    mostrarError('regError', error.message);
  }
}

function cerrarSesion({ aviso = 'Sesión cerrada' } = {}) {
  // Varias peticiones pueden fallar juntas al vencer la sesión: se cierra una sola vez
  if (!tokenActual && !usuarioActual) return;
  tokenActual = null;
  usuarioActual = null;
  almacen.borrar('token');
  almacen.borrar('usuario');
  actualizarMenuSesion();
  actualizarContadorCarrito(0);
  mostrarMensaje(aviso, aviso === 'Sesión cerrada' ? 'success' : 'warning');
  irA('inicio');
}
