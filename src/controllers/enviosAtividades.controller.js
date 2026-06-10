const { executar } = require('../database/conexao');
const { formatarDataHora } = require('../utils/mapeadores');
const { numeroPositivo, textoValido } = require('../utils/validacoes');

const STATUS_ENVIO = {
  enviada: 'Enviada',
  atrasada: 'Atrasada',
  reenviada: 'Reenviada',
  corrigida: 'Corrigida'
};

function normalizarStatus(status) {
  if (!textoValido(status)) {
    return 'Enviada';
  }

  return STATUS_ENVIO[status.trim().toLowerCase()] || null;
}

function formatarEnvio(linha) {
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

async function criarEnvioAtividade(req, res, next) {
  try {
    const {
      atividadeId,
      alunoId,
      arquivoId,
      comentario,
      status
    } = req.body;

    if (!numeroPositivo(atividadeId) || !numeroPositivo(alunoId)) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: atividadeId e alunoId.'
      });
    }

    const statusBanco = normalizarStatus(status);

    if (!statusBanco) {
      return res.status(400).json({
        erro: 'Status inválido. Use Enviada, Atrasada, Reenviada ou Corrigida.'
      });
    }

    const atividades = await executar(
      'SELECT atividade_id FROM Atividade WHERE atividade_id = ? LIMIT 1',
      [Number(atividadeId)]
    );
    const alunos = await executar(
      'SELECT aluno_id FROM Aluno WHERE aluno_id = ? LIMIT 1',
      [Number(alunoId)]
    );

    if (atividades.length === 0 || alunos.length === 0) {
      return res.status(400).json({
        erro: 'atividadeId ou alunoId informado não existe.'
      });
    }

    if (numeroPositivo(arquivoId)) {
      const arquivos = await executar(
        'SELECT arquivo_id FROM ArquivoUpload WHERE arquivo_id = ? LIMIT 1',
        [Number(arquivoId)]
      );

      if (arquivos.length === 0) {
        return res.status(400).json({
          erro: 'arquivoId informado não existe.'
        });
      }
    }

    const resultado = await executar(
      `INSERT INTO EnvioAtividade
        (atividade_id, aluno_id, arquivo_id, comentario, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        Number(atividadeId),
        Number(alunoId),
        numeroPositivo(arquivoId) ? Number(arquivoId) : null,
        textoValido(comentario) ? comentario.trim() : null,
        statusBanco
      ]
    );

    return res.status(201).json({
      mensagem: 'Envio de atividade criado com sucesso.',
      dados: {
        id: resultado.insertId,
        atividadeId: Number(atividadeId),
        alunoId: Number(alunoId),
        arquivoId: numeroPositivo(arquivoId) ? Number(arquivoId) : null,
        comentario: textoValido(comentario) ? comentario.trim() : null,
        status: statusBanco
      }
    });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        erro: 'Este aluno já enviou esta atividade.'
      });
    }

    return next(erro);
  }
}

async function listarEnviosAtividades(req, res, next) {
  try {
    const envios = await executar(
      `SELECT e.envio_id, e.atividade_id, atv.titulo AS atividade,
              e.aluno_id, aluno_usuario.nome AS aluno, e.arquivo_id,
              e.data_envio, e.comentario, e.status
         FROM EnvioAtividade e
         JOIN Atividade atv ON atv.atividade_id = e.atividade_id
         JOIN Aluno a ON a.aluno_id = e.aluno_id
         JOIN Usuario aluno_usuario ON aluno_usuario.usuario_id = a.usuario_id
        ORDER BY e.data_envio DESC`
    );

    return res.status(200).json({
      total: envios.length,
      dados: envios.map(formatarEnvio)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarEnvioAtividade,
  listarEnviosAtividades
};
