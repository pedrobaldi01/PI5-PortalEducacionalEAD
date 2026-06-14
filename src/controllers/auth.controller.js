const { executar } = require('../database/conexao');
const { formatarUsuario } = require('../utils/mapeadores');
const { verificarSenha } = require('../utils/senhas');
const { gerarToken } = require('../utils/tokens');
const { textoValido } = require('../utils/validacoes');
const AppError = require('../utils/app-error');

async function login(req, res) {
  const identificador = req.body.login || req.body.email;
  const { senha } = req.body;

  if (!textoValido(identificador) || !textoValido(senha)) {
    throw new AppError(400, 'Informe login ou e-mail e a senha.');
  }

  const usuarios = await executar(
    `SELECT u.usuario_id, u.nome, u.cpf, u.data_nascimento, u.email,
            u.telefone, u.endereco, u.login, u.senha, u.tipo, u.status,
            u.data_cadastro, a.aluno_id, p.professor_id
       FROM Usuario u
       LEFT JOIN Aluno a ON a.usuario_id = u.usuario_id
       LEFT JOIN Professor p ON p.usuario_id = u.usuario_id
      WHERE u.login = ? OR u.email = ?
      LIMIT 1`,
    [identificador.trim(), identificador.trim().toLowerCase()]
  );

  const usuario = usuarios[0];

  if (!usuario || !(await verificarSenha(senha, usuario.senha))) {
    throw new AppError(401, 'Login ou senha inválidos.');
  }

  if (usuario.status !== 'Ativo') {
    throw new AppError(403, 'Usuário inativo. Entre em contato com a administração.');
  }

  return res.status(200).json({
    mensagem: 'Login realizado com sucesso.',
    token: gerarToken(usuario.usuario_id),
    usuario: formatarUsuario(usuario)
  });
}

function verPerfil(req, res) {
  return res.status(200).json({ usuario: formatarUsuario(req.usuario) });
}

module.exports = { login, verPerfil };
