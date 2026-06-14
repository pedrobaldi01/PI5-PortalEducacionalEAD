process.env.TOKEN_SECRET = process.env.TOKEN_SECRET || 'segredo-de-teste-completo';

const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

async function comServidor(callback) {
  const servidor = app.listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  const { port } = servidor.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => servidor.close(resolve));
  }
}

test('GET /health responde online', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(`${base}/health`);
    const corpo = await resposta.json();
    assert.equal(resposta.status, 200);
    assert.equal(corpo.status, 'online');
  });
});

test('rota protegida sem token responde 401', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(`${base}/alunos`);
    assert.equal(resposta.status, 401);
  });
});

test('rota inexistente responde 404', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(`${base}/rota-inexistente`);
    assert.equal(resposta.status, 404);
  });
});
