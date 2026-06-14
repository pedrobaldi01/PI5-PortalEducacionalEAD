const dotenv = require('dotenv');

dotenv.config();

function obrigatoria(nome, valorPadrao = null) {
  const valor = process.env[nome] ?? valorPadrao;

  if (valor === null || valor === undefined || String(valor).trim() === '') {
    throw new Error(`Variável obrigatória ausente no .env: ${nome}`);
  }

  return valor;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'escola_ead',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
  },

  token: {
    secret: obrigatoria('TOKEN_SECRET'),
    expiresMs: Number(process.env.TOKEN_EXPIRES_MS || 8 * 60 * 60 * 1000)
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: process.env.UPLOAD_DIR || 'uploads/private',
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 20)
};
