import request from 'supertest';
import bcryptjs from 'bcryptjs';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import Producto from '../src/models/Producto.js';
import Usuario from '../src/models/Usuario.js';
import { negocio } from '../data/negocio.js';

let contador = 0;
const emailUnico = (prefijo) => `${prefijo}${Date.now()}${contador++}@test.com`;

const registrarCliente = async () => {
  const contrasena = 'clave-segura-1';
  const res = await request(app).post('/api/auth/registro').send({
    nombre: 'Cliente Reservas',
    email: emailUnico('cliente'),
    contrasena,
    confirmacion: contrasena
  });
  return { token: res.body.token, id: res.body.usuario.id };
};

const crearAdmin = async () => {
  const email = emailUnico('admin');
  await Usuario.create({
    nombre: 'Admin Reservas',
    email,
    contrasena: await bcryptjs.hash('clave-admin-1', 4),
    rol: 'administrador'
  });
  const res = await request(app).post('/api/auth/login').send({ email, contrasena: 'clave-admin-1' });
  return res.body.token;
};

const crearProducto = (stock, precio = 1000) => Producto.create({
  nombre: `Producto reservas ${contador++}`,
  descripcion: 'Producto de prueba',
  precio,
  stock,
  tipo: 'lena',
  categoria: 'lena'
});

