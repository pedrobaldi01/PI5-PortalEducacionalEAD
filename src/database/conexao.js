const mysql = require('mysql2/promise');
const env = require('../config/env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4'
});

async function executar(sql, parametros = [], conexao = null) {
  const executor = conexao || pool;
  const [resultado] = await executor.execute(sql, parametros);
  return resultado;
}

async function testarConexao() {
  const [linhas] = await pool.query(
    'SELECT DATABASE() AS banco, NOW() AS dataHoraBanco'
  );

  return linhas[0];
}

async function transacao(callback) {
  const conexao = await pool.getConnection();

  try {
    await conexao.beginTransaction();
    const resultado = await callback(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

async function encerrarPool() {
  await pool.end();
}

module.exports = {
  pool,
  executar,
  testarConexao,
  transacao,
  encerrarPool
};
