const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const METODO = 'scrypt';
const TAMANHO_CHAVE = 64;

async function gerarHashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(senha, salt, TAMANHO_CHAVE);
  return `${METODO}:${salt}:${hash.toString('hex')}`;
}

async function verificarSenha(senhaInformada, senhaArmazenada) {
  if (!senhaInformada || !senhaArmazenada) return false;

  const partes = senhaArmazenada.split(':');

  // Compatibilidade temporária com registros antigos em texto puro.
  if (partes.length !== 3 || partes[0] !== METODO) {
    const informado = Buffer.from(String(senhaInformada));
    const armazenado = Buffer.from(String(senhaArmazenada));
    if (informado.length !== armazenado.length) return false;
    return crypto.timingSafeEqual(informado, armazenado);
  }

  const [, salt, hashOriginal] = partes;
  const hashInformado = await scrypt(senhaInformada, salt, TAMANHO_CHAVE);
  const hashOriginalBuffer = Buffer.from(hashOriginal, 'hex');

  if (hashInformado.length !== hashOriginalBuffer.length) return false;
  return crypto.timingSafeEqual(hashInformado, hashOriginalBuffer);
}

module.exports = { gerarHashSenha, verificarSenha };
