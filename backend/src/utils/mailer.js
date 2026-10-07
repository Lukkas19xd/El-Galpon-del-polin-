import nodemailer from 'nodemailer';
import { logger } from './logger.js';
import { negocio } from '../../data/negocio.js';

// Envío por Gmail con contraseña de aplicación
// (Cuenta de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones).
// Se lee al primer envío para no depender de cuándo se cargó el .env.
let transporter;
const obtenerTransporter = () => {
  if (transporter === undefined) {
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    transporter = GMAIL_USER && GMAIL_APP_PASSWORD
      ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
      })
      : null;
  }
  return transporter;
};

const monedaCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Santiago'
});

const escapar = (texto = '') => String(texto)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const ESTILO = 'font-family:Arial,sans-serif;max-width:600px;color:#222';
const COLOR_TITULO = '#2f4f2f';

const tablaItems = (items, total) => {
  const filas = items.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapar(item.nombre)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.cantidad}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${monedaCLP.format(item.subtotal)}</td>
    </tr>`).join('');

  return `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f3f3f3;text-align:left">
          <th style="padding:8px">Producto</th>
          <th style="padding:8px;text-align:center">Cantidad</th>
          <th style="padding:8px;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <p style="font-size:18px;text-align:right"><strong>Total: ${monedaCLP.format(total)}</strong></p>`;
};

const textoItems = (items, total) => [
  ...items.map((item) => `- ${item.nombre} x${item.cantidad}: ${monedaCLP.format(item.subtotal)}`),
  '',
  `Total: ${monedaCLP.format(total)}`
].join('\n');

const enlaceWhatsapp = () => (negocio.whatsapp ? `https://wa.me/${negocio.whatsapp}` : '');

// Bloque "dónde y cuándo retirar" para los correos al cliente
const datosRetiro = () => {
  const horario = negocio.horario.map((h) => `${h.dias}: ${h.horas}`);
  const html = `
    <div style="background:#f3f7f4;border-left:4px solid ${COLOR_TITULO};padding:12px 16px;margin:16px 0">
      <p style="margin:0 0 6px"><strong>Dónde retirar:</strong> ${escapar(negocio.direccion)}, ${escapar(negocio.comuna)}</p>
      <p style="margin:0 0 6px"><strong>Horario:</strong><br>${horario.map(escapar).join('<br>')}</p>
      ${enlaceWhatsapp() ? `<p style="margin:0"><strong>¿Dudas?</strong> Escríbenos por WhatsApp: <a href="${enlaceWhatsapp()}">+${negocio.whatsapp}</a></p>` : ''}
    </div>`;
  const texto = [
    `Dónde retirar: ${negocio.direccion}, ${negocio.comuna}`,
    'Horario:',
    ...horario.map((h) => `  ${h}`),
    enlaceWhatsapp() ? `¿Dudas? WhatsApp: +${negocio.whatsapp}` : ''
  ].join('\n');
  return { html, texto };
};

// Envía un correo. Nunca lanza: si falla, la operación que lo pidió ya quedó
// guardada y solo se registra el error.
const enviar = async ({ para, asunto, html, texto, responderA, referencia }) => {
  if (!obtenerTransporter()) {
    logger.warn(`Correo no configurado (GMAIL_USER / GMAIL_APP_PASSWORD); no se envió: ${referencia}`);
    return;
  }
  if (!para) {
    logger.warn(`Sin destinatario; no se envió: ${referencia}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${negocio.nombre}" <${process.env.GMAIL_USER}>`,
      to: para,
      replyTo: responderA,
      subject: asunto,
      text: texto,
      html
    });
    logger.info(`Correo enviado a ${para}: ${referencia}`);
  } catch (error) {
    logger.error(`No se pudo enviar el correo a ${para} (${referencia}): ${error.message}`);
  }
};

