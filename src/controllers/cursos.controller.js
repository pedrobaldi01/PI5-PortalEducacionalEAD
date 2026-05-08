const { memoria, gerarId } = require('../database/memoria');
const { textoValido, numeroPositivo } = require('../utils/validacoes');

function criarCurso(req, res) {
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

  const novoCurso = {
    id: gerarId('cursos'),
    nome: nome.trim(),
    descricao: descricao.trim(),
    cargaHorariaTotal: Number(cargaHorariaTotal),
    categoria: categoria.trim(),
    status: status.trim(),
    criadoEm: new Date().toISOString()
  };

  memoria.cursos.push(novoCurso);

  return res.status(201).json({
    mensagem: 'Curso criado com sucesso.',
    dados: novoCurso
  });
}

function listarCursos(req, res) {
  return res.status(200).json({
    total: memoria.cursos.length,
    dados: memoria.cursos
  });
}

module.exports = {
  criarCurso,
  listarCursos
};
