const { executar } = require('../database/conexao');
const { formatarDataHora } = require('../utils/mapeadores');
const { numeroPositivo, textoValido } = require('../utils/validacoes');

function formatarNota(linha) {
  return {
    id: linha.nota_id,
    alunoId: linha.aluno_id,
    aluno: linha.aluno,
    atividadeId: linha.atividade_id,
    atividade: linha.atividade,
    nota: Number(linha.nota),
    notaMaxima: Number(linha.nota_maxima),
    feedback: linha.feedback,
    dataCorrecao: formatarDataHora(linha.data_correcao),
    professorResponsavelId: linha.professor_responsavel_id,
    professorResponsavel: linha.professor_responsavel
  };
}

async function lancarNota(req, res, next) {
  try {
    const {
      alunoId,
      atividadeId,
      nota,
      feedback,
      professorResponsavelId
    } = req.body;

    const notaNumero = Number(nota);

    if (
      !numeroPositivo(alunoId) ||
      !numeroPositivo(atividadeId) ||
      Number.isNaN(notaNumero) ||
      notaNumero < 0 ||
      !numeroPositivo(professorResponsavelId)
    ) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: alunoId, atividadeId, nota e professorResponsavelId.'
      });
    }

    const atividades = await executar(
      'SELECT atividade_id, nota_maxima FROM Atividade WHERE atividade_id = ? LIMIT 1',
      [Number(atividadeId)]
    );
    const alunos = await executar(
      'SELECT aluno_id FROM Aluno WHERE aluno_id = ? LIMIT 1',
      [Number(alunoId)]
    );
    const professores = await executar(
      'SELECT professor_id FROM Professor WHERE professor_id = ? LIMIT 1',
      [Number(professorResponsavelId)]
    );

    if (atividades.length === 0 || alunos.length === 0 || professores.length === 0) {
      return res.status(400).json({
        erro: 'alunoId, atividadeId ou professorResponsavelId informado não existe.'
      });
    }

    const notaMaxima = Number(atividades[0].nota_maxima);

    if (notaNumero > notaMaxima) {
      return res.status(400).json({
        erro: `Nota inválida. O máximo desta atividade é ${notaMaxima}.`
      });
    }

    const resultado = await executar(
      `INSERT INTO Nota
        (aluno_id, atividade_id, nota, feedback, professor_responsavel_id)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        nota = VALUES(nota),
        feedback = VALUES(feedback),
        professor_responsavel_id = VALUES(professor_responsavel_id),
        data_correcao = CURRENT_TIMESTAMP`,
      [
        Number(alunoId),
        Number(atividadeId),
        notaNumero,
        textoValido(feedback) ? feedback.trim() : null,
        Number(professorResponsavelId)
      ]
    );

    return res.status(resultado.affectedRows === 1 ? 201 : 200).json({
      mensagem: resultado.affectedRows === 1 ? 'Nota lançada com sucesso.' : 'Nota atualizada com sucesso.',
      dados: {
        alunoId: Number(alunoId),
        atividadeId: Number(atividadeId),
        nota: notaNumero,
        notaMaxima,
        feedback: textoValido(feedback) ? feedback.trim() : null,
        professorResponsavelId: Number(professorResponsavelId)
      }
    });
  } catch (erro) {
    return next(erro);
  }
}

async function listarNotas(req, res, next) {
  try {
    const notas = await executar(
      `SELECT n.nota_id, n.aluno_id, aluno_usuario.nome AS aluno,
              n.atividade_id, atv.titulo AS atividade, atv.nota_maxima,
              n.nota, n.feedback, n.data_correcao,
              n.professor_responsavel_id, professor_usuario.nome AS professor_responsavel
         FROM Nota n
         JOIN Aluno a ON a.aluno_id = n.aluno_id
         JOIN Usuario aluno_usuario ON aluno_usuario.usuario_id = a.usuario_id
         JOIN Atividade atv ON atv.atividade_id = n.atividade_id
         JOIN Professor p ON p.professor_id = n.professor_responsavel_id
         JOIN Usuario professor_usuario ON professor_usuario.usuario_id = p.usuario_id
        ORDER BY aluno_usuario.nome, atv.titulo`
    );

    return res.status(200).json({
      total: notas.length,
      dados: notas.map(formatarNota)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  lancarNota,
  listarNotas
};
