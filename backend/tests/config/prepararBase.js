// Corre una vez antes de todos los tests: crea la base de tests si no existe,
// le aplica el esquema y la deja vacía.
import pg from 'pg';
import fs from 'fs/promises';
import { urlBaseDeTest } from './baseDeTest.js';

export default async function prepararBase() {
  const urlTest = new URL(urlBaseDeTest());
  const nombreBase = urlTest.pathname.slice(1);

  // Para crear la base hay que conectarse a otra que ya exista
  const urlAdmin = new URL(urlTest);
  urlAdmin.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: urlAdmin.toString() });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombreBase]);
  if (rowCount === 0) {
    await admin.query(`CREATE DATABASE "${nombreBase.replace(/"/g, '')}"`);
  }
  await admin.end();

  const cliente = new pg.Client({ connectionString: urlTest.toString() });
  await cliente.connect();
  const schema = await fs.readFile(new URL('../../sql/schema.sql', import.meta.url), 'utf-8');
  await cliente.query(schema);
  await cliente.query('TRUNCATE pedido_items, pedidos, carrito_items, carritos, productos, usuarios CASCADE');
  await cliente.end();
}
