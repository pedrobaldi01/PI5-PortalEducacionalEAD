const { executar } = require('../database/conexao');
const AppError = require('../utils/app-error');

function perfil(usuario) {
  return String(usuario?.tipo || '').toLocaleLowerCase('pt-BR');
}

function ehAdministrador(usuario) {
  return perfil(usuario) === 'administrador';
}

function ehCoordenador(usuario) {
  return perfil(usuario) === 'coordenador';
}

function ehProfessor(usuario) {
  return perfil(usuario) === 'professor';
}

function ehAluno(usuario) {
  return perfil(usuario) === 'aluno';
}

function negar() {
  throw new AppError(403, 'Você não possui permissão para acessar este recurso.');
}

async function buscarTurma(turmaId) {
  const linhas = await executar(
    `SELECT t.*, d.nome AS disciplina_nome, u.nome AS professor_nome
       FROM Turma t
       JOIN Disciplina d ON d.disciplina_id = t.disciplina_id
       JOIN Professor p ON p.professor_id = t.professor_id
       JOIN Usuario u ON u.usuario_id = p.usuario_id
      WHERE t.turma_id = ?
      LIMIT 1`,
    [Number(turmaId)]
  );

  if (!linhas[0]) throw new AppError(404, 'Turma não encontrada.');
  return linhas[0];
}

async function professorGerenciaTurma(usuario, turmaId) {
  if (ehAdministrador(usuario)) return true;
  if (!ehProfessor(usuario) || !usuario.professor_id) return false;

  const linhas = await executar(
    'SELECT turma_id FROM Turma WHERE turma_id = ? AND professor_id = ? LIMIT 1',
    [Number(turmaId), Number(usuario.professor_id)]
  );

  return linhas.length > 0;
}

async function exigirProfessorDaTurma(usuario, turmaId, permitirAdmin = true) {
  if (permitirAdmin && ehAdministrador(usuario)) return;
  if (!(await professorGerenciaTurma(usuario, turmaId))) negar();
}

async function alunoMatriculado(usuarioOuAlunoId, turmaId) {
  const alunoId = typeof usuarioOuAlunoId === 'object'
    ? usuarioOuAlunoId.aluno_id
    : usuarioOuAlunoId;

  if (!alunoId) return false;

  const linhas = await executar(
    `SELECT matricula_id
       FROM Matricula
      WHERE aluno_id = ?
        AND turma_id = ?
        AND status_matricula IN ('Ativa', 'Concluída')
      LIMIT 1`,
    [Number(alunoId), Number(turmaId)]
  );

  return linhas.length > 0;
}

async function exigirAlunoMatriculado(usuario, turmaId) {
  if (ehAdministrador(usuario) || ehCoordenador(usuario)) return;
  if (!ehAluno(usuario) || !(await alunoMatriculado(usuario, turmaId))) negar();
}

async function podeVisualizarTurma(usuario, turmaId) {
  if (ehAdministrador(usuario) || ehCoordenador(usuario)) return true;
  if (ehProfessor(usuario)) return professorGerenciaTurma(usuario, turmaId);
  if (ehAluno(usuario)) return alunoMatriculado(usuario, turmaId);
  return false;
}

async function exigirVisualizacaoTurma(usuario, turmaId) {
  if (!(await podeVisualizarTurma(usuario, turmaId))) negar();
}

async function buscarAtividade(atividadeId) {
  const linhas = await executar(
    `SELECT a.*, t.professor_id AS turma_professor_id
       FROM Atividade a
       JOIN Turma t ON t.turma_id = a.turma_id
      WHERE a.atividade_id = ?
      LIMIT 1`,
    [Number(atividadeId)]
  );

  if (!linhas[0]) throw new AppError(404, 'Atividade não encontrada.');
  return linhas[0];
}

async function buscarMaterial(materialId) {
  const linhas = await executar(
    `SELECT m.*, t.professor_id AS turma_professor_id
       FROM MaterialDidatico m
       JOIN Turma t ON t.turma_id = m.turma_id
      WHERE m.material_id = ?
      LIMIT 1`,
    [Number(materialId)]
  );

  if (!linhas[0]) throw new AppError(404, 'Material não encontrado.');
  return linhas[0];
}

module.exports = {
  perfil,
  ehAdministrador,
  ehCoordenador,
  ehProfessor,
  ehAluno,
  negar,
  buscarTurma,
  professorGerenciaTurma,
  exigirProfessorDaTurma,
  alunoMatriculado,
  exigirAlunoMatriculado,
  podeVisualizarTurma,
  exigirVisualizacaoTurma,
  buscarAtividade,
  buscarMaterial
};
