// La aplicación Express sin arrancar el servidor: index.js la pone a escuchar
// y los tests la importan directamente (sin ocupar ningún puerto).
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB } from './db.js';
import { errorHandler } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';
import { limiteGeneral } from './middlewares/limites.js';
import { negocio } from '../data/negocio.js';

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

const enProduccion = process.env.NODE_ENV === 'production';

// Con la clave de ejemplo cualquiera podría firmar tokens de administrador
const clave = process.env.JWT_SECRET || '';
const claveDebil = clave.length < 32 || /cambiar|tu_clave|secret/i.test(clave);
if (!clave) {
  throw new Error('Falta JWT_SECRET en el .env');
}
if (claveDebil) {
  if (enProduccion) {
    throw new Error('JWT_SECRET es la de ejemplo o muy corta. Genera una con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  }
  logger.warn('JWT_SECRET es la de ejemplo o muy corta: cámbiala antes de publicar el sitio');
}

const app = express();

await connectDB();
logger.info('Base de datos conectada (PostgreSQL)');

// Detrás de un proxy (Nginx, Render, Railway...) la IP real viene en X-Forwarded-For;
// sin esto el límite de peticiones vería a todos los clientes como una sola IP.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

// Cabeceras de seguridad. La política de contenido permite lo que usa el
// frontend: sus propios scripts, los onclick en línea, fotos de productos
// por https y el mapa de Google.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ['https://www.google.com'],
      // En local se sirve por http; forzar https rompería la página
      upgradeInsecureRequests: enProduccion ? [] : null
    }
  }
}));

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

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Logger de peticiones
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos del frontend
app.use(express.static(frontendPath));

app.use('/api', limiteGeneral);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Datos públicos del negocio: ubicación, horario, WhatsApp y reglas de retiro
app.get('/api/negocio', (req, res) => {
  res.status(200).json({ success: true, negocio });
});

// Ruta de bienvenida
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a la API de Agroforestal Monte Redondo SPA',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      negocio: '/api/negocio',
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

// Cualquier otra ruta /api (con cualquier método) no existe
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Ruta no encontrada'
  });
});

// SPA fallback: servir index.html para el resto de las rutas
app.get('*', (req, res) => {
  res.sendFile(join(frontendPath, 'index.html'));
});

// Manejo global de errores
app.use(errorHandler);

export default app;
