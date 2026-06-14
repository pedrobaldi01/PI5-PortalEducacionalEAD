const { executar } = require('../database/conexao');
const acesso = require('../services/acesso.service');
const { textoValido, dataHoraValida, numeroNaoNegativo, normalizarStatus } = require('../utils/validacoes');
const { formatarDataHora } = require('../utils/mapeadores');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
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

const selectBase = `
  SELECT a.*, t.nome AS turma, u.nome AS professor
    FROM Atividade a
    JOIN Turma t ON t.turma_id = a.turma_id
    JOIN Professor p ON p.professor_id = a.professor_id
    JOIN Usuario u ON u.usuario_id = p.usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE a.atividade_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Atividade não encontrada.');
  return linhas[0];
}

async function listarAtividades(req, res) {
  let sql = selectBase;
  const params = [];
  if (acesso.ehProfessor(req.usuario)) {
    sql += ' WHERE t.professor_id = ?'; params.push(req.usuario.professor_id);
  } else if (acesso.ehAluno(req.usuario)) {
    sql += ` JOIN Matricula m ON m.turma_id = t.turma_id
             WHERE m.aluno_id = ? AND m.status_matricula IN ('Ativa', 'Concluída')`;
    params.push(req.usuario.aluno_id);
  }
  sql += ' ORDER BY a.data_entrega, a.titulo';
  const linhas = await executar(sql, params);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function listarPorTurma(req, res) {
  const turmaId = obterId(req.params.turmaId, 'turmaId');
  await acesso.exigirVisualizacaoTurma(req.usuario, turmaId);
  const linhas = await executar(`${selectBase} WHERE a.turma_id = ? ORDER BY a.data_entrega`, [turmaId]);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function buscarAtividadePorId(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  await acesso.exigirVisualizacaoTurma(req.usuario, registro.turma_id);
  return res.status(200).json({ dados: formatar(registro) });
}

function validarNotaMaxima(valor) {
  const numero = Number(valor);
  if (!numeroNaoNegativo(numero) || numero <= 0) throw new AppError(400, 'Nota máxima deve ser maior que zero.');
  return numero;
}

async function criarAtividade(req, res) {
  if (!textoValido(req.body.titulo)) throw new AppError(400, 'Título é obrigatório.');
  if (!dataHoraValida(req.body.dataEntrega)) throw new AppError(400, 'Data de entrega inválida.');
  if (new Date(req.body.dataEntrega) <= new Date()) throw new AppError(400, 'A data de entrega precisa estar no futuro.');

  const turmaId = obterId(req.body.turmaId, 'turmaId');
  await acesso.exigirProfessorDaTurma(req.usuario, turmaId, true);
  const turma = await acesso.buscarTurma(turmaId);
  const professorId = turma.professor_id;
  const status = normalizarStatus(req.body.status || 'Aberta', ['Aberta', 'Encerrada', 'Cancelada']);
  if (!status) throw new AppError(400, 'Status inválido.');

  const resultado = await executar(
    `INSERT INTO Atividade
      (titulo, descricao, data_entrega, nota_maxima, turma_id, professor_id, avaliativa, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.titulo.trim(), textoValido(req.body.descricao) ? req.body.descricao.trim() : null,
      new Date(req.body.dataEntrega), validarNotaMaxima(req.body.notaMaxima ?? 10), turmaId, professorId,
      req.body.avaliativa === false ? 0 : 1, status
    ]
  );

  return res.status(201).json({ mensagem: 'Atividade criada com sucesso.', dados: formatar(await buscarRegistro(resultado.insertId)) });
}

async function atualizarAtividade(req, res) {
  const id = obterId(req.params.id);
  const atual = await buscarRegistro(id);
  await acesso.exigirProfessorDaTurma(req.usuario, atual.turma_id, true);
  const partes = [];
  const valores = [];

  if (Object.hasOwn(req.body, 'titulo')) {
    if (!textoValido(req.body.titulo)) throw new AppError(400, 'Título inválido.');
    partes.push('titulo = ?'); valores.push(req.body.titulo.trim());
  }
  if (Object.hasOwn(req.body, 'descricao')) {
    partes.push('descricao = ?'); valores.push(textoValido(req.body.descricao) ? req.body.descricao.trim() : null);
  }
  if (Object.hasOwn(req.body, 'dataEntrega')) {
    if (!dataHoraValida(req.body.dataEntrega)) throw new AppError(400, 'Data de entrega inválida.');
    partes.push('data_entrega = ?'); valores.push(new Date(req.body.dataEntrega));
  }
  if (Object.hasOwn(req.body, 'notaMaxima')) {
    partes.push('nota_maxima = ?'); valores.push(validarNotaMaxima(req.body.notaMaxima));
  }
  if (Object.hasOwn(req.body, 'avaliativa')) {
    partes.push('avaliativa = ?'); valores.push(req.body.avaliativa ? 1 : 0);
  }
  if (Object.hasOwn(req.body, 'status')) {
    const status = normalizarStatus(req.body.status, ['Aberta', 'Encerrada', 'Cancelada']);
    if (!status) throw new AppError(400, 'Status inválido.');
    partes.push('status = ?'); valores.push(status);
  }

  if (!partes.length) throw new AppError(400, 'Nenhum campo reconhecido para atualização.');
  valores.push(id);
  await executar(`UPDATE Atividade SET ${partes.join(', ')} WHERE atividade_id = ?`, valores);
  return res.status(200).json({ mensagem: 'Atividade atualizada com sucesso.', dados: formatar(await buscarRegistro(id)) });
}

async function removerAtividade(req, res) {
  const id = obterId(req.params.id);
  const atual = await buscarRegistro(id);
  await acesso.exigirProfessorDaTurma(req.usuario, atual.turma_id, true);
  await executar('DELETE FROM Atividade WHERE atividade_id = ?', [id]);
  return res.status(204).send();
}

module.exports = { listarAtividades, listarPorTurma, buscarAtividadePorId, criarAtividade, atualizarAtividade, removerAtividade };
