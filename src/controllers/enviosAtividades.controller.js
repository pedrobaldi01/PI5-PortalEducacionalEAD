const { executar } = require('../database/conexao');
const acesso = require('../services/acesso.service');
const { textoValido } = require('../utils/validacoes');
const { formatarDataHora } = require('../utils/mapeadores');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatar(linha) {
  return {
    id: linha.envio_id,
    atividadeId: linha.atividade_id,
    atividade: linha.atividade,
    alunoId: linha.aluno_id,
    aluno: linha.aluno,
    arquivoId: linha.arquivo_id,
    dataEnvio: formatarDataHora(linha.data_envio),
    comentario: linha.comentario,
    status: linha.status
  };
}

const selectBase = `
  SELECT e.*, atv.titulo AS atividade, atv.turma_id,
         aluno_usuario.nome AS aluno
    FROM EnvioAtividade e
    JOIN Atividade atv ON atv.atividade_id = e.atividade_id
    JOIN Aluno a ON a.aluno_id = e.aluno_id
    JOIN Usuario aluno_usuario ON aluno_usuario.usuario_id = a.usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE e.envio_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Envio não encontrado.');
  return linhas[0];
}

async function listarEnviosAtividades(req, res) {
  let sql = selectBase;
  const params = [];

  if (acesso.ehAluno(req.usuario)) {
    sql += ' WHERE e.aluno_id = ?'; params.push(req.usuario.aluno_id);
  } else if (acesso.ehProfessor(req.usuario)) {
    sql += ' WHERE atv.professor_id = ?'; params.push(req.usuario.professor_id);
  }

  sql += ' ORDER BY e.data_envio DESC';
  const linhas = await executar(sql, params);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function listarMeus(req, res) {
  if (!acesso.ehAluno(req.usuario)) acesso.negar();
  return listarEnviosAtividades(req, res);
}

async function listarPorAtividade(req, res) {
  const atividadeId = obterId(req.params.atividadeId, 'atividadeId');
  const atividade = await acesso.buscarAtividade(atividadeId);
  await acesso.exigirProfessorDaTurma(req.usuario, atividade.turma_id, true);
  const linhas = await executar(`${selectBase} WHERE e.atividade_id = ? ORDER BY aluno_usuario.nome`, [atividadeId]);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatar) });
}

async function buscarEnvioPorId(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  if (acesso.ehAluno(req.usuario) && Number(registro.aluno_id) !== Number(req.usuario.aluno_id)) acesso.negar();
  if (acesso.ehProfessor(req.usuario)) await acesso.exigirProfessorDaTurma(req.usuario, registro.turma_id, false);
  return res.status(200).json({ dados: formatar(registro) });
}

async function validarArquivo(arquivoId, usuario) {
  if (arquivoId === null || arquivoId === undefined || arquivoId === '') return null;
  const id = obterId(arquivoId, 'arquivoId');
  const linhas = await executar('SELECT arquivo_id, usuario_id FROM ArquivoUpload WHERE arquivo_id = ? LIMIT 1', [id]);
  if (!linhas.length) throw new AppError(400, 'Arquivo não encontrado.');
  if (Number(linhas[0].usuario_id) !== Number(usuario.usuario_id)) {
    throw new AppError(403, 'Você só pode usar arquivos enviados por você.');
  }
  return id;
}

async function criarEnvioAtividade(req, res) {
  if (!acesso.ehAluno(req.usuario)) acesso.negar();
  const atividadeId = obterId(req.body.atividadeId, 'atividadeId');
  const atividade = await acesso.buscarAtividade(atividadeId);
  if (atividade.status !== 'Aberta') throw new AppError(409, 'Esta atividade não está aberta para envio.');
  await acesso.exigirAlunoMatriculado(req.usuario, atividade.turma_id);

  const arquivoId = await validarArquivo(req.body.arquivoId, req.usuario);
  const comentario = textoValido(req.body.comentario) ? req.body.comentario.trim() : null;
  if (!arquivoId && !comentario) throw new AppError(400, 'Informe um arquivoId, um comentário ou ambos.');

  const atrasado = atividade.data_entrega && new Date() > new Date(atividade.data_entrega);
  const existente = await executar(
    'SELECT envio_id FROM EnvioAtividade WHERE atividade_id = ? AND aluno_id = ? LIMIT 1',
    [atividadeId, req.usuario.aluno_id]
  );

  if (existente.length) {
    await executar(
      `UPDATE EnvioAtividade
          SET arquivo_id = ?, comentario = ?, data_envio = CURRENT_TIMESTAMP,
              status = ?
        WHERE envio_id = ?`,
      [arquivoId, comentario, atrasado ? 'Atrasada' : 'Reenviada', existente[0].envio_id]
    );
    return res.status(200).json({
      mensagem: 'Atividade reenviada com sucesso.',
      dados: formatar(await buscarRegistro(existente[0].envio_id))
    });
  }

  const resultado = await executar(
    `INSERT INTO EnvioAtividade
      (atividade_id, aluno_id, arquivo_id, comentario, status)
     VALUES (?, ?, ?, ?, ?)`,
    [atividadeId, req.usuario.aluno_id, arquivoId, comentario, atrasado ? 'Atrasada' : 'Enviada']
  );

  return res.status(201).json({ mensagem: 'Atividade enviada com sucesso.', dados: formatar(await buscarRegistro(resultado.insertId)) });
}

async function atualizarEnvio(req, res) {
  if (!acesso.ehAluno(req.usuario)) acesso.negar();
  const id = obterId(req.params.id);
  const atual = await buscarRegistro(id);
  if (Number(atual.aluno_id) !== Number(req.usuario.aluno_id)) acesso.negar();

  const atividade = await acesso.buscarAtividade(atual.atividade_id);
  if (atividade.status !== 'Aberta') throw new AppError(409, 'A atividade não aceita alterações.');

  const partes = [];
  const valores = [];
  if (Object.hasOwn(req.body, 'arquivoId')) {
    partes.push('arquivo_id = ?'); valores.push(await validarArquivo(req.body.arquivoId, req.usuario));
  }
  if (Object.hasOwn(req.body, 'comentario')) {
    partes.push('comentario = ?'); valores.push(textoValido(req.body.comentario) ? req.body.comentario.trim() : null);
  }
  if (!partes.length) throw new AppError(400, 'Nenhum campo reconhecido para atualização.');

  partes.push('data_envio = CURRENT_TIMESTAMP');
  partes.push("status = 'Reenviada'");
  valores.push(id);
  await executar(`UPDATE EnvioAtividade SET ${partes.join(', ')} WHERE envio_id = ?`, valores);
  return res.status(200).json({ mensagem: 'Envio atualizado com sucesso.', dados: formatar(await buscarRegistro(id)) });
}

module.exports = {
  listarEnviosAtividades,
  listarMeus,
  listarPorAtividade,
  buscarEnvioPorId,
  criarEnvioAtividade,
  atualizarEnvio
};
