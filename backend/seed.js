import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './src/db.js';
import Usuario from './src/models/Usuario.js';
import Producto from './src/models/Producto.js';

dotenv.config();

const productos = [
  {
    nombre: 'Polín Impregnado Industrial 100x100mm',
    descripcion: 'Polín de madera tratada con protección especial contra plagas e humedad. Ideal para proyectos industriales.',
    precio: 45.99,
    stock: 150,
    tipo: 'impregnado',
    categoria: 'industrial',
    activo: true,
    especificaciones: {
      diametro: 100,
      largo: 2400,
      material: 'Madera Impregnada',
      peso: 12.5
    }
  },
  {
    nombre: 'Polín Estándar 75x75mm',
    descripcion: 'Polín de madera estándar sin tratamiento. Uso general en construcción.',
    precio: 28.5,
    stock: 200,
    tipo: 'estandar',
    categoria: 'construccion',
    activo: true,
    especificaciones: {
      diametro: 75,
      largo: 2400,
      material: 'Madera Blanda',
      peso: 8.5
    }
  },
  {
    nombre: 'Polín Impregnado Agrícola 150x150mm',
    descripcion: 'Polín robusto impregnado para uso agrícola prolongado. Excelente durabilidad.',
    precio: 89.99,
    stock: 80,
    tipo: 'impregnado',
    categoria: 'agricola',
    activo: true,
    especificaciones: {
      diametro: 150,
      largo: 2400,
      material: 'Madera Impregnada Premium',
      peso: 28.0
    }
  },
  {
    nombre: 'Polín Estándar 100x100mm',
    descripcion: 'Polín estándar con buena relación calidad-precio. Versátil para múltiples usos.',
    precio: 32.75,
    stock: 220,
    tipo: 'estandar',
    categoria: 'construccion',
    activo: true,
    especificaciones: {
      diametro: 100,
      largo: 2400,
      material: 'Madera Blanda',
      peso: 14.0
    }
  },
  {
    nombre: 'Polín Impregnado de Construcción 50x50mm',
    descripcion: 'Polín de pequeño calibre, impregnado. Perfecto para marcos y estructuras ligeras.',
    precio: 15.5,
    stock: 500,
    tipo: 'impregnado',
    categoria: 'construccion',
    activo: true,
    especificaciones: {
      diametro: 50,
      largo: 2400,
      material: 'Madera Impregnada',
      peso: 4.2
    }
  },
  {
    nombre: 'Polín Industrial Extra 200x200mm',
    descripcion: 'Polín de gran tamaño para proyectos industriales pesados. Máxima resistencia.',
    precio: 165.99,
    stock: 45,
    tipo: 'impregnado',
    categoria: 'industrial',
    activo: true,
    especificaciones: {
      diametro: 200,
      largo: 2400,
      material: 'Madera Impregnada Premium',
      peso: 52.0
    }
  }
];

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

    const productosCreados = [];
    for (const productoData of productos) {
      const existente = await Producto.findOne({ nombre: productoData.nombre });
      if (!existente) {
        const producto = await Producto.create(productoData);
        productosCreados.push(producto);
      }
    }

    console.log(`✓ ${productosCreados.length} productos creados`);
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
