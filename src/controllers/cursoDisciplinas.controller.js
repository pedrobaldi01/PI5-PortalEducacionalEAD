const { executar } = require('../database/conexao');
const { obterId } = require('../utils/controller-helpers');
const AppError = require('../utils/app-error');
const { inteiroPositivo } = require('../utils/validacoes');

async function garantirCurso(cursoId) {
  const linhas = await executar('SELECT curso_id FROM Curso WHERE curso_id = ? LIMIT 1', [cursoId]);
  if (!linhas.length) throw new AppError(404, 'Curso não encontrado.');
}

async function garantirDisciplina(disciplinaId) {
  const linhas = await executar('SELECT disciplina_id FROM Disciplina WHERE disciplina_id = ? LIMIT 1', [disciplinaId]);
  if (!linhas.length) throw new AppError(404, 'Disciplina não encontrada.');
}

async function listarPorCurso(req, res) {
  const cursoId = obterId(req.params.cursoId, 'cursoId');
  await garantirCurso(cursoId);
  const linhas = await executar(
    `SELECT cd.curso_disciplina_id AS id, cd.curso_id AS cursoId,
            cd.disciplina_id AS disciplinaId, d.nome AS disciplina,
            cd.sequencia
       FROM Curso_Disciplina cd
       JOIN Disciplina d ON d.disciplina_id = cd.disciplina_id
      WHERE cd.curso_id = ?
      ORDER BY cd.sequencia`,
    [cursoId]
  );
  return res.status(200).json({ total: linhas.length, dados: linhas });
}

async function adicionar(req, res) {
  const cursoId = obterId(req.params.cursoId, 'cursoId');
  const disciplinaId = obterId(req.body.disciplinaId, 'disciplinaId');
  if (!inteiroPositivo(req.body.sequencia)) throw new AppError(400, 'Sequência deve ser um inteiro positivo.');
  await garantirCurso(cursoId);
  await garantirDisciplina(disciplinaId);

  const resultado = await executar(
    'INSERT INTO Curso_Disciplina (curso_id, disciplina_id, sequencia) VALUES (?, ?, ?)',
    [cursoId, disciplinaId, Number(req.body.sequencia)]
  );

  return res.status(201).json({
    mensagem: 'Disciplina vinculada ao curso.',
    dados: { id: resultado.insertId, cursoId, disciplinaId, sequencia: Number(req.body.sequencia) }
  });
}

async function atualizarSequencia(req, res) {
  const cursoId = obterId(req.params.cursoId, 'cursoId');
  const disciplinaId = obterId(req.params.disciplinaId, 'disciplinaId');
  if (!inteiroPositivo(req.body.sequencia)) throw new AppError(400, 'Sequência deve ser um inteiro positivo.');

  const resultado = await executar(
    `UPDATE Curso_Disciplina SET sequencia = ?
      WHERE curso_id = ? AND disciplina_id = ?`,
    [Number(req.body.sequencia), cursoId, disciplinaId]
  );
  if (!resultado.affectedRows) throw new AppError(404, 'Vínculo curso-disciplina não encontrado.');

  return res.status(200).json({ mensagem: 'Sequência atualizada com sucesso.' });
}

async function remover(req, res) {
  const cursoId = obterId(req.params.cursoId, 'cursoId');
  const disciplinaId = obterId(req.params.disciplinaId, 'disciplinaId');
  const resultado = await executar(
    'DELETE FROM Curso_Disciplina WHERE curso_id = ? AND disciplina_id = ?',
    [cursoId, disciplinaId]
  );
  if (!resultado.affectedRows) throw new AppError(404, 'Vínculo curso-disciplina não encontrado.');
  return res.status(204).send();
}

module.exports = { listarPorCurso, adicionar, atualizarSequencia, remover };
