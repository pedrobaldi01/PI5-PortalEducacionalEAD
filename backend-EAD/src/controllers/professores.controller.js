const { memoria, gerarId } = require('../database/memoria');
const { textoValido, existeLogin } = require('../utils/validacoes');

function criarProfessor(req, res) {
  const {
    nome,
    cpf,
    especialidade,
    email,
    telefone,
    login,
    senha
  } = req.body;

  if (
    !textoValido(nome) ||
    !textoValido(cpf) ||
    !textoValido(especialidade) ||
    !textoValido(email) ||
    !textoValido(telefone) ||
    !textoValido(login) ||
    !textoValido(senha)
  ) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: nome, cpf, especialidade, email, telefone, login e senha.'
    });
  }

  if (existeLogin(login.trim(), memoria.usuarios)) {
    return res.status(400).json({
      erro: 'Este login já está em uso.'
    });
  }

  const novoProfessor = {
    id: gerarId('professores'),
    nome: nome.trim(),
    cpf: cpf.trim(),
    especialidade: especialidade.trim(),
    email: email.trim().toLowerCase(),
    telefone: telefone.trim(),
    login: login.trim(),
    criadoEm: new Date().toISOString()
  };

  memoria.professores.push(novoProfessor);

  const novoUsuario = {
    id: gerarId('usuarios'),
    nome: novoProfessor.nome,
    login: login.trim(),
    senha,
    perfil: 'professor',
    origemId: novoProfessor.id
  };

  memoria.usuarios.push(novoUsuario);

  return res.status(201).json({
    mensagem: 'Professor criado com sucesso.',
    dados: novoProfessor
  });
}

function listarProfessores(req, res) {
  return res.status(200).json({
    total: memoria.professores.length,
    dados: memoria.professores
  });
}

module.exports = {
  criarProfessor,
  listarProfessores
};
