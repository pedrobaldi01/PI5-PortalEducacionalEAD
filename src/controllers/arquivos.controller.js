const path = require('node:path');
const fs = require('node:fs');
const { executar } = require('../database/conexao');
const { apagarArquivo } = require('../middlewares/upload.middleware');
const acesso = require('../services/acesso.service');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

async function enviarArquivo(req, res) {
  if (!req.file) throw new AppError(400, 'Selecione um arquivo no campo "arquivo".');

  try {
    const resultado = await executar(
      `INSERT INTO ArquivoUpload
        (nome_original, caminho_arquivo, tipo_mime, tamanho_bytes, usuario_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        path.basename(req.file.originalname),
        path.relative(process.cwd(), req.file.path).replace(/\\/g, '/'),
        req.file.mimetype,
        req.file.size,
        req.usuario.usuario_id
      ]
    );

    return res.status(201).json({
      mensagem: 'Arquivo enviado com sucesso.',
      dados: {
        id: resultado.insertId,
        nomeOriginal: path.basename(req.file.originalname),
        tipoMime: req.file.mimetype,
        tamanhoBytes: req.file.size
      }
    });
  } catch (erro) {
    apagarArquivo(req.file.path);
    throw erro;
  }
}

async function usuarioPodeBaixar(usuario, arquivoId) {
  if (acesso.ehAdministrador(usuario) || acesso.ehCoordenador(usuario)) return true;

  const proprio = await executar(
    'SELECT arquivo_id FROM ArquivoUpload WHERE arquivo_id = ? AND usuario_id = ? LIMIT 1',
    [arquivoId, usuario.usuario_id]
  );
  if (proprio.length) return true;

  const materiais = await executar(
    'SELECT turma_id FROM MaterialDidatico WHERE arquivo_id = ? LIMIT 1',
    [arquivoId]
  );
  if (materiais[0] && await acesso.podeVisualizarTurma(usuario, materiais[0].turma_id)) return true;

  const envios = await executar(
    `SELECT e.aluno_id, a.turma_id
       FROM EnvioAtividade e
       JOIN Atividade a ON a.atividade_id = e.atividade_id
      WHERE e.arquivo_id = ?
      LIMIT 1`,
    [arquivoId]
  );

  if (envios[0]) {
    if (acesso.ehAluno(usuario) && Number(usuario.aluno_id) === Number(envios[0].aluno_id)) return true;
    if (acesso.ehProfessor(usuario) && await acesso.professorGerenciaTurma(usuario, envios[0].turma_id)) return true;
  }

  return false;
}

async function baixarArquivo(req, res) {
  const arquivoId = obterId(req.params.id, 'arquivoId');
  const arquivos = await executar(
    `SELECT arquivo_id, nome_original, caminho_arquivo, tipo_mime, tamanho_bytes
       FROM ArquivoUpload
      WHERE arquivo_id = ?
      LIMIT 1`,
    [arquivoId]
  );

  const arquivo = arquivos[0];
  if (!arquivo) throw new AppError(404, 'Arquivo não encontrado.');
  if (!(await usuarioPodeBaixar(req.usuario, arquivoId))) acesso.negar();

  const caminho = path.resolve(arquivo.caminho_arquivo);
  if (!fs.existsSync(caminho)) throw new AppError(404, 'Arquivo físico não encontrado no servidor.');

  return res.download(caminho, arquivo.nome_original);
}

module.exports = { enviarArquivo, baixarArquivo };
