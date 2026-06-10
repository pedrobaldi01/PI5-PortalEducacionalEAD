const { executar } = require('../database/conexao');
const { formatarDataHora } = require('../utils/mapeadores');
const { numeroPositivo, textoValido } = require('../utils/validacoes');

function formatarAviso(linha) {
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

async function criarAviso(req, res, next) {
  try {
    const {
      titulo,
      mensagem,
      turmaId,
      autorUsuarioId
    } = req.body;

    const autorId = autorUsuarioId || req.usuario.usuario_id;

    if (!textoValido(titulo) || !textoValido(mensagem) || !numeroPositivo(turmaId) || !numeroPositivo(autorId)) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: titulo, mensagem e turmaId.'
      });
    }

    const turmas = await executar(
      'SELECT turma_id FROM Turma WHERE turma_id = ? LIMIT 1',
      [Number(turmaId)]
    );
    const autores = await executar(
      'SELECT usuario_id FROM Usuario WHERE usuario_id = ? LIMIT 1',
      [Number(autorId)]
    );

    if (turmas.length === 0 || autores.length === 0) {
      return res.status(400).json({
        erro: 'turmaId ou autorUsuarioId informado não existe.'
      });
    }

    const resultado = await executar(
      `INSERT INTO Aviso (titulo, mensagem, turma_id, autor_usuario_id)
       VALUES (?, ?, ?, ?)`,
      [titulo.trim(), mensagem.trim(), Number(turmaId), Number(autorId)]
    );

    return res.status(201).json({
      mensagem: 'Aviso criado com sucesso.',
      dados: {
        id: resultado.insertId,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        turmaId: Number(turmaId),
        autorUsuarioId: Number(autorId)
      }
    });
  } catch (erro) {
    return next(erro);
  }
}

async function listarAvisos(req, res, next) {
  try {
    const avisos = await executar(
      `SELECT a.aviso_id, a.titulo, a.mensagem, a.data_publicacao,
              a.turma_id, t.nome AS turma, a.autor_usuario_id, u.nome AS autor
         FROM Aviso a
         JOIN Turma t ON t.turma_id = a.turma_id
         JOIN Usuario u ON u.usuario_id = a.autor_usuario_id
        ORDER BY a.data_publicacao DESC`
    );

    return res.status(200).json({
      total: avisos.length,
      dados: avisos.map(formatarAviso)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarAviso,
  listarAvisos
};
