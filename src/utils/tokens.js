require('dotenv').config();

const crypto = require('crypto');

const SEGREDO_TOKEN = process.env.TOKEN_SECRET || 'portal-educacional-dev-secret';
const TEMPO_EXPIRACAO_MS = Number(process.env.TOKEN_EXPIRES_MS || 1000 * 60 * 60 * 8);

function codificarBase64Url(valor) {
  return Buffer.from(JSON.stringify(valor)).toString('base64url');
}

function assinar(payload) {
  return crypto
    .createHmac('sha256', SEGREDO_TOKEN)
    .update(payload)
    .digest('base64url');
}

function gerarToken(usuarioId) {
  const payload = codificarBase64Url({
    usuarioId,
    criadoEm: Date.now()
  });
  const assinatura = assinar(payload);

  return `${payload}.${assinatura}`;
}

function validarToken(token) {
  const partes = token.split('.');

  if (partes.length !== 2) {
    return null;
  }

  const [payload, assinaturaRecebida] = partes;
  const assinaturaEsperada = assinar(payload);

  if (assinaturaRecebida.length !== assinaturaEsperada.length) {
    return null;
  }

  const assinaturaValida = crypto.timingSafeEqual(
    Buffer.from(assinaturaRecebida),
    Buffer.from(assinaturaEsperada)
  );

  if (!assinaturaValida) {
    return null;
  }

  try {
    const dados = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const expirou = Date.now() - dados.criadoEm > TEMPO_EXPIRACAO_MS;

    if (expirou) {
      return null;
    }

    return dados;
  } catch (erro) {
    return null;
  }
}

module.exports = {
  gerarToken,
  validarToken
};
