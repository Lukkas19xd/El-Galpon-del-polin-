// Cada vista vive en su propio archivo bajo src/sections/ y se inyecta
// en #main-content en orden antes de que app.js inicialice la página.
const SECCIONES = [
  'inicio',
  'login',
  'registro',
  'productos',
  'mis-reservas',
  'carrito',
  'checkout',
  'perfil',
  'admin'
];

async function cargarSecciones() {
  const main = document.getElementById('main-content');
  try {
    const htmls = await Promise.all(
      SECCIONES.map(async (nombre) => {
        const res = await fetch(`src/sections/${nombre}.html`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`No se encontró la vista ${nombre}`);
        return res.text();
      })
    );
    main.innerHTML = htmls.join('\n');
  } catch (error) {
    main.innerHTML = `
      <div class="rounded-2xl bg-white p-8 text-center shadow-2xl">
        <p class="mb-4 font-semibold text-red-700">No se pudo cargar la página. Revisa tu conexión.</p>
        <button type="button" onclick="location.reload()" class="rounded-md bg-madera px-6 py-2 font-bold text-white">Reintentar</button>
      </div>`;
    throw error;
  }
}

window.seccionesListas = cargarSecciones();
