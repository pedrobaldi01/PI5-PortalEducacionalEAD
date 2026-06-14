const { executar } = require('../database/conexao');
const { validarToken } = require('../utils/tokens');

async function autenticar(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [tipo, token] = authorization.split(' ');

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({
        erro: 'Token ausente ou malformado. Use Authorization: Bearer SEU_TOKEN.'
      });
    }

    const dadosToken = validarToken(token);

    if (!dadosToken) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    const usuarios = await executar(
      `SELECT u.usuario_id, u.nome, u.cpf, u.data_nascimento, u.email,
              u.telefone, u.endereco, u.login, u.tipo, u.status,
              u.data_cadastro, a.aluno_id, p.professor_id,
              ad.administrador_id, c.coordenador_id
         FROM Usuario u
         LEFT JOIN Aluno a ON a.usuario_id = u.usuario_id
         LEFT JOIN Professor p ON p.usuario_id = u.usuario_id
         LEFT JOIN Administrador ad ON ad.usuario_id = u.usuario_id
         LEFT JOIN Coordenador c ON c.usuario_id = u.usuario_id
        WHERE u.usuario_id = ?
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