// Próximo día con atención para retiros, en formato YYYY-MM-DD local
const fechaRetiroValida = () => {
  const fecha = new Date();
  do {
    fecha.setDate(fecha.getDate() + 1);
  } while (!negocio.diasRetiro.includes(fecha.getDay()));
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const conToken = (token) => ({ Authorization: `Bearer ${token}` });

const agregar = (token, productoId, cantidad) => request(app)
  .post('/api/carrito/agregar').set(conToken(token)).send({ productoId, cantidad });

const reservar = (token, body = {}) => request(app)
  .post('/api/pedidos').set(conToken(token)).send({ fechaRetiro: fechaRetiroValida(), ...body });

const stockDe = async (id) => (await Producto.findById(id)).stock;

afterAll(() => pool.end());

describe('Reservas', () => {
  test('crea la reserva, descuenta el stock y vacía el carrito', async () => {
    const cliente = await registrarCliente();
    const producto = await crearProducto(10, 2500);

    await agregar(cliente.token, producto.id, 4);
    const res = await reservar(cliente.token, { nota: 'Paso en la tarde' });

    expect(res.statusCode).toBe(201);
    expect(res.body.pedido.numeroOrden).toMatch(/^RES-/);
    expect(res.body.pedido.total).toBe(10000);
    expect(await stockDe(producto.id)).toBe(6);

    const carrito = await request(app).get('/api/carrito').set(conToken(cliente.token));
    expect(carrito.body.carrito.items).toHaveLength(0);
  });

  test('dos reservas simultáneas no pueden vender más stock del que hay', async () => {
    const producto = await crearProducto(5);
    const clientes = await Promise.all([registrarCliente(), registrarCliente()]);
    for (const cliente of clientes) {
      await agregar(cliente.token, producto.id, 4);
    }

    // Las dos piden 4 de 5 al mismo tiempo: solo una puede salir bien
    const respuestas = await Promise.all(clientes.map((cliente) => reservar(cliente.token)));
    const codigos = respuestas.map((r) => r.statusCode).sort();

    expect(codigos).toEqual([201, 409]);
    expect(await stockDe(producto.id)).toBe(1);
  });

  test('si falta stock de un producto no se reserva nada', async () => {
    const cliente = await registrarCliente();
    const conStock = await crearProducto(10);
    const escaso = await crearProducto(3);

    await agregar(cliente.token, conStock.id, 2);
    await agregar(cliente.token, escaso.id, 3);
    // Otro cliente se lleva parte del producto escaso antes
    await Producto.findByIdAndUpdate(escaso.id, { stock: 1 });

    const res = await reservar(cliente.token);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/Stock insuficiente/);
    // El otro producto no quedó descontado y el carrito sigue intacto
    expect(await stockDe(conStock.id)).toBe(10);
    const carrito = await request(app).get('/api/carrito').set(conToken(cliente.token));
    expect(carrito.body.carrito.items).toHaveLength(2);
  });

  test('no se puede reservar un domingo ni con el carrito vacío', async () => {
    const cliente = await registrarCliente();

    const vacio = await reservar(cliente.token);
    expect(vacio.statusCode).toBe(400);
    expect(vacio.body.message).toBe('El carrito está vacío');

    const domingo = new Date();
    domingo.setDate(domingo.getDate() + ((7 - domingo.getDay()) % 7 || 7));
    const local = new Date(domingo.getTime() - domingo.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const producto = await crearProducto(5);
    await agregar(cliente.token, producto.id, 1);
    const res = await reservar(cliente.token, { fechaRetiro: local });
    expect(res.statusCode).toBe(400);
  });
});

describe('Estados de una reserva', () => {
  let adminToken;
  beforeAll(async () => {
    adminToken = await crearAdmin();
  });

  const crearReserva = async (stock = 10, cantidad = 3) => {
    const cliente = await registrarCliente();
    const producto = await crearProducto(stock);
    await agregar(cliente.token, producto.id, cantidad);
    const res = await reservar(cliente.token);
    const pedido = await request(app)
      .get(`/api/pedidos/buscar?codigo=${res.body.pedido.numeroOrden}`)
      .set(conToken(cliente.token));
    return { cliente, producto, pedidoId: pedido.body.pedido._id };
  };

  const cambiarEstado = (pedidoId, estado) => request(app)
    .put(`/api/pedidos/${pedidoId}/estado`).set(conToken(adminToken)).send({ estado });

  test('avanza en orden y no permite saltarse pasos', async () => {
    const { pedidoId } = await crearReserva();

    expect((await cambiarEstado(pedidoId, 'retirado')).statusCode).toBe(400);
    expect((await cambiarEstado(pedidoId, 'confirmado')).statusCode).toBe(200);
    expect((await cambiarEstado(pedidoId, 'listo')).statusCode).toBe(200);
    expect((await cambiarEstado(pedidoId, 'retirado')).statusCode).toBe(200);
  });

  test('cancelar devuelve el stock una sola vez aunque se cancele dos veces a la vez', async () => {
    const { producto, pedidoId } = await crearReserva(10, 3);
    expect(await stockDe(producto.id)).toBe(7);

    const respuestas = await Promise.all([cambiarEstado(pedidoId, 'cancelado'), cambiarEstado(pedidoId, 'cancelado')]);

    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([200, 400]);
    expect(await stockDe(producto.id)).toBe(10);
  });

  test('la vista de retiros es solo para el admin y trae las reservas activas', async () => {
    const { cliente, pedidoId } = await crearReserva();

    expect((await request(app).get('/api/pedidos/retiros').set(conToken(cliente.token))).statusCode).toBe(403);

    const res = await request(app).get('/api/pedidos/retiros').set(conToken(adminToken));
    expect(res.statusCode).toBe(200);
    expect(res.body.pedidos.map((p) => p._id)).toContain(pedidoId);
    expect(res.body.pedidos[0].usuario.nombre).toBeDefined();
  });

  test('un cliente no puede ver la reserva de otro', async () => {
    const { pedidoId } = await crearReserva();
    const otro = await registrarCliente();

    const res = await request(app).get(`/api/pedidos/${pedidoId}`).set(conToken(otro.token));
    expect(res.statusCode).toBe(404);
  });
});

describe('Errores y seguridad', () => {
  test('un id con formato inválido responde 404, no 500', async () => {
    const res = await request(app).get('/api/productos/abc');
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ success: false, message: 'Producto no encontrado' });
  });

  test('los errores de validación usan el formato { success, message, detalles }', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'malo', contrasena: 'x' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false, message: 'Email inválido.' });
    expect(res.body.detalles[0]).toMatchObject({ campo: 'email' });
  });

  test('JSON mal formado responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.statusCode).toBe(400);
  });

  test('exige contraseñas de al menos 8 caracteres', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Corta', email: emailUnico('corta'), contrasena: '1234567', confirmacion: '1234567'
    });
    expect(res.statusCode).toBe(400);
  });

  test('el perfil nunca incluye el hash de la contraseña', async () => {
    const cliente = await registrarCliente();
    const res = await request(app).get('/api/auth/perfil').set(conToken(cliente.token));
    expect(res.statusCode).toBe(200);
    expect(res.body.usuario.contrasena).toBeUndefined();
  });

  test('una cuenta desactivada pierde el acceso aunque su token no haya expirado', async () => {
    const cliente = await registrarCliente();
    await Usuario.findByIdAndUpdate(cliente.id, { activo: false });

    const res = await request(app).get('/api/carrito').set(conToken(cliente.token));
    expect(res.statusCode).toBe(403);
  });

  test('editar un producto valida los datos', async () => {
    const adminToken = await crearAdmin();
    const producto = await crearProducto(5);

    const negativo = await request(app)
      .put(`/api/productos/${producto.id}`).set(conToken(adminToken)).send({ precio: -10 });
    expect(negativo.statusCode).toBe(400);

    const bien = await request(app)
      .put(`/api/productos/${producto.id}`).set(conToken(adminToken)).send({ precio: 3000 });
    expect(bien.statusCode).toBe(200);
    expect(bien.body.producto.precio).toBe(3000);
  });
});
