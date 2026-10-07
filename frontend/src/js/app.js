// ============ INICIO DE LA PÁGINA ============
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.seccionesListas;
  } catch {
    return; // cargarSecciones ya mostró el error con un botón para reintentar
  }

  actualizarMenuSesion();
  cargarNegocio();
  navegacionLista = true;
  mostrarRutaActual();

  if (tokenActual) {
    await validarSesion();
  }
});
