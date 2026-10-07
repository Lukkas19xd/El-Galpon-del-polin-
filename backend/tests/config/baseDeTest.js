import dotenv from 'dotenv';

dotenv.config();

// URL de la base de datos de los tests: DATABASE_URL_TEST si existe; si no,
// la misma de desarrollo con "_test" al final del nombre. Nunca la de desarrollo.
export const urlBaseDeTest = () => {
  if (process.env.DATABASE_URL_TEST) return process.env.DATABASE_URL_TEST;
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `${url.pathname}_test`;
  return url.toString();
};
