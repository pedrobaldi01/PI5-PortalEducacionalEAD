const { executar } = require('../database/conexao');
const acesso = require('../services/acesso.service');
const { numeroNaoNegativo, textoValido } = require('../utils/validacoes');
const { formatarDataHora } = require('../utils/mapeadores');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
  return {
    id: linha.nota_id,
    alunoId: linha.aluno_id,
    aluno: linha.aluno,
    atividadeId: linha.atividade_id,
    atividade: linha.atividade,
    nota: Number(linha.nota),
    notaMaxima: Number(linha.nota_maxima),
    feedback: linha.feedback,
    dataCorrecao: formatarDataHora(linha.data_correcao),
    professorResponsavelId: linha.professor_responsavel_id,
    professorResponsavel: linha.professor_responsavel
  };
}

const selectBase = `
  SELECT n.*, aluno_usuario.nome AS aluno, atv.titulo AS atividade,
         atv.nota_maxima, atv.turma_id,
         professor_usuario.nome AS professor_responsavel
    FROM Nota n
    JOIN Aluno a ON a.aluno_id = n.aluno_id
    JOIN Usuario aluno_usuario ON aluno_usuario.usuario_id = a.usuario_id
    JOIN Atividade atv ON atv.atividade_id = n.atividade_id
    JOIN Professor p ON p.professor_id = n.professor_responsavel_id
    JOIN Usuario professor_usuario ON professor_usuario.usuario_id = p.usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE n.nota_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Nota não encontrada.');
  return linhas[0];
}

async function listarNotas(req, res) {
  let sql = selectBase;
  const params = [];
  if (acesso.ehAluno(req.usuario)) {
    sql += ' WHERE n.aluno_id = ?'; params.push(req.usuario.aluno_id);
  } else if (acesso.ehProfessor(req.usuario)) {
    sql += ' WHERE atv.professor_id = ?'; params.push(req.usuario.professor_id);
  }
  sql += ' ORDER BY aluno_usuario.nome, atv.titulo';
  const linhas = await executar(sql, params);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function listarMinhas(req, res) {
  if (!acesso.ehAluno(req.usuario)) acesso.negar();
  return listarNotas(req, res);
}

async function listarPorAtividade(req, res) {
  const atividadeId = obterId(req.params.atividadeId, 'atividadeId');
  const atividade = await acesso.buscarAtividade(atividadeId);
  await acesso.exigirProfessorDaTurma(req.usuario, atividade.turma_id, true);
  const linhas = await executar(`${selectBase} WHERE n.atividade_id = ? ORDER BY aluno_usuario.nome`, [atividadeId]);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function buscarNotaPorId(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  if (acesso.ehAluno(req.usuario) && Number(registro.aluno_id) !== Number(req.usuario.aluno_id)) acesso.negar();
  if (acesso.ehProfessor(req.usuario)) await acesso.exigirProfessorDaTurma(req.usuario, registro.turma_id, false);
  return res.status(200).json({ dados: formatar(registro) });
}

async function salvarNota(req, res, idExistente = null) {
  const atividadeId = obterId(req.body.atividadeId, 'atividadeId');
  const alunoId = obterId(req.body.alunoId, 'alunoId');
  const nota = Number(req.body.nota);
  if (!numeroNaoNegativo(nota)) throw new AppError(400, 'Nota inválida.');

  const atividade = await acesso.buscarAtividade(atividadeId);
  await acesso.exigirProfessorDaTurma(req.usuario, atividade.turma_id, true);
  if (nota > Number(atividade.nota_maxima)) {
    throw new AppError(400, `A nota não pode ultrapassar ${Number(atividade.nota_maxima)}.`);
  }

  const matricula = await acesso.alunoMatriculado(alunoId, atividade.turma_id);
  if (!matricula) throw new AppError(400, 'O aluno não está matriculado na turma da atividade.');

  const professorId = acesso.ehProfessor(req.usuario)
    ? req.usuario.professor_id
    : atividade.professor_id;
  const feedback = textoValido(req.body.feedback) ? req.body.feedback.trim() : null;

  if (idExistente) {
    await executar(
      `UPDATE Nota SET aluno_id = ?, atividade_id = ?, nota = ?, feedback = ?,
                       professor_responsavel_id = ?, data_correcao = CURRENT_TIMESTAMP
        WHERE nota_id = ?`,
      [alunoId, atividadeId, nota, feedback, professorId, idExistente]
    );
    return { status: 200, id: idExistente, mensagem: 'Nota atualizada com sucesso.' };
  }

  const existente = await executar(
    'SELECT nota_id FROM Nota WHERE aluno_id = ? AND atividade_id = ? LIMIT 1',
    [alunoId, atividadeId]
  );

  if (existente.length) {
    await executar(
      `UPDATE Nota SET nota = ?, feedback = ?, professor_responsavel_id = ?,
                       data_correcao = CURRENT_TIMESTAMP
        WHERE nota_id = ?`,
      [nota, feedback, professorId, existente[0].nota_id]
    );
    return { status: 200, id: existente[0].nota_id, mensagem: 'Nota atualizada com sucesso.' };
  }

  const resultado = await executar(
    `INSERT INTO Nota
      (aluno_id, atividade_id, nota, feedback, professor_responsavel_id)
     VALUES (?, ?, ?, ?, ?)`,
    [alunoId, atividadeId, nota, feedback, professorId]
  );
  return { status: 201, id: resultado.insertId, mensagem: 'Nota lançada com sucesso.' };
}

async function lancarNota(req, res) {
  const resultado = await salvarNota(req, res);
  return res.status(resultado.status).json({ mensagem: resultado.mensagem, dados: formatar(await buscarRegistro(resultado.id)) });
}

async function atualizarNota(req, res) {
  const id = obterId(req.params.id);
  const atual = await buscarRegistro(id);
  req.body.atividadeId = req.body.atividadeId || atual.atividade_id;
  req.body.alunoId = req.body.alunoId || atual.aluno_id;
  req.body.nota = Object.hasOwn(req.body, 'nota') ? req.body.nota : atual.nota;
  const resultado = await salvarNota(req, res, id);
  return res.status(200).json({ mensagem: resultado.mensagem, dados: formatar(await buscarRegistro(id)) });
}

module.exports = { listarNotas, listarMinhas, listarPorAtividade, buscarNotaPorId, lancarNota, atualizarNota };
