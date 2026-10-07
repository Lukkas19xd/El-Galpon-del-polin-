import app from './app.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  logger.info(`✓ Servidor corriendo en http://${HOST}:${PORT}`);
  logger.info(`✓ API disponible en http://${HOST}:${PORT}/api`);
});
