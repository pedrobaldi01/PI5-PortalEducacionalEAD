const crypto = require('crypto');

const { memoria } = require('../database/memoria');
const { textoValido, removerSenha } = require('../utils/validacoes');

function login(req, res) {
  const { login, senha } = req.body;

  if (!textoValido(login) || !textoValido(senha)) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: login e senha.'
    });
  }

  const usuario = memoria.usuarios.find((item) => {
    return item.login === login.trim() && item.senha === senha;
  });

  if (!usuario) {
    return res.status(401).json({
      erro: 'Login ou senha inválidos.'
    });
  }

  const token = crypto.randomUUID();

  memoria.sessoes.push({
    token,
    usuarioId: usuario.id,
    criadoEm: new Date().toISOString()
  });

  return res.status(200).json({
    mensagem: 'Login realizado com sucesso.',
    token,
    usuario: removerSenha(usuario)
  });
}

function verPerfil(req, res) {
  return res.status(200).json({
    usuario: removerSenha(req.usuario)
  });
}

module.exports = {
  login,
  verPerfil
};
