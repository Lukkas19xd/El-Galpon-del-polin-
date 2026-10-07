import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function timestamp() { return new Date().toISOString(); }

function escribir(nivel, mensaje) {
    // En los tests no se registra nada: ensuciaría la salida y el archivo de log real
    if (process.env.NODE_ENV === 'test') return;
    const linea = `[${timestamp()}] [${nivel}] ${mensaje}\n`;
    console.log(linea.trim());
    fs.appendFile(path.join(LOG_DIR, 'app.log'), linea, () => {});
}

export const logger = {
    info: (msg) => escribir('INFO', msg),
    error: (msg) => escribir('ERROR', msg),
    warn: (msg) => escribir('WARN', msg)
};