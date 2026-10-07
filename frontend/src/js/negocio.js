// ============ DATOS DEL NEGOCIO ============
// Ubicación, horario, WhatsApp y reglas de retiro (backend/data/negocio.js)

async function cargarNegocio() {
  try {
    const data = await api('/negocio', { auth: false });
    negocioInfo = data.negocio;
    renderNegocio();
  } catch (error) {
    document.getElementById('negocioDireccion').textContent = 'No se pudo cargar la dirección. Recarga la página.';
  }
}

function mostrarEnlace(id, href) {
  const enlace = document.getElementById(id);
  enlace.href = href;
  enlace.classList.remove('hidden');
}

function renderNegocio() {
  const negocio = negocioInfo;
  if (!negocio) return;

  const direccion = `${negocio.direccion}, ${negocio.comuna}`;
  document.getElementById('negocioDireccion').textContent = direccion;
  document.getElementById('footerDireccion').textContent = `📍 ${direccion}`;
  document.getElementById('checkoutLugarRetiro').innerHTML = `<strong>Retiro en:</strong> ${escaparHTML(direccion)}`;
  document.getElementById('negocioHorario').innerHTML = negocio.horario.map(h => `
    <li class="flex justify-between gap-4 py-2">
      <span class="text-neutral-600">${escaparHTML(h.dias)}</span>
      <span class="font-semibold text-neutral-800">${escaparHTML(h.horas)}</span>
    </li>`).join('');

  if (negocio.ubicacionMaps) {
    const destino = encodeURIComponent(negocio.ubicacionMaps);
    const mapa = document.getElementById('negocioMapa');
    mapa.src = `https://www.google.com/maps?q=${destino}&output=embed`;
    mapa.classList.remove('hidden');
    document.getElementById('negocioMapaVacio').classList.add('hidden');
    mostrarEnlace('negocioComoLlegar', `https://www.google.com/maps/dir/?api=1&destination=${destino}`);
  }

  if (negocio.whatsapp) {
    const url = `https://wa.me/${encodeURIComponent(negocio.whatsapp)}?text=${encodeURIComponent('Hola, quería hacer una consulta sobre sus productos.')}`;
    mostrarEnlace('negocioWhatsapp', url);
    const flotante = document.getElementById('btnWhatsappFlotante');
    flotante.href = url;
    flotante.classList.remove('hidden');
    flotante.classList.add('flex');
  }

  configurarFechaRetiro();
}

// Límites del selector de fecha según las reglas del negocio
function configurarFechaRetiro() {
  const input = document.getElementById('checkoutFechaRetiro');
  input.min = fechaISO(new Date());

  if (negocioInfo) {
    const maxima = new Date();
    maxima.setDate(maxima.getDate() + negocioInfo.anticipacionMaximaDias);
    input.max = fechaISO(maxima);

    const sinRetiro = DIAS_PLURAL.filter((_, dia) => !negocioInfo.diasRetiro.includes(dia));
    document.getElementById('checkoutFechaAyuda').textContent =
      `Puedes reservar con hasta ${negocioInfo.anticipacionMaximaDias} días de anticipación.` +
      (sinRetiro.length ? ` No hay retiros los ${sinRetiro.join(' ni ')}.` : '');
  }
}

// El input date no permite deshabilitar días de la semana, así que se valida al elegir
function validarFechaRetiroCheckout() {
  const input = document.getElementById('checkoutFechaRetiro');
  let mensaje = '';
  if (input.value && negocioInfo) {
    const dia = new Date(`${input.value}T12:00:00`).getDay();
    if (!negocioInfo.diasRetiro.includes(dia)) {
      mensaje = `Los ${DIAS_PLURAL[dia]} no hay atención para retiros; elige otro día.`;
    }
  }
  input.setCustomValidity(mensaje);
  if (mensaje) input.reportValidity();
}
