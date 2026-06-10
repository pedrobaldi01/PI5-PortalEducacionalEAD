const { executar } = require('../database/conexao');
const { validarToken } = require('../utils/tokens');

async function autenticar(req, res, next) {
  try {
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

    const dadosToken = validarToken(token);

    if (!dadosToken) {
      return res.status(401).json({
        erro: 'Token inválido ou expirado.'
      });
    }

    const usuarios = await executar(
      `SELECT usuario_id, nome, cpf, data_nascimento, email, telefone,
              endereco, login, tipo, status, data_cadastro
         FROM Usuario
        WHERE usuario_id = ?
        LIMIT 1`,
      [dadosToken.usuarioId]
    );

    const usuario = usuarios[0];

    if (!usuario || usuario.status !== 'Ativo') {
      return res.status(401).json({
        erro: 'Usuário da sessão não encontrado ou inativo.'
      });
    }

    req.usuario = usuario;

    return next();
  } catch (erro) {
    return next(erro);
  }
}

module.exports = autenticar;
