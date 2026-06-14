const { executar } = require('../database/conexao');
const acesso = require('../services/acesso.service');
const {
  textoValido,
  dataISOValida,
  normalizarStatus,
  exigirCampos
} = require('../utils/validacoes');
const { formatarData } = require('../utils/mapeadores');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
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

const selectBase = `
  SELECT t.*, d.nome AS disciplina, u.nome AS professor
    FROM Turma t
    JOIN Disciplina d ON d.disciplina_id = t.disciplina_id
    JOIN Professor p ON p.professor_id = t.professor_id
    JOIN Usuario u ON u.usuario_id = p.usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE t.turma_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Turma não encontrada.');
  return linhas[0];
}

async function listarTurmas(req, res) {
  let sql = `${selectBase}`;
  const params = [];

  if (acesso.ehProfessor(req.usuario)) {
    sql += ' WHERE t.professor_id = ?';
    params.push(req.usuario.professor_id);
  } else if (acesso.ehAluno(req.usuario)) {
    sql += ` JOIN Matricula m ON m.turma_id = t.turma_id
             WHERE m.aluno_id = ? AND m.status_matricula IN ('Ativa', 'Concluída')`;
    params.push(req.usuario.aluno_id);
  }

  sql += ' ORDER BY t.periodo_letivo DESC, t.nome';
  const linhas = await executar(sql, params);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function listarMinhasTurmas(req, res) {
  return listarTurmas(req, res);
}

async function buscarTurmaPorId(req, res) {
  const id = obterId(req.params.id);
  await acesso.exigirVisualizacaoTurma(req.usuario, id);
  return res.status(200).json({ dados: formatar(await buscarRegistro(id)) });
}

async function validarRelacionamentos(disciplinaId, professorId) {
  const [disciplinas, professores] = await Promise.all([
    executar('SELECT disciplina_id FROM Disciplina WHERE disciplina_id = ? LIMIT 1', [disciplinaId]),
    executar(
      `SELECT p.professor_id FROM Professor p
        JOIN Usuario u ON u.usuario_id = p.usuario_id
       WHERE p.professor_id = ? AND u.status = 'Ativo' LIMIT 1`,
      [professorId]
    )
  ]);

  if (!disciplinas.length) throw new AppError(400, 'Disciplina não encontrada.');
  if (!professores.length) throw new AppError(400, 'Professor não encontrado ou inativo.');
}

function validarDatas(inicio, termino) {
  if (!dataISOValida(inicio) || !dataISOValida(termino)) {
    throw new AppError(400, 'Datas inválidas. Use YYYY-MM-DD.');
  }
  if (new Date(termino) <= new Date(inicio)) {
    throw new AppError(400, 'A data de término deve ser posterior à data de início.');
  }
}

async function criarTurma(req, res) {
  const faltantes = exigirCampos(req.body, [
    'codigo', 'nome', 'disciplinaId', 'professorId', 'periodoLetivo', 'dataInicio', 'dataTermino'
  ]);
  if (faltantes.length) throw new AppError(400, `Campos obrigatórios: ${faltantes.join(', ')}.`);

  const disciplinaId = obterId(req.body.disciplinaId, 'disciplinaId');
  const professorId = obterId(req.body.professorId, 'professorId');
  validarDatas(req.body.dataInicio, req.body.dataTermino);
  await validarRelacionamentos(disciplinaId, professorId);

  const status = normalizarStatus(req.body.status || 'Aberta', ['Aberta', 'Em andamento', 'Encerrada', 'Cancelada']);
  if (!status) throw new AppError(400, 'Status da turma inválido.');

  const resultado = await executar(
    `INSERT INTO Turma
      (codigo, nome, disciplina_id, professor_id, periodo_letivo, data_inicio, data_termino, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.codigo.trim(), req.body.nome.trim(), disciplinaId, professorId,
      req.body.periodoLetivo.trim(), req.body.dataInicio, req.body.dataTermino, status
    ]
  );

  return res.status(201).json({ mensagem: 'Turma criada com sucesso.', dados: formatar(await buscarRegistro(resultado.insertId)) });
}

async function atualizarTurma(req, res) {
  const id = obterId(req.params.id);
  const atual = await buscarRegistro(id);
  const body = req.body;
  const partes = [];
  const valores = [];

  for (const [api, banco] of [['codigo', 'codigo'], ['nome', 'nome'], ['periodoLetivo', 'periodo_letivo']]) {
    if (Object.hasOwn(body, api)) {
      if (!textoValido(body[api])) throw new AppError(400, `${api} inválido.`);
      partes.push(`${banco} = ?`); valores.push(body[api].trim());
    }
  }

  const disciplinaId = Object.hasOwn(body, 'disciplinaId') ? obterId(body.disciplinaId, 'disciplinaId') : atual.disciplina_id;
  const professorId = Object.hasOwn(body, 'professorId') ? obterId(body.professorId, 'professorId') : atual.professor_id;
  if (Object.hasOwn(body, 'disciplinaId') || Object.hasOwn(body, 'professorId')) {
    await validarRelacionamentos(disciplinaId, professorId);
  }
  if (Object.hasOwn(body, 'disciplinaId')) { partes.push('disciplina_id = ?'); valores.push(disciplinaId); }
  if (Object.hasOwn(body, 'professorId')) { partes.push('professor_id = ?'); valores.push(professorId); }

  const inicio = body.dataInicio || formatarData(atual.data_inicio);
  const termino = body.dataTermino || formatarData(atual.data_termino);
  if (Object.hasOwn(body, 'dataInicio') || Object.hasOwn(body, 'dataTermino')) validarDatas(inicio, termino);
  if (Object.hasOwn(body, 'dataInicio')) { partes.push('data_inicio = ?'); valores.push(body.dataInicio); }
  if (Object.hasOwn(body, 'dataTermino')) { partes.push('data_termino = ?'); valores.push(body.dataTermino); }

  if (Object.hasOwn(body, 'status')) {
    const status = normalizarStatus(body.status, ['Aberta', 'Em andamento', 'Encerrada', 'Cancelada']);
    if (!status) throw new AppError(400, 'Status inválido.');
    partes.push('status = ?'); valores.push(status);
  }

  if (!partes.length) throw new AppError(400, 'Nenhum campo reconhecido para atualização.');
  valores.push(id);
  await executar(`UPDATE Turma SET ${partes.join(', ')} WHERE turma_id = ?`, valores);
  return res.status(200).json({ mensagem: 'Turma atualizada com sucesso.', dados: formatar(await buscarRegistro(id)) });
}

async function removerTurma(req, res) {
  const id = obterId(req.params.id);
  await buscarRegistro(id);
  await executar('DELETE FROM Turma WHERE turma_id = ?', [id]);
  return res.status(204).send();
}

module.exports = { listarTurmas, listarMinhasTurmas, buscarTurmaPorId, criarTurma, atualizarTurma, removerTurma };
