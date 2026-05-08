const { memoria } = require('../database/memoria');

function autenticar(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      erro: 'Token não informado. Faça login primeiro.'
    });
  }

  const partes = authorization.split(' ');
  const tipo = partes[0];
  const token = partes[1];

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({
      erro: 'Formato do token inválido. Use: Authorization: Bearer SEU_TOKEN'
    });
  }

  const sessao = memoria.sessoes.find((item) => item.token === token);

  if (!sessao) {
    return res.status(401).json({
      erro: 'Token inválido ou expirado.'
    });
  }

  const usuario = memoria.usuarios.find((item) => item.id === sessao.usuarioId);

  if (!usuario) {
    return res.status(401).json({
      erro: 'Usuário da sessão não encontrado.'
    });
  }

  req.usuario = usuario;

  next();
}

module.exports = autenticar;
