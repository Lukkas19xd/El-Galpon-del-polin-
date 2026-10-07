// Datos del negocio que se muestran en la página (ubicación, horario, WhatsApp)
// y en los correos. Es la única fuente: el frontend los pide a GET /api/negocio.
//
// PROVISORIO: dirección, horario y WhatsApp son de relleno hasta tener los
// reales. Después de editar, reiniciá el backend.

export const negocio = {
  nombre: 'Agroforestal Monte Redondo SPA',

  // Dirección del galpón donde se retiran los pedidos.
  direccion: 'Dirección por confirmar',
  comuna: 'Comuna por confirmar',

  // Lo que se busca en Google Maps para el mapa y el enlace "Cómo llegar".
  // Puede ser la dirección o coordenadas ("-36.123,-72.456"). Vacío = no se muestra mapa.
  ubicacionMaps: '',

  // Número de WhatsApp con código de país y sin '+' ni espacios, ej: '56912345678'.
  // Vacío = no se muestra el botón de WhatsApp.
  whatsapp: '',

  // Horario de atención tal como se muestra en la página.
  horario: [
    { dias: 'Lunes a viernes', horas: '08:30 – 18:00' },
    { dias: 'Sábado', horas: '09:00 – 13:00' },
    { dias: 'Domingo y festivos', horas: 'Cerrado' }
  ],

  // Días en que se puede elegir retirar (0 = domingo, 1 = lunes ... 6 = sábado).
  diasRetiro: [1, 2, 3, 4, 5, 6],

  // Hasta cuántos días hacia adelante se puede reservar.
  anticipacionMaximaDias: 30,

  // Máximo de reservas sin retirar que puede tener un cliente a la vez,
  // para que una sola cuenta no aparte todo el stock.
  maxReservasActivasPorCliente: 5
};
