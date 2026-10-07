import request from 'supertest';
import bcryptjs from 'bcryptjs';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import Producto from '../src/models/Producto.js';
import Usuario from '../src/models/Usuario.js';

let contador = 0;
const unico = () => `${Date.now()}${contador++}`;
const conToken = (token) => ({ Authorization: `Bearer ${token}` });

const crearUsuario = async (rol) => {
  const email = `${rol}${unico()}@test.com`;
  const usuario = await Usuario.create({
    nombre: `Usuario ${rol}`,
    email,
    contrasena: await bcryptjs.hash('clave-segura-1', 4),
    rol
  });
  const res = await request(app).post('/api/auth/login').send({ email, contrasena: 'clave-segura-1' });
  return { id: usuario.id, token: res.body.token };
};

let admin;
let cliente;

beforeAll(async () => {
  admin = await crearUsuario('administrador');
  cliente = await crearUsuario('cliente');
});

afterAll(() => pool.end());

describe('Catálogo', () => {
  test('busca por nombre o descripción, sin distinguir mayúsculas', async () => {
    const marca = `Quebracho${unico()}`;
    await Producto.create({ nombre: `Leña de ${marca}`, descripcion: 'Seca', precio: 5000, stock: 10, tipo: 'lena', categoria: 'lena' });
    await Producto.create({ nombre: 'Otro producto', descripcion: `Parecido al ${marca}`, precio: 5000, stock: 10, tipo: 'lena', categoria: 'lena' });

    const res = await request(app).get(`/api/productos?q=${marca.toLowerCase()}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.productos).toHaveLength(2);
  });

  test('los comodines de la búsqueda se tratan como texto', async () => {
    const res = await request(app).get('/api/productos?q=%25%25%25');
    expect(res.statusCode).toBe(200);
    expect(res.body.productos).toHaveLength(0);
  });

  test('el admin ve también los productos ocultos; un cliente no puede', async () => {
    const oculto = await Producto.create({
      nombre: `Oculto ${unico()}`, precio: 100, stock: 1, tipo: 'estandar', categoria: 'construccion', activo: false
    });

    const publico = await request(app).get('/api/productos?limite=100');
    expect(publico.body.productos.map((p) => p.id)).not.toContain(oculto.id);

    const deAdmin = await request(app).get('/api/productos/admin/todos').set(conToken(admin.token));
    expect(deAdmin.statusCode).toBe(200);
    expect(deAdmin.body.productos.map((p) => p.id)).toContain(oculto.id);

    const deCliente = await request(app).get('/api/productos/admin/todos').set(conToken(cliente.token));
    expect(deCliente.statusCode).toBe(403);
  });

  test('la foto acepta https o rutas de src/img y rechaza otras cosas', async () => {
    const producto = await Producto.create({ nombre: `Con foto ${unico()}`, precio: 100, stock: 1, tipo: 'lena', categoria: 'lena' });
    const editar = (imagen) => request(app)
      .put(`/api/productos/${producto.id}`).set(conToken(admin.token)).send({ imagen });

    expect((await editar('https://ejemplo.cl/lena.jpg')).statusCode).toBe(200);
    expect((await editar('src/img/productos/lena.jpg')).body.producto.imagen).toBe('src/img/productos/lena.jpg');
    expect((await editar('javascript:alert(1)')).statusCode).toBe(400);
    expect((await editar('')).body.producto.imagen).toBeNull();
  });
});

describe('Usuarios (admin)', () => {
  test('el admin puede desactivar una cuenta y esta pierde el acceso', async () => {
    const otro = await crearUsuario('cliente');

    const res = await request(app)
      .put(`/api/auth/usuarios/${otro.id}`).set(conToken(admin.token)).send({ activo: false });
    expect(res.statusCode).toBe(200);
    expect(res.body.usuario.contrasena).toBeUndefined();

    const acceso = await request(app).get('/api/auth/perfil').set(conToken(otro.token));
    expect(acceso.statusCode).toBe(403);
  });

  test('el admin no puede quitarse el acceso a sí mismo', async () => {
    const res = await request(app)
      .put(`/api/auth/usuarios/${admin.id}`).set(conToken(admin.token)).send({ rol: 'cliente' });
    expect(res.statusCode).toBe(400);
  });

  test('un cliente no puede editar usuarios', async () => {
    const res = await request(app)
      .put(`/api/auth/usuarios/${cliente.id}`).set(conToken(cliente.token)).send({ rol: 'administrador' });
    expect(res.statusCode).toBe(403);
  });
});

describe('Registro', () => {
  test('guarda el teléfono si se envía', async () => {
    const email = `tel${unico()}@test.com`;
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Con teléfono', email, telefono: '+56 9 1234 5678', contrasena: 'clave-segura-1', confirmacion: 'clave-segura-1'
    });
    expect(res.statusCode).toBe(201);

    const perfil = await request(app).get('/api/auth/perfil').set(conToken(res.body.token));
    expect(perfil.body.usuario.telefono).toBe('+56 9 1234 5678');
  });
});
