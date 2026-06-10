const { executar } = require('../database/conexao');
const { textoValido, numeroPositivo } = require('../utils/validacoes');

function normalizarStatus(status) {
  const statusNormalizado = status.trim().toLowerCase();

  if (statusNormalizado === 'ativo') {
    return 'Ativo';
  }

  if (statusNormalizado === 'inativo') {
    return 'Inativo';
  }

  return null;
}

function formatarCurso(linha) {
  return {
    id: linha.curso_id,
    nome: linha.nome,
    descricao: linha.descricao,
    cargaHorariaTotal: linha.carga_horaria_total,
    categoria: linha.categoria,
    status: linha.status
  };
}

async function criarCurso(req, res, next) {
  try {
    const {
      nome,
      descricao,
      cargaHorariaTotal,
      categoria,
      status
    } = req.body;

    if (
      !textoValido(nome) ||
      !textoValido(descricao) ||
      !numeroPositivo(cargaHorariaTotal) ||
      !textoValido(categoria) ||
      !textoValido(status)
    ) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: nome, descricao, cargaHorariaTotal, categoria e status.'
      });
    }

    const statusBanco = normalizarStatus(status);

    if (!statusBanco) {
      return res.status(400).json({
        erro: 'Status inválido. Use Ativo ou Inativo.'
      });
    }

    const cursosDuplicados = await executar(
      'SELECT curso_id FROM Curso WHERE nome = ? LIMIT 1',
      [nome.trim()]
    );

    if (cursosDuplicados.length > 0) {
      return res.status(400).json({
        erro: 'Já existe curso com este nome.'
      });
    }

    const resultado = await executar(
      `INSERT INTO Curso (nome, descricao, carga_horaria_total, categoria, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        descricao.trim(),
        Number(cargaHorariaTotal),
        categoria.trim(),
        statusBanco
      ]
    );

    return res.status(201).json({
      mensagem: 'Curso criado com sucesso.',
      dados: {
        id: resultado.insertId,
        nome: nome.trim(),
        descricao: descricao.trim(),
        cargaHorariaTotal: Number(cargaHorariaTotal),
        categoria: categoria.trim(),
        status: statusBanco
      }
    });
  } catch (erro) {
    return next(erro);
  }
}

async function listarCursos(req, res, next) {
  try {
    const cursos = await executar(
      `SELECT curso_id, nome, descricao, carga_horaria_total, categoria, status
         FROM Curso
        ORDER BY nome`
    );

    return res.status(200).json({
      total: cursos.length,
      dados: cursos.map(formatarCurso)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarCurso,
  listarCursos
};
