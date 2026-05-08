const { memoria, gerarId } = require('../database/memoria');
const { textoValido, existeLogin } = require('../utils/validacoes');

function criarAluno(req, res) {
  const {
    nome,
    cpf,
    dataNascimento,
    email,
    telefone,
    endereco,
    login,
    senha
  } = req.body;

  if (
    !textoValido(nome) ||
    !textoValido(cpf) ||
    !textoValido(dataNascimento) ||
    !textoValido(email) ||
    !textoValido(telefone) ||
    !textoValido(endereco) ||
    !textoValido(login) ||
    !textoValido(senha)
  ) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: nome, cpf, dataNascimento, email, telefone, endereco, login e senha.'
    });
  }

  if (existeLogin(login.trim(), memoria.usuarios)) {
    return res.status(400).json({
      erro: 'Este login já está em uso.'
    });
  }

  const novoAluno = {
    id: gerarId('alunos'),
    nome: nome.trim(),
    cpf: cpf.trim(),
    dataNascimento: dataNascimento.trim(),
    email: email.trim().toLowerCase(),
    telefone: telefone.trim(),
    endereco: endereco.trim(),
    login: login.trim(),
    criadoEm: new Date().toISOString()
  };

  memoria.alunos.push(novoAluno);

  const novoUsuario = {
    id: gerarId('usuarios'),
    nome: novoAluno.nome,
    login: login.trim(),
    senha,
    perfil: 'aluno',
    origemId: novoAluno.id
  };

  memoria.usuarios.push(novoUsuario);

  return res.status(201).json({
    mensagem: 'Aluno criado com sucesso.',
    dados: novoAluno
  });
}

function listarAlunos(req, res) {
  return res.status(200).json({
    total: memoria.alunos.length,
    dados: memoria.alunos
  });
}

module.exports = {
  criarAluno,
  listarAlunos
};
