const { executar } = require('../database/conexao');
const { formatarDataHora } = require('../utils/mapeadores');
const { numeroPositivo, textoValido } = require('../utils/validacoes');

const STATUS_ATIVIDADE = {
  aberta: 'Aberta',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada'
};

function normalizarStatus(status) {
  if (!textoValido(status)) {
    return 'Aberta';
  }

  return STATUS_ATIVIDADE[status.trim().toLowerCase()] || null;
}

function normalizarBooleano(valor, padrao) {
  if (valor === undefined || valor === null || valor === '') {
    return padrao;
  }

  if (typeof valor === 'boolean') {
    return valor;
  }

  return String(valor).trim().toLowerCase() !== 'false';
}

function formatarAtividade(linha) {
  return {
    id: linha.atividade_id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    dataCriacao: formatarDataHora(linha.data_criacao),
    dataEntrega: formatarDataHora(linha.data_entrega),
    notaMaxima: Number(linha.nota_maxima),
    turmaId: linha.turma_id,
    turma: linha.turma,
    professorId: linha.professor_id,
    professor: linha.professor,
    avaliativa: Boolean(linha.avaliativa),
    status: linha.status
  };
}

async function criarAtividade(req, res, next) {
  try {
    const {
      titulo,
      descricao,
      dataEntrega,
      notaMaxima,
      turmaId,
      professorId,
      avaliativa,
      status
    } = req.body;

    if (!textoValido(titulo) || !numeroPositivo(turmaId) || !numeroPositivo(professorId)) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: titulo, turmaId e professorId.'
      });
    }

    const notaMaximaBanco = notaMaxima === undefined ? 10 : Number(notaMaxima);

    if (Number.isNaN(notaMaximaBanco) || notaMaximaBanco <= 0) {
      return res.status(400).json({
        erro: 'notaMaxima deve ser maior que zero.'
      });
    }

    const statusBanco = normalizarStatus(status);

    if (!statusBanco) {
      return res.status(400).json({
        erro: 'Status inválido. Use Aberta, Encerrada ou Cancelada.'
      });
    }

    const turmas = await executar(
      'SELECT turma_id FROM Turma WHERE turma_id = ? LIMIT 1',
      [Number(turmaId)]
    );
    const professores = await executar(
      'SELECT professor_id FROM Professor WHERE professor_id = ? LIMIT 1',
      [Number(professorId)]
    );

    if (turmas.length === 0 || professores.length === 0) {
      return res.status(400).json({
        erro: 'turmaId ou professorId informado não existe.'
      });
    }

    const resultado = await executar(
      `INSERT INTO Atividade
        (titulo, descricao, data_entrega, nota_maxima, turma_id, professor_id, avaliativa, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo.trim(),
        textoValido(descricao) ? descricao.trim() : null,
        textoValido(dataEntrega) ? dataEntrega.trim() : null,
        notaMaximaBanco,
        Number(turmaId),
        Number(professorId),
        normalizarBooleano(avaliativa, true),
        statusBanco
      ]
    );

    return res.status(201).json({
      mensagem: 'Atividade criada com sucesso.',
      dados: {
        id: resultado.insertId,
        titulo: titulo.trim(),
        descricao: textoValido(descricao) ? descricao.trim() : null,
        dataEntrega: textoValido(dataEntrega) ? dataEntrega.trim() : null,
        notaMaxima: notaMaximaBanco,
        turmaId: Number(turmaId),
        professorId: Number(professorId),
        avaliativa: normalizarBooleano(avaliativa, true),
        status: statusBanco
      }
    });
  } catch (erro) {
    return next(erro);
  }
}

async function listarAtividades(req, res, next) {
  try {
    const atividades = await executar(
      `SELECT a.atividade_id, a.titulo, a.descricao, a.data_criacao,
              a.data_entrega, a.nota_maxima, a.turma_id, t.nome AS turma,
              a.professor_id, u.nome AS professor, a.avaliativa, a.status
         FROM Atividade a
         JOIN Turma t ON t.turma_id = a.turma_id
         JOIN Professor p ON p.professor_id = a.professor_id
         JOIN Usuario u ON u.usuario_id = p.usuario_id
        ORDER BY a.data_entrega IS NULL, a.data_entrega, a.titulo`
    );

    return res.status(200).json({
      total: atividades.length,
      dados: atividades.map(formatarAtividade)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarAtividade,
  listarAtividades
};
