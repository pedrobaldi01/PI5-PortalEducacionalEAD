const { executar } = require('../database/conexao');
const acesso = require('../services/acesso.service');
const { textoValido } = require('../utils/validacoes');
const { formatarDataHora } = require('../utils/mapeadores');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
  return {
    id: linha.material_id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    arquivoId: linha.arquivo_id,
    link: linha.link,
    dataPostagem: formatarDataHora(linha.data_postagem),
    turmaId: linha.turma_id,
    turma: linha.turma,
    professorId: linha.professor_id,
    professor: linha.professor
  };
}

const selectBase = `
  SELECT m.*, t.nome AS turma, u.nome AS professor
    FROM MaterialDidatico m
    JOIN Turma t ON t.turma_id = m.turma_id
    JOIN Professor p ON p.professor_id = m.professor_id
    JOIN Usuario u ON u.usuario_id = p.usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE m.material_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Material não encontrado.');
  return linhas[0];
}

async function listarMateriais(req, res) {
  let sql = selectBase;
  const params = [];
  if (acesso.ehProfessor(req.usuario)) {
    sql += ' WHERE t.professor_id = ?'; params.push(req.usuario.professor_id);
  } else if (acesso.ehAluno(req.usuario)) {
    sql += ` JOIN Matricula mat ON mat.turma_id = t.turma_id
             WHERE mat.aluno_id = ? AND mat.status_matricula IN ('Ativa', 'Concluída')`;
    params.push(req.usuario.aluno_id);
  }
  sql += ' ORDER BY m.data_postagem DESC';
  const linhas = await executar(sql, params);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function listarPorTurma(req, res) {
  const turmaId = obterId(req.params.turmaId, 'turmaId');
  await acesso.exigirVisualizacaoTurma(req.usuario, turmaId);
  const linhas = await executar(`${selectBase} WHERE m.turma_id = ? ORDER BY m.data_postagem DESC`, [turmaId]);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function buscarMaterialPorId(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  await acesso.exigirVisualizacaoTurma(req.usuario, registro.turma_id);
  return res.status(200).json({ dados: formatar(registro) });
}

async function validarArquivo(arquivoId, usuario) {
  if (arquivoId === null || arquivoId === undefined || arquivoId === '') return null;
  const id = obterId(arquivoId, 'arquivoId');
  const linhas = await executar('SELECT arquivo_id, usuario_id FROM ArquivoUpload WHERE arquivo_id = ? LIMIT 1', [id]);
  if (!linhas.length) throw new AppError(400, 'Arquivo não encontrado.');
  if (!acesso.ehAdministrador(usuario) && Number(linhas[0].usuario_id) !== Number(usuario.usuario_id)) {
    throw new AppError(403, 'Você só pode vincular arquivos enviados por você.');
  }
  return id;
}

async function criarMaterial(req, res) {
  if (!textoValido(req.body.titulo)) throw new AppError(400, 'Título é obrigatório.');
  const turmaId = obterId(req.body.turmaId, 'turmaId');
  await acesso.exigirProfessorDaTurma(req.usuario, turmaId, true);
  const turma = await acesso.buscarTurma(turmaId);
  const professorId = turma.professor_id;
  const arquivoId = await validarArquivo(req.body.arquivoId, req.usuario);
  const link = textoValido(req.body.link) ? req.body.link.trim() : null;
  if (!arquivoId && !link) throw new AppError(400, 'Informe um arquivoId, um link ou ambos.');

  const resultado = await executar(
    `INSERT INTO MaterialDidatico
      (titulo, descricao, arquivo_id, link, turma_id, professor_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.body.titulo.trim(), textoValido(req.body.descricao) ? req.body.descricao.trim() : null, arquivoId, link, turmaId, professorId]
  );

  return res.status(201).json({ mensagem: 'Material publicado com sucesso.', dados: formatar(await buscarRegistro(resultado.insertId)) });
}

async function atualizarMaterial(req, res) {
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
  if (Object.hasOwn(req.body, 'link')) {
    partes.push('link = ?'); valores.push(textoValido(req.body.link) ? req.body.link.trim() : null);
  }
  if (Object.hasOwn(req.body, 'arquivoId')) {
    partes.push('arquivo_id = ?'); valores.push(await validarArquivo(req.body.arquivoId, req.usuario));
  }

  if (!partes.length) throw new AppError(400, 'Nenhum campo reconhecido para atualização.');
  valores.push(id);
  await executar(`UPDATE MaterialDidatico SET ${partes.join(', ')} WHERE material_id = ?`, valores);
  return res.status(200).json({ mensagem: 'Material atualizado com sucesso.', dados: formatar(await buscarRegistro(id)) });
}

async function removerMaterial(req, res) {
  const id = obterId(req.params.id);
  const atual = await buscarRegistro(id);
  await acesso.exigirProfessorDaTurma(req.usuario, atual.turma_id, true);
  await executar('DELETE FROM MaterialDidatico WHERE material_id = ?', [id]);
  return res.status(204).send();
}

module.exports = { listarMateriais, listarPorTurma, buscarMaterialPorId, criarMaterial, atualizarMaterial, removerMaterial };
