import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Los campos NUMERIC de Postgres vienen como string por defecto; los
// exponemos como number ya que el resto de la API trabaja con floats.
types.setTypeParser(1700, (value) => (value === null ? null : parseFloat(value)));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = path.join(__dirname, '../../sql/schema.sql');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

let schemaReady = null;

export const connectDB = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      const schema = await fs.readFile(SCHEMA_FILE, 'utf-8');
      await pool.query(schema);
    })();
  }
  return schemaReady;
};
