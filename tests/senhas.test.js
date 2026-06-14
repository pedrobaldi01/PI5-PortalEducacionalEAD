const test = require('node:test');
const assert = require('node:assert/strict');
const { gerarHashSenha, verificarSenha } = require('../src/utils/senhas');

test('gera hash e valida a senha correta', async () => {
  const hash = await gerarHashSenha('123456');
  assert.match(hash, /^scrypt:/);
  assert.equal(await verificarSenha('123456', hash), true);
  assert.equal(await verificarSenha('errada', hash), false);
});
