const { executar, transacao } = require('../database/conexao');
const { textoValido, numeroPositivo } = require('../utils/validacoes');

function formatarDisciplina(linha) {
  return {
    id: linha.disciplina_id,
    nome: linha.nome,
    descricao: linha.descricao,
    cargaHoraria: linha.carga_horaria,
    professorResponsavelId: linha.professor_responsavel_id,
    professorResponsavel: linha.professor_responsavel,
    cursos: linha.cursos ? linha.cursos.split(',').map((curso) => curso.trim()) : []
  };
}

function erroValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.statusCode = 400;
  return erro;
}

async function criarDisciplina(req, res, next) {
  try {
    const {
      nome,
      descricao,
      cargaHoraria,
      professorResponsavelId,
      cursoId,
      sequencia
    } = req.body;

    const professorIdNumero = Number(professorResponsavelId);
    const cursoIdNumero = cursoId === undefined ? null : Number(cursoId);
    const sequenciaNumero = sequencia === undefined ? null : Number(sequencia);

    if (
      !textoValido(nome) ||
      !textoValido(descricao) ||
      !numeroPositivo(cargaHoraria) ||
      !numeroPositivo(professorResponsavelId)
    ) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: nome, descricao, cargaHoraria e professorResponsavelId.'
      });
    }

    if ((cursoId !== undefined || sequencia !== undefined) && (!numeroPositivo(cursoId) || !numeroPositivo(sequencia))) {
      return res.status(400).json({
        erro: 'Para vincular disciplina a curso, informe cursoId e sequencia positivos.'
      });
    }

    const disciplinaCriada = await transacao(async (conexao) => {
      const [professores] = await conexao.execute(
        'SELECT professor_id FROM Professor WHERE professor_id = ? LIMIT 1',
        [professorIdNumero]
      );

      if (professores.length === 0) {
        throw erroValidacao('professorResponsavelId informado não existe.');
      }

      if (cursoIdNumero !== null) {
        const [cursos] = await conexao.execute(
          'SELECT curso_id FROM Curso WHERE curso_id = ? LIMIT 1',
          [cursoIdNumero]
        );

        if (cursos.length === 0) {
          throw erroValidacao('cursoId informado não existe.');
        }
      }

      const [resultado] = await conexao.execute(
        `INSERT INTO Disciplina
          (nome, descricao, carga_horaria, professor_responsavel_id)
         VALUES (?, ?, ?, ?)`,
        [nome.trim(), descricao.trim(), Number(cargaHoraria), professorIdNumero]
      );

      const disciplinaId = resultado.insertId;

      if (cursoIdNumero !== null) {
        await conexao.execute(
          `INSERT INTO Curso_Disciplina (curso_id, disciplina_id, sequencia)
           VALUES (?, ?, ?)`,
          [cursoIdNumero, disciplinaId, sequenciaNumero]
        );
      }

      return {
        disciplina_id: disciplinaId,
        nome: nome.trim(),
        descricao: descricao.trim(),
        carga_horaria: Number(cargaHoraria),
        professor_responsavel_id: professorIdNumero,
        professor_responsavel: null,
        cursos: ''
      };
    });

    return res.status(201).json({
      mensagem: 'Disciplina criada com sucesso.',
      dados: formatarDisciplina(disciplinaCriada)
    });
  } catch (erro) {
    if (erro.statusCode) {
      return res.status(erro.statusCode).json({ erro: erro.message });
    }

    return next(erro);
  }
}

async function listarDisciplinas(req, res, next) {
  try {
    const disciplinas = await executar(
      `SELECT d.disciplina_id, d.nome, d.descricao, d.carga_horaria,
              d.professor_responsavel_id, u.nome AS professor_responsavel,
              GROUP_CONCAT(c.nome ORDER BY cd.sequencia SEPARATOR ',') AS cursos
         FROM Disciplina d
         JOIN Professor p ON p.professor_id = d.professor_responsavel_id
         JOIN Usuario u ON u.usuario_id = p.usuario_id
    LEFT JOIN Curso_Disciplina cd ON cd.disciplina_id = d.disciplina_id
    LEFT JOIN Curso c ON c.curso_id = cd.curso_id
        GROUP BY d.disciplina_id, d.nome, d.descricao, d.carga_horaria,
                 d.professor_responsavel_id, u.nome
        ORDER BY d.nome`
    );

    return res.status(200).json({
      total: disciplinas.length,
      dados: disciplinas.map(formatarDisciplina)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarDisciplina,
  listarDisciplinas
};
