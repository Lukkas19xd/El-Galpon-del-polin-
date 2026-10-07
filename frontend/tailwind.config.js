// Tailwind se compila a src/css/estilos.css (npm run css). Solo se generan las
// clases que aparecen en estos archivos: si una clase se arma por partes en JS
// (ej: `bg-${color}`), no se va a generar; escribila completa.
module.exports = {
  content: ['./index.html', './src/sections/**/*.html', './src/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        madera: { DEFAULT: '#8B5A3C', claro: '#A0644E', oscuro: '#6B4226' },
        bosque: { DEFAULT: '#2D5F3F', claro: '#3A7A4F', oscuro: '#163D27', noche: '#0F2A1B' }
      }
    }
  }
};