// Aviso al negocio: "tal cliente hizo tal reserva para tal fecha"
export const notificarNuevaReserva = ({ pedido, cliente, items }) => {
  const html = `
    <div style="${ESTILO}">
      <h2 style="color:${COLOR_TITULO}">Nueva reserva ${escapar(pedido.numeroOrden)}</h2>
      <p><strong>${escapar(cliente.nombre)}</strong> hizo una reserva para retirar el
        <strong>${formatearFecha(pedido.fechaRetiro)}</strong>.</p>
      <p>
        Correo: ${escapar(cliente.email)}<br>
        Teléfono: ${escapar(cliente.telefono || 'no informado')}
      </p>
      ${tablaItems(items, pedido.total)}
      ${pedido.nota ? `<p><strong>Nota del cliente:</strong> ${escapar(pedido.nota)}</p>` : ''}
    </div>`;

  const texto = [
    `Nueva reserva ${pedido.numeroOrden}`,
    `${cliente.nombre} hizo una reserva para retirar el ${formatearFecha(pedido.fechaRetiro)}.`,
    `Correo: ${cliente.email} | Teléfono: ${cliente.telefono || 'no informado'}`,
    '',
    textoItems(items, pedido.total),
    pedido.nota ? `Nota del cliente: ${pedido.nota}` : ''
  ].join('\n');

  return enviar({
    para: process.env.CORREO_RESERVAS || process.env.GMAIL_USER,
    responderA: cliente.email,
    asunto: `Nueva reserva ${pedido.numeroOrden} – ${cliente.nombre} retira el ${formatearFecha(pedido.fechaRetiro)}`,
    html,
    texto,
    referencia: `aviso de reserva ${pedido.numeroOrden}`
  });
};

// Confirmación al cliente con su código, fecha, detalle y dónde retirar
export const confirmarReservaCliente = ({ pedido, cliente, items }) => {
  const retiro = datosRetiro();
  const html = `
    <div style="${ESTILO}">
      <h2 style="color:${COLOR_TITULO}">¡Recibimos tu reserva, ${escapar(cliente.nombre)}!</h2>
      <p>Tu código de reserva es <strong style="font-size:18px">${escapar(pedido.numeroOrden)}</strong>.
        Guárdalo para cualquier consulta.</p>
      <p>Fecha de retiro: <strong>${formatearFecha(pedido.fechaRetiro)}</strong></p>
      ${tablaItems(items, pedido.total)}
      <p>El pago se realiza al momento de retirar.</p>
      ${retiro.html}
      <p style="color:#666;font-size:13px">Te avisaremos por correo cuando tu pedido esté listo para retirar.</p>
    </div>`;

  const texto = [
    `¡Recibimos tu reserva, ${cliente.nombre}!`,
    `Código de reserva: ${pedido.numeroOrden}`,
    `Fecha de retiro: ${formatearFecha(pedido.fechaRetiro)}`,
    '',
    textoItems(items, pedido.total),
    '',
    'El pago se realiza al momento de retirar.',
    '',
    retiro.texto
  ].join('\n');

  return enviar({
    para: cliente.email,
    asunto: `Reserva ${pedido.numeroOrden} confirmada – retiro el ${formatearFecha(pedido.fechaRetiro)}`,
    html,
    texto,
    referencia: `confirmación de reserva ${pedido.numeroOrden}`
  });
};

// Aviso al cliente cuando el admin marca la reserva como "lista para retiro"
export const avisarPedidoListo = ({ pedido, cliente }) => {
  const retiro = datosRetiro();
  const html = `
    <div style="${ESTILO}">
      <h2 style="color:${COLOR_TITULO}">Tu pedido ${escapar(pedido.numeroOrden)} está listo para retirar</h2>
      <p>Hola ${escapar(cliente.nombre)}, ya preparamos tu pedido. Te esperamos el
        <strong>${formatearFecha(pedido.fechaRetiro)}</strong>.</p>
      ${retiro.html}
    </div>`;

  const texto = [
    `Hola ${cliente.nombre}, tu pedido ${pedido.numeroOrden} está listo para retirar.`,
    `Te esperamos el ${formatearFecha(pedido.fechaRetiro)}.`,
    '',
    retiro.texto
  ].join('\n');

  return enviar({
    para: cliente.email,
    asunto: `Tu pedido ${pedido.numeroOrden} está listo para retirar`,
    html,
    texto,
    referencia: `pedido listo ${pedido.numeroOrden}`
  });
};
