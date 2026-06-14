const test = require('node:test');
const assert = require('node:assert/strict');
const {
  cpfValido,
  somenteDigitos,
  dataISOValida,
  emailValido,
  inteiroPositivo
} = require('../src/utils/validacoes');

test('valida CPF conhecido e rejeita CPF repetido', () => {
  assert.equal(cpfValido('123.456.789-09'), true);
  assert.equal(cpfValido('111.111.111-11'), false);
});

test('remove caracteres não numéricos', () => {
  assert.equal(somenteDigitos('(54) 99999-9999'), '54999999999');
});

test('valida data ISO', () => {
  assert.equal(dataISOValida('2000-01-31'), true);
  assert.equal(dataISOValida('2000-02-31'), false);
});

test('valida e-mail e inteiro positivo', () => {
  assert.equal(emailValido('aluno@teste.com'), true);
  assert.equal(emailValido('email-invalido'), false);
  assert.equal(inteiroPositivo('2'), true);
  assert.equal(inteiroPositivo(0), false);
});
