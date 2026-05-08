const { memoria, gerarId } = require('../database/memoria');
const { textoValido, numeroPositivo } = require('../utils/validacoes');

function criarTurma(req, res) {
  const {
    codigo,
    nome,
    disciplinaId,
    professorId,
    periodoLetivo,
    dataInicio,
    dataTermino
  } = req.body;

  const disciplinaIdNumero = Number(disciplinaId);
  const professorIdNumero = Number(professorId);

  if (
    !textoValido(codigo) ||
    !textoValido(nome) ||
    !numeroPositivo(disciplinaId) ||
    !numeroPositivo(professorId) ||
    !textoValido(periodoLetivo) ||
    !textoValido(dataInicio) ||
    !textoValido(dataTermino)
  ) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: codigo, nome, disciplinaId, professorId, periodoLetivo, dataInicio e dataTermino.'
    });
  }

  const disciplinaExiste = memoria.disciplinas.some((disciplina) => disciplina.id === disciplinaIdNumero);
  const professorExiste = memoria.professores.some((professor) => professor.id === professorIdNumero);

  if (!disciplinaExiste) {
    return res.status(400).json({
      erro: 'disciplinaId informado não existe.'
    });
  }

  if (!professorExiste) {
    return res.status(400).json({
      erro: 'professorId informado não existe.'
    });
  }

  const novaTurma = {
    id: gerarId('turmas'),
    codigo: codigo.trim(),
    nome: nome.trim(),
    disciplinaId: disciplinaIdNumero,
    professorId: professorIdNumero,
    periodoLetivo: periodoLetivo.trim(),
    dataInicio: dataInicio.trim(),
    dataTermino: dataTermino.trim(),
    criadoEm: new Date().toISOString()
  };

  memoria.turmas.push(novaTurma);

  return res.status(201).json({
    mensagem: 'Turma criada com sucesso.',
    dados: novaTurma
  });
}

function listarTurmas(req, res) {
  return res.status(200).json({
    total: memoria.turmas.length,
    dados: memoria.turmas
  });
}

module.exports = {
  criarTurma,
  listarTurmas
};
