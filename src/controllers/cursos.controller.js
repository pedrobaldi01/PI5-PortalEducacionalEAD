const { executar } = require('../database/conexao');
const { textoValido, inteiroPositivo, normalizarStatus, exigirCampos } = require('../utils/validacoes');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
  return {
    id: linha.curso_id,
    nome: linha.nome,
    descricao: linha.descricao,
    cargaHorariaTotal: linha.carga_horaria_total,
    categoria: linha.categoria,
    status: linha.status
  };
}

async function buscarRegistro(id) {
  const linhas = await executar('SELECT * FROM Curso WHERE curso_id = ? LIMIT 1', [id]);
  if (!linhas[0]) throw new AppError(404, 'Curso não encontrado.');
  return linhas[0];
}

async function listarCursos(_req, res) {
  const linhas = await executar('SELECT * FROM Curso ORDER BY nome');
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function buscarCursoPorId(req, res) {
  return res.status(200).json({ dados: formatar(await buscarRegistro(obterId(req.params.id))) });
}

async function criarCurso(req, res) {
  const faltantes = exigirCampos(req.body, ['nome', 'descricao', 'cargaHorariaTotal', 'categoria']);
  if (faltantes.length) throw new AppError(400, `Campos obrigatórios: ${faltantes.join(', ')}.`);
  if (!inteiroPositivo(req.body.cargaHorariaTotal)) throw new AppError(400, 'Carga horária deve ser um inteiro positivo.');

  const status = normalizarStatus(req.body.status || 'Ativo', ['Ativo', 'Inativo']);
  if (!status) throw new AppError(400, 'Status inválido.');

  const duplicado = await executar('SELECT curso_id FROM Curso WHERE nome = ? LIMIT 1', [req.body.nome.trim()]);
  if (duplicado.length) throw new AppError(409, 'Já existe curso com este nome.');

  const resultado = await executar(
    `INSERT INTO Curso (nome, descricao, carga_horaria_total, categoria, status)
     VALUES (?, ?, ?, ?, ?)`,
    [req.body.nome.trim(), req.body.descricao.trim(), Number(req.body.cargaHorariaTotal), req.body.categoria.trim(), status]
  );

  return res.status(201).json({ mensagem: 'Curso criado com sucesso.', dados: formatar(await buscarRegistro(resultado.insertId)) });
}

async function atualizarCurso(req, res) {
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
  if (Object.hasOwn(req.body, 'cargaHorariaTotal')) {
    if (!inteiroPositivo(req.body.cargaHorariaTotal)) throw new AppError(400, 'Carga horária inválida.');
    partes.push('carga_horaria_total = ?'); valores.push(Number(req.body.cargaHorariaTotal));
  }
  if (Object.hasOwn(req.body, 'categoria')) {
    if (!textoValido(req.body.categoria)) throw new AppError(400, 'Categoria inválida.');
    partes.push('categoria = ?'); valores.push(req.body.categoria.trim());
  }
  if (Object.hasOwn(req.body, 'status')) {
    const status = normalizarStatus(req.body.status, ['Ativo', 'Inativo']);
    if (!status) throw new AppError(400, 'Status inválido.');
    partes.push('status = ?'); valores.push(status);
  }

  if (!partes.length) throw new AppError(400, 'Nenhum campo reconhecido para atualização.');
  valores.push(id);
  await executar(`UPDATE Curso SET ${partes.join(', ')} WHERE curso_id = ?`, valores);
  return res.status(200).json({ mensagem: 'Curso atualizado com sucesso.', dados: formatar(await buscarRegistro(id)) });
}

async function alterarStatus(req, res) {
  const id = obterId(req.params.id);
  await buscarRegistro(id);
  const status = normalizarStatus(req.body.status, ['Ativo', 'Inativo']);
  if (!status) throw new AppError(400, 'Status inválido. Use Ativo ou Inativo.');
  await executar('UPDATE Curso SET status = ? WHERE curso_id = ?', [status, id]);
  return res.status(200).json({ mensagem: 'Status atualizado.', dados: formatar(await buscarRegistro(id)) });
}

async function removerCurso(req, res) {
  const id = obterId(req.params.id);
  await buscarRegistro(id);
  await executar('DELETE FROM Curso WHERE curso_id = ?', [id]);
  return res.status(204).send();
}

module.exports = { listarCursos, buscarCursoPorId, criarCurso, atualizarCurso, alterarStatus, removerCurso };
