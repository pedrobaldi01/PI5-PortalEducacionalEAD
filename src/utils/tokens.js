const crypto = require('node:crypto');
const env = require('../config/env');

function codificar(valor) {
  return Buffer.from(JSON.stringify(valor)).toString('base64url');
}

function assinar(payload) {
  return crypto
    .createHmac('sha256', env.token.secret)
    .update(payload)
    .digest('base64url');
}

function gerarToken(usuarioId) {
  const payload = codificar({
    usuarioId: Number(usuarioId),
    criadoEm: Date.now(),
    expiraEm: Date.now() + env.token.expiresMs
  });

  return `${payload}.${assinar(payload)}`;
}

function validarToken(token) {
  if (typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 2) return null;

  const [payload, assinaturaRecebida] = partes;
  const assinaturaEsperada = assinar(payload);

  if (assinaturaRecebida.length !== assinaturaEsperada.length) return null;

  const valida = crypto.timingSafeEqual(
    Buffer.from(assinaturaRecebida),
    Buffer.from(assinaturaEsperada)
  );

  if (!valida) return null;

  try {
    const dados = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!dados.usuarioId || Date.now() > dados.expiraEm) return null;
    return dados;
  } catch (_erro) {
    return null;
  }
}

module.exports = { gerarToken, validarToken };
