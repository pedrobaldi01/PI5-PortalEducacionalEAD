const { executar } = require('../database/conexao');
const { formatarData } = require('../utils/mapeadores');
const { numeroPositivo } = require('../utils/validacoes');

const STATUS_MATRICULA = {
  ativa: 'Ativa',
  trancada: 'Trancada',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
  'concluída': 'Concluída'
};

function normalizarStatus(status) {
  if (!status) {
    return 'Ativa';
  }

  return STATUS_MATRICULA[String(status).trim().toLowerCase()] || null;
}

function formatarMatricula(linha) {
  return {
    id: linha.matricula_id,
    alunoId: linha.aluno_id,
    aluno: linha.aluno,
    turmaId: linha.turma_id,
    turma: linha.turma,
    dataMatricula: formatarData(linha.data_matricula),
    status: linha.status_matricula
  };
}

async function criarMatricula(req, res, next) {
  try {
    const { alunoId, turmaId, dataMatricula, status } = req.body;

    if (!numeroPositivo(alunoId) || !numeroPositivo(turmaId)) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: alunoId e turmaId.'
      });
    }

    const statusBanco = normalizarStatus(status);

    if (!statusBanco) {
      return res.status(400).json({
        erro: 'Status inválido. Use Ativa, Trancada, Cancelada ou Concluída.'
      });
    }

    const alunos = await executar(
      'SELECT aluno_id FROM Aluno WHERE aluno_id = ? LIMIT 1',
      [Number(alunoId)]
    );
    const turmas = await executar(
      'SELECT turma_id FROM Turma WHERE turma_id = ? LIMIT 1',
      [Number(turmaId)]
    );

    if (alunos.length === 0 || turmas.length === 0) {
      return res.status(400).json({
        erro: 'alunoId ou turmaId informado não existe.'
      });
    }

    const resultado = await executar(
      `INSERT INTO Matricula (aluno_id, turma_id, data_matricula, status_matricula)
       VALUES (?, ?, COALESCE(?, CURRENT_DATE), ?)`,
      [Number(alunoId), Number(turmaId), dataMatricula || null, statusBanco]
    );

    return res.status(201).json({
      mensagem: 'Matrícula criada com sucesso.',
      dados: {
        id: resultado.insertId,
        alunoId: Number(alunoId),
        turmaId: Number(turmaId),
        dataMatricula: dataMatricula || null,
        status: statusBanco
      }
    });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        erro: 'Este aluno já está matriculado nesta turma.'
      });
    }

    return next(erro);
  }
}

async function listarMatriculas(req, res, next) {
  try {
    const matriculas = await executar(
      `SELECT m.matricula_id, m.aluno_id, aluno_usuario.nome AS aluno,
              m.turma_id, t.nome AS turma, m.data_matricula, m.status_matricula
         FROM Matricula m
         JOIN Aluno a ON a.aluno_id = m.aluno_id
         JOIN Usuario aluno_usuario ON aluno_usuario.usuario_id = a.usuario_id
         JOIN Turma t ON t.turma_id = m.turma_id
        ORDER BY t.nome, aluno_usuario.nome`
    );

    return res.status(200).json({
      total: matriculas.length,
      dados: matriculas.map(formatarMatricula)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarMatricula,
  listarMatriculas
};
