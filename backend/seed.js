import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './src/db.js';
import Usuario from './src/models/Usuario.js';
import Producto from './src/models/Producto.js';
import { catalogo } from './data/catalogo.js';

dotenv.config();

async function seedDatabase() {
  try {
    await connectDB();
    console.log('✓ Base de datos local lista');

    const adminExistente = await Usuario.findOne({ email: 'admin@example.com' });
    if (!adminExistente) {
      const contrasenaAdmin = await bcryptjs.hash('admin123', 10);
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@example.com',
        contrasena: contrasenaAdmin,
        rol: 'administrador',
        activo: true
      });
      console.log('✓ Usuario administrador creado: admin@example.com');
    }

    const clienteExistente = await Usuario.findOne({ email: 'cliente@example.com' });
    if (!clienteExistente) {
      const contrasenaCliente = await bcryptjs.hash('cliente123', 10);
      await Usuario.create({
        nombre: 'Cliente de Prueba',
        email: 'cliente@example.com',
        contrasena: contrasenaCliente,
        rol: 'cliente',
        activo: true,
        telefono: '1234567890',
        direccion: 'Calle Principal 123',
        ciudad: 'Ciudad'
      });
      console.log('✓ Usuario cliente creado: cliente@example.com');
    }

    // Upsert por nombre: correr el seed de nuevo actualiza precios y stock
    let creados = 0;
    let actualizados = 0;
    for (const productoData of catalogo) {
      const existente = await Producto.findOne({ nombre: productoData.nombre });
      if (existente) {
        await Producto.findByIdAndUpdate(existente.id, productoData);
        actualizados++;
      } else {
        await Producto.create(productoData);
        creados++;
      }
    }

    // Los productos que ya no están en el catálogo se desactivan en vez de
    // borrarse, porque pueden estar referenciados por reservas existentes.
    const nombresCatalogo = new Set(catalogo.map((p) => p.nombre));
    let desactivados = 0;
    for (const producto of await Producto.find({ activo: true })) {
      if (!nombresCatalogo.has(producto.nombre)) {
        await Producto.findByIdAndUpdate(producto.id, { activo: false });
        desactivados++;
      }
    }

    console.log(`✓ Productos: ${creados} creados, ${actualizados} actualizados, ${desactivados} desactivados`);
    console.log('\n✓ Base de datos inicializada correctamente');
    console.log('\nCredenciales de prueba:');
    console.log('  Admin: admin@example.com / admin123');
    console.log('  Cliente: cliente@example.com / cliente123');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error inicializando la base de datos:', error.message);
    process.exit(1);
  }
}

seedDatabase();
