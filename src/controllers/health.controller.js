const { testarConexao } = require('../database/conexao');

function verificarApi(_req, res) {
  return res.status(200).json({
    status: 'online',
    servico: 'Portal Educacional EAD'
  });
}

async function verificarBanco(_req, res) {
  const resultado = await testarConexao();
  return res.status(200).json({ status: 'online', ...resultado });
}

module.exports = { verificarApi, verificarBanco };
