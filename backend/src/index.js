import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB } from './db.js';
import { errorHandler } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import carritoRoutes from './routes/carritoRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';

// Configurar rutas del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendPath = join(__dirname, '../../frontend');

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

await connectDB();
logger.info('Base de datos conectada (PostgreSQL)');

// Middlewares globales
// "localhost" y "127.0.0.1" son orígenes distintos para el navegador aunque
// apunten al mismo servidor, así que aceptamos ambos para evitar bloqueos CORS.
const origenesPermitidos = [
  process.env.FRONTEND_URL || 'http://localhost:8000',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
];

app.use(cors({
  origin: [...new Set(origenesPermitidos)],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logger de peticiones
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos del frontend
app.use(express.static(frontendPath));

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Ruta de bienvenida
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a la API de El Galpón del Polín',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      productos: '/api/productos',
      carrito: '/api/carrito',
      pedidos: '/api/pedidos'
    }
  });
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidoRoutes);

// SPA fallback: servir index.html para rutas que no sean API
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(frontendPath, 'index.html'));
  } else {
    res.status(404).json({
      success: false,
      message: 'Ruta no encontrada'
    });
  }
});

// Manejo global de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, HOST, () => {
  logger.info(`✓ Servidor corriendo en http://${HOST}:${PORT}`);
  logger.info(`✓ API disponible en http://${HOST}:${PORT}/api`);
});

export default app;
