const { memoria, gerarId } = require('../database/memoria');
const { textoValido, numeroPositivo } = require('../utils/validacoes');

function criarDisciplina(req, res) {
  const {
    nome,
    descricao,
    cargaHoraria,
    professorResponsavelId
  } = req.body;

  const professorIdNumero = Number(professorResponsavelId);

  if (
    !textoValido(nome) ||
    !textoValido(descricao) ||
    !numeroPositivo(cargaHoraria) ||
    !numeroPositivo(professorResponsavelId)
  ) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: nome, descricao, cargaHoraria e professorResponsavelId.'
    });
  }

  const professorExiste = memoria.professores.some((professor) => professor.id === professorIdNumero);

  if (!professorExiste) {
    return res.status(400).json({
      erro: 'professorResponsavelId informado não existe.'
    });
  }

  const novaDisciplina = {
    id: gerarId('disciplinas'),
    nome: nome.trim(),
    descricao: descricao.trim(),
    cargaHoraria: Number(cargaHoraria),
    professorResponsavelId: professorIdNumero,
    criadoEm: new Date().toISOString()
  };

  memoria.disciplinas.push(novaDisciplina);

  return res.status(201).json({
    mensagem: 'Disciplina criada com sucesso.',
    dados: novaDisciplina
  });
}

function listarDisciplinas(req, res) {
  return res.status(200).json({
    total: memoria.disciplinas.length,
    dados: memoria.disciplinas
  });
}

module.exports = {
  criarDisciplina,
  listarDisciplinas
};
