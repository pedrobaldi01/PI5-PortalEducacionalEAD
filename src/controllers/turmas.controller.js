const { executar } = require('../database/conexao');
const { formatarData } = require('../utils/mapeadores');
const { textoValido, numeroPositivo } = require('../utils/validacoes');

const STATUS_TURMA = {
  aberta: 'Aberta',
  'em andamento': 'Em andamento',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada'
};

function normalizarStatus(status) {
  if (!textoValido(status)) {
    return 'Aberta';
  }

  return STATUS_TURMA[status.trim().toLowerCase()] || null;
}

function formatarTurma(linha) {
  return {
    id: linha.turma_id,
    codigo: linha.codigo,
    nome: linha.nome,
    disciplinaId: linha.disciplina_id,
    disciplina: linha.disciplina,
    professorId: linha.professor_id,
    professor: linha.professor,
    periodoLetivo: linha.periodo_letivo,
    dataInicio: formatarData(linha.data_inicio),
    dataTermino: formatarData(linha.data_termino),
    status: linha.status
  };
}

function dataInconsistente(dataInicio, dataTermino) {
  const inicio = new Date(`${dataInicio}T00:00:00`);
  const termino = new Date(`${dataTermino}T00:00:00`);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(termino.getTime())) {
    return true;
  }

  return termino < inicio;
}

async function criarTurma(req, res, next) {
  try {
    const {
      codigo,
      nome,
      disciplinaId,
      professorId,
      periodoLetivo,
      dataInicio,
      dataTermino,
      status
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

    if (dataInconsistente(dataInicio.trim(), dataTermino.trim())) {
      return res.status(400).json({
        erro: 'Datas inválidas. dataTermino deve ser maior ou igual a dataInicio.'
      });
    }

    const statusBanco = normalizarStatus(status);

    if (!statusBanco) {
      return res.status(400).json({
        erro: 'Status inválido. Use Aberta, Em andamento, Encerrada ou Cancelada.'
      });
    }

    const turmasDuplicadas = await executar(
      'SELECT turma_id FROM Turma WHERE codigo = ? LIMIT 1',
      [codigo.trim()]
    );

    if (turmasDuplicadas.length > 0) {
      return res.status(400).json({
        erro: 'Já existe turma com este código.'
      });
    }

    const disciplinas = await executar(
      'SELECT disciplina_id FROM Disciplina WHERE disciplina_id = ? LIMIT 1',
      [disciplinaIdNumero]
    );
    const professores = await executar(
      'SELECT professor_id FROM Professor WHERE professor_id = ? LIMIT 1',
      [professorIdNumero]
    );

    if (disciplinas.length === 0) {
      return res.status(400).json({
        erro: 'disciplinaId informado não existe.'
      });
    }

    if (professores.length === 0) {
      return res.status(400).json({
        erro: 'professorId informado não existe.'
      });
    }

    const resultado = await executar(
      `INSERT INTO Turma
        (codigo, nome, disciplina_id, professor_id, periodo_letivo, data_inicio, data_termino, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo.trim(),
        nome.trim(),
        disciplinaIdNumero,
        professorIdNumero,
        periodoLetivo.trim(),
        dataInicio.trim(),
        dataTermino.trim(),
        statusBanco
      ]
    );

    return res.status(201).json({
      mensagem: 'Turma criada com sucesso.',
      dados: {
        id: resultado.insertId,
        codigo: codigo.trim(),
        nome: nome.trim(),
        disciplinaId: disciplinaIdNumero,
        professorId: professorIdNumero,
        periodoLetivo: periodoLetivo.trim(),
        dataInicio: dataInicio.trim(),
        dataTermino: dataTermino.trim(),
        status: statusBanco
      }
    });
  } catch (erro) {
    return next(erro);
  }
}

async function listarTurmas(req, res, next) {
  try {
    const turmas = await executar(
      `SELECT t.turma_id, t.codigo, t.nome, t.disciplina_id, d.nome AS disciplina,
              t.professor_id, u.nome AS professor, t.periodo_letivo,
              t.data_inicio, t.data_termino, t.status
         FROM Turma t
         JOIN Disciplina d ON d.disciplina_id = t.disciplina_id
         JOIN Professor p ON p.professor_id = t.professor_id
         JOIN Usuario u ON u.usuario_id = p.usuario_id
        ORDER BY t.periodo_letivo DESC, t.nome`
    );

    return res.status(200).json({
      total: turmas.length,
      dados: turmas.map(formatarTurma)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarTurma,
  listarTurmas
};
