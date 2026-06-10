const { executar } = require('../database/conexao');
const { formatarUsuario } = require('../utils/mapeadores');
const { verificarSenha } = require('../utils/senhas');
const { gerarToken } = require('../utils/tokens');
const { textoValido } = require('../utils/validacoes');

async function login(req, res, next) {
  try {
    const identificador = req.body.login || req.body.email;
    const { senha } = req.body;

    if (!textoValido(identificador) || !textoValido(senha)) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: login ou email, e senha.'
      });
    }

    const usuarios = await executar(
      `SELECT usuario_id, nome, cpf, data_nascimento, email, telefone,
              endereco, login, senha, tipo, status, data_cadastro
         FROM Usuario
        WHERE login = ? OR email = ?
        LIMIT 1`,
      [identificador.trim(), identificador.trim().toLowerCase()]
    );

    const usuario = usuarios[0];

    if (!usuario || !verificarSenha(senha, usuario.senha)) {
      return res.status(401).json({
        erro: 'Login ou senha inválidos.'
      });
    }

    if (usuario.status !== 'Ativo') {
      return res.status(403).json({
        erro: 'Usuário inativo. Entre em contato com a administração.'
      });
    }

    const token = gerarToken(usuario.usuario_id);

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: formatarUsuario(usuario)
    });
  } catch (erro) {
    return next(erro);
  }
}

function verPerfil(req, res) {
  return res.status(200).json({
    usuario: formatarUsuario(req.usuario)
  });
}

module.exports = {
  login,
  verPerfil
};
