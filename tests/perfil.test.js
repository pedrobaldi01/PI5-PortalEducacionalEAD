const test = require('node:test');
const assert = require('node:assert/strict');
const permitirPerfis = require('../src/middlewares/perfil.middleware');

function respostaFake() {
  return {
    statusCode: 200,
    corpo: null,
    status(codigo) { this.statusCode = codigo; return this; },
    json(corpo) { this.corpo = corpo; return this; }
  };
}

test('permite administrador em rota administrativa', () => {
  const req = { usuario: { tipo: 'Administrador' } };
  const res = respostaFake();
  let chamado = false;
  permitirPerfis('Administrador')(req, res, () => { chamado = true; });
  assert.equal(chamado, true);
});

test('bloqueia aluno em rota administrativa', () => {
  const req = { usuario: { tipo: 'Aluno' } };
  const res = respostaFake();
  permitirPerfis('Administrador')(req, res, () => {});
  assert.equal(res.statusCode, 403);
});
