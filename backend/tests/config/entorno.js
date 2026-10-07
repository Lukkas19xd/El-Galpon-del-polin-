// Corre antes de cada archivo de tests, antes de que se importe la app:
// así el pool de conexiones se crea apuntando a la base de tests.
import { urlBaseDeTest } from './baseDeTest.js';

process.env.DATABASE_URL = urlBaseDeTest();
process.env.NODE_ENV = 'test';
// Los tests nunca mandan correos reales
process.env.GMAIL_USER = '';
process.env.GMAIL_APP_PASSWORD = '';
