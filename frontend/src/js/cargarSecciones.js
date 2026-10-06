// Cada vista vive en su propio archivo bajo src/sections/ y se inyecta
// en #main-content en orden antes de que app.js inicialice la página.
const SECCIONES = [
  'inicio',
  'login',
  'registro',
  'productos',
  'dashboard',
  'mis-reservas',
  'carrito',
  'checkout',
  'perfil',
  'admin'
];

async function cargarSecciones() {
  const main = document.getElementById('main-content');
  const htmls = await Promise.all(
    SECCIONES.map((nombre) => fetch(`src/sections/${nombre}.html`).then((res) => res.text()))
  );
  main.innerHTML = htmls.join('\n');
}

window.seccionesListas = cargarSecciones();
