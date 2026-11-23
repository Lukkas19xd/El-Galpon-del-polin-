// ============ INICIO DE LA PÁGINA ============
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.seccionesListas;
  } catch {
    return; // cargarSecciones ya mostró el error con un botón para reintentar
  }

  actualizarMenuSesion();
  cargarNegocio();
  // La entrada en abanico de la portada se ve una sola vez: al volver al
  // inicio (algo frecuente) las tarjetas ya están en su lugar
  const abanico = document.querySelector('.entrada-abanico');
  abanico?.lastElementChild.addEventListener('animationend', () => abanico.classList.remove('entrada-abanico'), { once: true });

  navegacionLista = true;
  mostrarRutaActual();

  if (tokenActual) {
    await validarSesion();
  }
});
