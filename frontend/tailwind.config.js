// Tailwind se compila a src/css/estilos.css (npm run css). Solo se generan las
// clases que aparecen en estos archivos: si una clase se arma por partes en JS
// (ej: `bg-${color}`), no se va a generar; escribila completa.
//
// Paleta "oscuro cálido": fondo casi negro con tinte café, texto hueso y
// acentos dorados.
//  - oro / tinta / carbon / hueso / papel: la parte pública (menú, inicio,
//    catálogo, pie), que va sobre fondo oscuro.
//  - madera / bosque: los paneles claros (carrito, reserva, perfil, admin…).
//    madera es un dorado más oscuro para que se lea sobre fondo claro.
module.exports = {
  content: ['./index.html', './src/sections/**/*.html', './src/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        oro: { DEFAULT: '#C9A063', claro: '#D9B87F', oscuro: '#87622B' },
        tinta: '#1A1712',
        carbon: { DEFAULT: '#1C1917', alto: '#25211D', bajo: '#161412' },
        hueso: '#F5F2EB',
        papel: '#F1E9DE',
        madera: { DEFAULT: '#8F6630', claro: '#A87B3C', oscuro: '#6E4E24' },
        bosque: { DEFAULT: '#2A221B', claro: '#40352B', oscuro: '#1C1712', noche: '#161412' }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'Arial', 'sans-serif'],
        display: ['"Josefin Sans"', '"Century Gothic"', 'Futura', 'sans-serif']
      }
    }
  }
};
