process.env.TOKEN_SECRET = process.env.TOKEN_SECRET || 'segredo-de-teste-completo';
process.env.TOKEN_EXPIRES_MS = '60000';

const test = require('node:test');
const assert = require('node:assert/strict');
const { gerarToken, validarToken } = require('../src/utils/tokens');

test('gera e valida token assinado', () => {
  const token = gerarToken(10);
  const dados = validarToken(token);
  assert.equal(dados.usuarioId, 10);
});

test('rejeita token alterado', () => {
  const token = gerarToken(10);
  assert.equal(validarToken(`${token}x`), null);
});
