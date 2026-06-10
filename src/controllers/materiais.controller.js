const { executar } = require('../database/conexao');
const { formatarDataHora } = require('../utils/mapeadores');
const { numeroPositivo, textoValido } = require('../utils/validacoes');

function formatarMaterial(linha) {
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

async function criarMaterial(req, res, next) {
  try {
    const {
      titulo,
      descricao,
      arquivoId,
      link,
      turmaId,
      professorId
    } = req.body;

    if (
      !textoValido(titulo) ||
      !numeroPositivo(turmaId) ||
      !numeroPositivo(professorId) ||
      (!textoValido(link) && !numeroPositivo(arquivoId))
    ) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: titulo, turmaId, professorId e link ou arquivoId.'
      });
    }

    const turmas = await executar(
      'SELECT turma_id FROM Turma WHERE turma_id = ? LIMIT 1',
      [Number(turmaId)]
    );
    const professores = await executar(
      'SELECT professor_id FROM Professor WHERE professor_id = ? LIMIT 1',
      [Number(professorId)]
    );

    if (turmas.length === 0 || professores.length === 0) {
      return res.status(400).json({
        erro: 'turmaId ou professorId informado não existe.'
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
      `INSERT INTO MaterialDidatico
        (titulo, descricao, arquivo_id, link, turma_id, professor_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        titulo.trim(),
        textoValido(descricao) ? descricao.trim() : null,
        numeroPositivo(arquivoId) ? Number(arquivoId) : null,
        textoValido(link) ? link.trim() : null,
        Number(turmaId),
        Number(professorId)
      ]
    );

    return res.status(201).json({
      mensagem: 'Material didático criado com sucesso.',
      dados: {
        id: resultado.insertId,
        titulo: titulo.trim(),
        descricao: textoValido(descricao) ? descricao.trim() : null,
        arquivoId: numeroPositivo(arquivoId) ? Number(arquivoId) : null,
        link: textoValido(link) ? link.trim() : null,
        turmaId: Number(turmaId),
        professorId: Number(professorId)
      }
    });
  } catch (erro) {
    return next(erro);
  }
}

async function listarMateriais(req, res, next) {
  try {
    const materiais = await executar(
      `SELECT m.material_id, m.titulo, m.descricao, m.arquivo_id, m.link,
              m.data_postagem, m.turma_id, t.nome AS turma,
              m.professor_id, u.nome AS professor
         FROM MaterialDidatico m
         JOIN Turma t ON t.turma_id = m.turma_id
         JOIN Professor p ON p.professor_id = m.professor_id
         JOIN Usuario u ON u.usuario_id = p.usuario_id
        ORDER BY m.data_postagem DESC`
    );

    return res.status(200).json({
      total: materiais.length,
      dados: materiais.map(formatarMaterial)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarMaterial,
  listarMateriais
};
