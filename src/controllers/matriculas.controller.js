const { executar } = require('../database/conexao');
const acesso = require('../services/acesso.service');
const { formatarData } = require('../utils/mapeadores');
const { normalizarStatus } = require('../utils/validacoes');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
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

const selectBase = `
  SELECT m.*, u.nome AS aluno, t.nome AS turma
    FROM Matricula m
    JOIN Aluno a ON a.aluno_id = m.aluno_id
    JOIN Usuario u ON u.usuario_id = a.usuario_id
    JOIN Turma t ON t.turma_id = m.turma_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE m.matricula_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Matrícula não encontrada.');
  return linhas[0];
}

async function listarMatriculas(req, res) {
  let sql = selectBase;
  const params = [];

  if (acesso.ehAluno(req.usuario)) {
    sql += ' WHERE m.aluno_id = ?'; params.push(req.usuario.aluno_id);
  } else if (acesso.ehProfessor(req.usuario)) {
    sql += ' WHERE t.professor_id = ?'; params.push(req.usuario.professor_id);
  }

  sql += ' ORDER BY m.data_matricula DESC';
  const linhas = await executar(sql, params);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function listarMinhas(req, res) {
  if (!acesso.ehAluno(req.usuario)) acesso.negar();
  return listarMatriculas(req, res);
}

async function buscarMatriculaPorId(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  if (acesso.ehAluno(req.usuario) && Number(registro.aluno_id) !== Number(req.usuario.aluno_id)) acesso.negar();
  if (acesso.ehProfessor(req.usuario) && !(await acesso.professorGerenciaTurma(req.usuario, registro.turma_id))) acesso.negar();
  return res.status(200).json({ dados: formatar(registro) });
}

async function criarMatricula(req, res) {
  const alunoId = obterId(req.body.alunoId, 'alunoId');
  const turmaId = obterId(req.body.turmaId, 'turmaId');
  const status = normalizarStatus(req.body.status || 'Ativa', ['Ativa', 'Trancada', 'Cancelada', 'Concluída']);
  if (!status) throw new AppError(400, 'Status da matrícula inválido.');

  const [alunos, turmas] = await Promise.all([
    executar("SELECT a.aluno_id FROM Aluno a JOIN Usuario u ON u.usuario_id = a.usuario_id WHERE a.aluno_id = ? AND u.status = 'Ativo' LIMIT 1", [alunoId]),
    executar('SELECT turma_id FROM Turma WHERE turma_id = ? LIMIT 1', [turmaId])
  ]);
  if (!alunos.length) throw new AppError(400, 'Aluno não encontrado ou inativo.');
  if (!turmas.length) throw new AppError(400, 'Turma não encontrada.');

  const resultado = await executar(
    'INSERT INTO Matricula (aluno_id, turma_id, status_matricula) VALUES (?, ?, ?)',
    [alunoId, turmaId, status]
  );
  return res.status(201).json({ mensagem: 'Matrícula criada com sucesso.', dados: formatar(await buscarRegistro(resultado.insertId)) });
}

async function alterarStatus(req, res) {
  const id = obterId(req.params.id);
  await buscarRegistro(id);
  const status = normalizarStatus(req.body.status, ['Ativa', 'Trancada', 'Cancelada', 'Concluída']);
  if (!status) throw new AppError(400, 'Status da matrícula inválido.');
  await executar('UPDATE Matricula SET status_matricula = ? WHERE matricula_id = ?', [status, id]);
  return res.status(200).json({ mensagem: 'Status da matrícula atualizado.', dados: formatar(await buscarRegistro(id)) });
}

async function removerMatricula(req, res) {
  const id = obterId(req.params.id);
  await buscarRegistro(id);
  await executar('DELETE FROM Matricula WHERE matricula_id = ?', [id]);
  return res.status(204).send();
}

async function listarAlunosDaTurma(req, res) {
  const turmaId = obterId(req.params.turmaId, 'turmaId');
  await acesso.exigirVisualizacaoTurma(req.usuario, turmaId);
  const linhas = await executar(
    `${selectBase} WHERE m.turma_id = ? ORDER BY u.nome`,
    [turmaId]
  );
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

module.exports = {
  listarMatriculas,
  listarMinhas,
  buscarMatriculaPorId,
  criarMatricula,
  alterarStatus,
  removerMatricula,
  listarAlunosDaTurma
};
