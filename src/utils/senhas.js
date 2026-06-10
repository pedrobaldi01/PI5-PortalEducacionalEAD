const crypto = require('crypto');

const METODO = 'scrypt';
const TAMANHO_CHAVE = 64;

function gerarHashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, TAMANHO_CHAVE).toString('hex');

  return `${METODO}:${salt}:${hash}`;
}

function verificarSenha(senhaInformada, senhaArmazenada) {
  if (!senhaInformada || !senhaArmazenada) {
    return false;
  }

  const partes = senhaArmazenada.split(':');

  if (partes.length !== 3 || partes[0] !== METODO) {
    return senhaInformada === senhaArmazenada;
  }

  const [, salt, hashOriginal] = partes;
  const hashInformado = crypto.scryptSync(senhaInformada, salt, TAMANHO_CHAVE);
  const hashOriginalBuffer = Buffer.from(hashOriginal, 'hex');

  if (hashInformado.length !== hashOriginalBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashInformado, hashOriginalBuffer);
}

module.exports = {
  gerarHashSenha,
  verificarSenha
};
