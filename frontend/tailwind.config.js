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
  // hover: solo con mouse o trackpad. En el celular un toque deja el :hover
  // pegado hasta tocar otra cosa (el botón queda "marcado").
  future: { hoverOnlyWhenSupported: true },
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
        bosque: { DEFAULT: '#2A221B', claro: '#40352B', oscuro: '#1C1712', noche: '#161412' },
        // Grises con tinte de madera en vez del gris neutro (frío) de Tailwind:
        // los paneles claros son papel cálido (#F7F2EA) y un gris azulado desentona.
        // Los textos -500 en adelante cumplen contraste 4.5:1 sobre ese papel.
        neutral: {
          50: '#FAF7F2', 100: '#F1EBE2', 200: '#E4DACC', 300: '#D0C2B0',
          400: '#A3958A', 500: '#75675A', 600: '#5C5047', 700: '#463D35',
          800: '#302923', 900: '#211C18', 950: '#161412'
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'Arial', 'sans-serif'],
        display: ['"Josefin Sans"', '"Century Gothic"', 'Futura', 'sans-serif']
      }
    }
  }
};
