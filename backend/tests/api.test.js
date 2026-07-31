import request from 'supertest';
import app from '../src/index.js';

describe('Rutas de Autenticación', () => {
  let token;
  const usuarioTest = {
    nombre: 'Usuario Test',
    email: `test${Date.now()}@test.com`,
    contrasena: 'password123',
    confirmacion: 'password123'
  };

  test('POST /api/auth/registro - Registrar nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send(usuarioTest);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.nombre).toBe(usuarioTest.nombre);
    
    token = res.body.token;
  });

  test('POST /api/auth/login - Iniciar sesión', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: usuarioTest.email,
        contrasena: usuarioTest.contrasena
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.email).toBe(usuarioTest.email);
  });

  test('GET /api/auth/perfil - Obtener perfil del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.usuario.email).toBe(usuarioTest.email);
  });

  test('POST /api/auth/registro - Validar email duplicado', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nombre: 'Otro Usuario',
        email: usuarioTest.email,
        contrasena: 'password123',
        confirmacion: 'password123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Rutas de Productos', () => {
  let productoId;
  let adminToken;

  beforeAll(async () => {
    // Crear y loguear administrador
    const regRes = await request(app)
      .post('/api/auth/registro')
      .send({
        nombre: 'Admin Test',
        email: `admin${Date.now()}@test.com`,
        contrasena: 'admin123',
        confirmacion: 'admin123'
      });

    adminToken = regRes.body.token;

    // Actualizar rol manualmente en la BD (en pruebas reales)
    // Por ahora solo testeamos con el token obtenido
  });

  test('GET /api/productos - Obtener todos los productos', async () => {
    const res = await request(app)
      .get('/api/productos');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.productos)).toBe(true);
  });

  test('POST /api/productos/validar-stock - Validar stock', async () => {
    const res = await request(app)
      .post('/api/productos/validar-stock')
      .send({
        productoId: '507f1f77bcf86cd799439011',
        cantidad: 5
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('API General', () => {
  test('GET /api - Obtener información de la API', async () => {
    const res = await request(app)
      .get('/api');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.endpoints).toBeDefined();
  });

  test('GET /api/ruta-inexistente - Manejo de ruta no encontrada', async () => {
    const res = await request(app)
      .get('/api/ruta-inexistente');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
