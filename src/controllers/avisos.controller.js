const { executar } = require('../database/conexao');
const acesso = require('../services/acesso.service');
const { textoValido } = require('../utils/validacoes');
const { formatarDataHora } = require('../utils/mapeadores');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
  return {
    id: linha.aviso_id,
    titulo: linha.titulo,
    mensagem: linha.mensagem,
    dataPublicacao: formatarDataHora(linha.data_publicacao),
    turmaId: linha.turma_id,
    turma: linha.turma,
    autorUsuarioId: linha.autor_usuario_id,
    autor: linha.autor
  };
}

const selectBase = `
  SELECT a.*, t.nome AS turma, u.nome AS autor
    FROM Aviso a
    JOIN Turma t ON t.turma_id = a.turma_id
    JOIN Usuario u ON u.usuario_id = a.autor_usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE a.aviso_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Aviso não encontrado.');
  return linhas[0];
}

async function listarAvisos(req, res) {
  let sql = selectBase;
  const params = [];
  if (acesso.ehProfessor(req.usuario)) {
    sql += ' WHERE t.professor_id = ?'; params.push(req.usuario.professor_id);
  } else if (acesso.ehAluno(req.usuario)) {
    sql += ` JOIN Matricula m ON m.turma_id = t.turma_id
             WHERE m.aluno_id = ? AND m.status_matricula IN ('Ativa', 'Concluída')`;
    params.push(req.usuario.aluno_id);
  }
  sql += ' ORDER BY a.data_publicacao DESC';
  const linhas = await executar(sql, params);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function listarPorTurma(req, res) {
  const turmaId = obterId(req.params.turmaId, 'turmaId');
  await acesso.exigirVisualizacaoTurma(req.usuario, turmaId);
  const linhas = await executar(`${selectBase} WHERE a.turma_id = ? ORDER BY a.data_publicacao DESC`, [turmaId]);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function buscarAvisoPorId(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  await acesso.exigirVisualizacaoTurma(req.usuario, registro.turma_id);
  return res.status(200).json({ dados: formatar(registro) });
}

async function criarAviso(req, res) {
  if (!textoValido(req.body.titulo) || !textoValido(req.body.mensagem)) {
    throw new AppError(400, 'Título e mensagem são obrigatórios.');
  }
  const turmaId = obterId(req.body.turmaId, 'turmaId');

  if (acesso.ehProfessor(req.usuario)) {
    await acesso.exigirProfessorDaTurma(req.usuario, turmaId, false);
  } else if (!acesso.ehAdministrador(req.usuario) && !acesso.ehCoordenador(req.usuario)) {
    acesso.negar();
  }

  const resultado = await executar(
    `INSERT INTO Aviso (titulo, mensagem, turma_id, autor_usuario_id)
     VALUES (?, ?, ?, ?)`,
    [req.body.titulo.trim(), req.body.mensagem.trim(), turmaId, req.usuario.usuario_id]
  );

  return res.status(201).json({ mensagem: 'Aviso publicado com sucesso.', dados: formatar(await buscarRegistro(resultado.insertId)) });
}

async function atualizarAviso(req, res) {
  const id = obterId(req.params.id);
  const atual = await buscarRegistro(id);
  if (acesso.ehProfessor(req.usuario)) {
    await acesso.exigirProfessorDaTurma(req.usuario, atual.turma_id, false);
    if (Number(atual.autor_usuario_id) !== Number(req.usuario.usuario_id)) acesso.negar();
  } else if (!acesso.ehAdministrador(req.usuario) && !acesso.ehCoordenador(req.usuario)) {
    acesso.negar();
  }

  const partes = [];
  const valores = [];
  if (Object.hasOwn(req.body, 'titulo')) {
    if (!textoValido(req.body.titulo)) throw new AppError(400, 'Título inválido.');
    partes.push('titulo = ?'); valores.push(req.body.titulo.trim());
  }
  if (Object.hasOwn(req.body, 'mensagem')) {
    if (!textoValido(req.body.mensagem)) throw new AppError(400, 'Mensagem inválida.');
    partes.push('mensagem = ?'); valores.push(req.body.mensagem.trim());
  }
  if (!partes.length) throw new AppError(400, 'Nenhum campo reconhecido para atualização.');
  valores.push(id);
  await executar(`UPDATE Aviso SET ${partes.join(', ')} WHERE aviso_id = ?`, valores);
  return res.status(200).json({ mensagem: 'Aviso atualizado com sucesso.', dados: formatar(await buscarRegistro(id)) });
}

async function removerAviso(req, res) {
  const id = obterId(req.params.id);
  const atual = await buscarRegistro(id);
  if (acesso.ehProfessor(req.usuario)) {
    await acesso.exigirProfessorDaTurma(req.usuario, atual.turma_id, false);
    if (Number(atual.autor_usuario_id) !== Number(req.usuario.usuario_id)) acesso.negar();
  } else if (!acesso.ehAdministrador(req.usuario) && !acesso.ehCoordenador(req.usuario)) {
    acesso.negar();
  }
  await executar('DELETE FROM Aviso WHERE aviso_id = ?', [id]);
  return res.status(204).send();
}

module.exports = { listarAvisos, listarPorTurma, buscarAvisoPorId, criarAviso, atualizarAviso, removerAviso };
