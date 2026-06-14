const { executar } = require('../database/conexao');
const { textoValido, inteiroPositivo, exigirCampos } = require('../utils/validacoes');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
  return {
    id: linha.disciplina_id,
    nome: linha.nome,
    descricao: linha.descricao,
    cargaHoraria: linha.carga_horaria,
    professorResponsavelId: linha.professor_responsavel_id,
    professorResponsavel: linha.professor_responsavel
  };
}

const selectBase = `
  SELECT d.*, u.nome AS professor_responsavel
    FROM Disciplina d
    JOIN Professor p ON p.professor_id = d.professor_responsavel_id
    JOIN Usuario u ON u.usuario_id = p.usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE d.disciplina_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Disciplina não encontrada.');
  return linhas[0];
}

async function validarProfessor(id) {
  const linhas = await executar(
    `SELECT p.professor_id
       FROM Professor p
       JOIN Usuario u ON u.usuario_id = p.usuario_id
      WHERE p.professor_id = ? AND u.status = 'Ativo'
      LIMIT 1`,
    [id]
  );
  if (!linhas.length) throw new AppError(400, 'Professor responsável não existe ou está inativo.');
}

async function listarDisciplinas(_req, res) {
  const linhas = await executar(`${selectBase} ORDER BY d.nome`);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function buscarDisciplinaPorId(req, res) {
  return res.status(200).json({ dados: formatar(await buscarRegistro(obterId(req.params.id))) });
}

async function criarDisciplina(req, res) {
  const faltantes = exigirCampos(req.body, ['nome', 'descricao', 'cargaHoraria', 'professorResponsavelId']);
  if (faltantes.length) throw new AppError(400, `Campos obrigatórios: ${faltantes.join(', ')}.`);
  if (!inteiroPositivo(req.body.cargaHoraria)) throw new AppError(400, 'Carga horária inválida.');
  const professorId = obterId(req.body.professorResponsavelId, 'professorResponsavelId');
  await validarProfessor(professorId);

  const resultado = await executar(
    `INSERT INTO Disciplina (nome, descricao, carga_horaria, professor_responsavel_id)
     VALUES (?, ?, ?, ?)`,
    [req.body.nome.trim(), req.body.descricao.trim(), Number(req.body.cargaHoraria), professorId]
  );

  return res.status(201).json({ mensagem: 'Disciplina criada com sucesso.', dados: formatar(await buscarRegistro(resultado.insertId)) });
}

async function atualizarDisciplina(req, res) {
  const id = obterId(req.params.id);
  await buscarRegistro(id);
  const partes = [];
  const valores = [];

  if (Object.hasOwn(req.body, 'nome')) {
    if (!textoValido(req.body.nome)) throw new AppError(400, 'Nome inválido.');
    partes.push('nome = ?'); valores.push(req.body.nome.trim());
  }
  if (Object.hasOwn(req.body, 'descricao')) {
    partes.push('descricao = ?'); valores.push(textoValido(req.body.descricao) ? req.body.descricao.trim() : null);
  }
  if (Object.hasOwn(req.body, 'cargaHoraria')) {
    if (!inteiroPositivo(req.body.cargaHoraria)) throw new AppError(400, 'Carga horária inválida.');
    partes.push('carga_horaria = ?'); valores.push(Number(req.body.cargaHoraria));
  }
  if (Object.hasOwn(req.body, 'professorResponsavelId')) {
    const professorId = obterId(req.body.professorResponsavelId, 'professorResponsavelId');
    await validarProfessor(professorId);
    partes.push('professor_responsavel_id = ?'); valores.push(professorId);
  }

  if (!partes.length) throw new AppError(400, 'Nenhum campo reconhecido para atualização.');
  valores.push(id);
  await executar(`UPDATE Disciplina SET ${partes.join(', ')} WHERE disciplina_id = ?`, valores);
  return res.status(200).json({ mensagem: 'Disciplina atualizada com sucesso.', dados: formatar(await buscarRegistro(id)) });
}

async function removerDisciplina(req, res) {
  const id = obterId(req.params.id);
  await buscarRegistro(id);
  await executar('DELETE FROM Disciplina WHERE disciplina_id = ?', [id]);
  return res.status(204).send();
}

module.exports = { listarDisciplinas, buscarDisciplinaPorId, criarDisciplina, atualizarDisciplina, removerDisciplina };
