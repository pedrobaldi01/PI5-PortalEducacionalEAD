// regUser_simple.js
import { createConnection } from "mysql2";

console.log("Iniciando conexão com o banco...");

// Conexão com o banco
const connection = createConnection({
  host: "localhost",
  user: "root",
  password: "1234567890",
  database: "escola_ead",
});

// Promisify
const db = connection.promise();

console.log("Conexão criada. Aguardando comandos...");

/*
  Dados esperados em userData:
 {
    nome: string,
    email: string,
    senha: string,
    tipo: 'Aluno' | 'Professor' | 'Administrador',
    curso_id?: number,
    turma?: string
  }
*/
export async function registerUser(userData) {
  const { nome, email, senha, tipo, curso_id, turma } = userData;

  try {
    // Inicia transação
    await db.query("START TRANSACTION");

    // Insere em Usuario
    const [usuarioResult] = await db.query(
      `INSERT INTO Usuario (nome, email, senha, tipo)
       VALUES (?, ?, ?, ?)`,
      [nome, email, senha, tipo]
    );
    const usuarioId = usuarioResult.insertId;

    // Insere no perfil adequado
    if (tipo === "Aluno") {
      if (!curso_id || !turma) {
        throw new Error("Para tipo Aluno, curso_id e turma são obrigatórios");
      }
      await db.query(
        `INSERT INTO Aluno (usuario_id, curso_id, turma)
         VALUES (?, ?, ?)`,
        [usuarioId, curso_id, turma]
      );
    } else if (tipo === "Professor") {
      await db.query(
        `INSERT INTO Professor (usuario_id)
         VALUES (?)`,
        [usuarioId]
      );
    } else if (tipo === "Administrador") {
      await db.query(
        `INSERT INTO Administrador (usuario_id)
         VALUES (?)`,
        [usuarioId]
      );
    } else {
      throw new Error("Tipo de usuário inválido");
    }

    // Commit
    await db.query("COMMIT");

    return {
      success: true,
      usuarioId,
      message: `Usuário ${nome} criado com sucesso.`,
    };
  } catch (err) {
    await db.query("ROLLBACK");
    return {
      success: false,
      error: err.message,
    };
  }
}

// Cria um curso

export async function createCurso(cursoData) {
  const { nome, descricao } = cursoData;

  try {
    const [result] = await db.query(
      `INSERT INTO Curso (nome, descricao)
       VALUES (?, ?)`,
      [nome, descricao || null]
    );

    return {
      success: true,
      cursoId: result.insertId,
      message: `Curso '${nome}' criado com sucesso.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

//Cria uma nova disciplina vinculada a um curso.

export async function createDisciplina(disciplinaData) {
  const { nome, curso_id } = disciplinaData;

  try {
    const [result] = await db.query(
      `INSERT INTO Disciplina (nome, curso_id)
       VALUES (?, ?)`,
      [nome, curso_id]
    );

    return {
      success: true,
      disciplinaId: result.insertId,
      message: `Disciplina '${nome}' criada com sucesso no curso ${curso_id}.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

//Remove um curso pelo ID.
//Isso também remove todas as disciplinas ligadas a ele (por ON DELETE CASCADE).

export async function deleteCurso(cursoId) {
  try {
    const [result] = await db.query(`DELETE FROM Curso WHERE curso_id = ?`, [
      cursoId,
    ]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: `Nenhum curso com ID ${cursoId} foi encontrado.`,
      };
    }

    return {
      success: true,
      message: `Curso ID ${cursoId} e disciplinas relacionadas foram removidos com sucesso.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

//Remove uma disciplina pelo ID.

export async function deleteDisciplina(disciplinaId) {
  try {
    const [result] = await db.query(
      `DELETE FROM Disciplina WHERE disciplina_id = ?`,
      [disciplinaId]
    );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: `Nenhuma disciplina com ID ${disciplinaId} foi encontrada.`,
      };
    }

    return {
      success: true,
      message: `Disciplina ID ${disciplinaId} removida com sucesso.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

//Deleta um usuário e seus dados relacionados (Aluno, Professor ou Administrador).
//Requer que o ID exista na tabela Usuario.

export async function deleteUsuario(usuarioId) {
  try {
    const [result] = await db.query(
      `DELETE FROM Usuario WHERE usuario_id = ?`,
      [usuarioId]
    );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: `Usuário com ID ${usuarioId} não encontrado.`,
      };
    }

    return {
      success: true,
      message: `Usuário ID ${usuarioId} e dados relacionados foram removidos com sucesso.`,
    };
  } catch (err) {
    return {
      success: false,
      error: `Erro ao deletar usuário: ${err.message}`,
    };
  }
}

//Lista todos os cursos com suas disciplinas associadas.

export async function getCursosComDisciplinas() {
  try {
    // Consulta cursos
    const [cursos] = await db.query(`
      SELECT curso_id, nome, descricao FROM Curso
    `);

    // Consulta todas as disciplinas
    const [disciplinas] = await db.query(`
      SELECT disciplina_id, nome, curso_id FROM Disciplina
    `);

    // Mapeia disciplinas para seus respectivos cursos
    const cursosComDisciplinas = cursos.map((curso) => {
      const relacionadas = disciplinas
        .filter((d) => d.curso_id === curso.curso_id)
        .map((d) => ({
          disciplina_id: d.disciplina_id,
          nome: d.nome,
        }));

      return {
        ...curso,
        disciplinas: relacionadas,
      };
    });

    return {
      success: true,
      data: cursosComDisciplinas,
    };
  } catch (err) {
    return {
      success: false,
      error: `Erro ao buscar cursos e disciplinas: ${err.message}`,
    };
  }
}

// função de login de usuario

export async function loginUser(email, senha) {
  try {
    const [rows] = await db.query(
      `SELECT usuario_id, nome, tipo FROM Usuario WHERE email = ? AND senha = ?`,
      [email, senha]
    );

    if (rows.length === 0) {
      return {
        success: false,
        message: "Email ou senha inválidos.",
      };
    }

    const usuario = rows[0];

    return {
      success: true,
      message: `Login bem-sucedido. Bem-vindo, ${usuario.nome}!`,
      usuario: {
        id: usuario.usuario_id,
        nome: usuario.nome,
        tipo: usuario.tipo,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: `Erro ao realizar login: ${err.message}`,
    };
  }
}

//Função de listagem

export async function getAllCursos() {
  try {
    const [cursos] = await db.query(
      `SELECT curso_id, nome, descricao FROM Curso`
    );

    return {
      success: true,
      data: cursos,
    };
  } catch (err) {
    return {
      success: false,
      error: `Erro ao buscar cursos: ${err.message}`,
    };
  }
}

//Função para loguin do usuario.

export async function loginUser(email, senha) {
  try {
    const [rows] = await db.query(
      `SELECT usuario_id, nome, senha, tipo FROM Usuario WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const usuario = rows[0];

    if (usuario.senha !== senha) {
      return { success: false, error: "Senha incorreta" };
    }

    return {
      success: true,
      usuarioId: usuario.usuario_id,
      nome: usuario.nome,
      tipo: usuario.tipo,
    };
  } catch (err) {
    console.error("Erro no login:", err.message);
    return { success: false, error: "Erro no banco de dados" };
  }
}

//Verifica se há um usuário logado na sessão.

export function verificarUsuarioLogado(req) {
  if (req.session && req.session.usuario) {
    const { id, nome, tipo } = req.session.usuario;
    return {
      logado: true,
      id,
      nome,
      tipo,
    };
  } else {
    return {
      logado: false,
    };
  }
}

//Listagem das aulas

export async function listarAulas() {
  try {
    const [rows] = await db.query(`
      SELECT 
        va.aula_id,
        va.titulo AS titulo_aula,
        va.url,
        d.nome AS nome_disciplina,
        c.nome AS nome_curso
      FROM VideoAula va
      INNER JOIN Disciplina d ON va.disciplina_id = d.disciplina_id
      INNER JOIN Curso c ON d.curso_id = c.curso_id
      ORDER BY c.nome, d.nome, va.titulo
    `);

    return rows;
  } catch (err) {
    console.error("Erro ao listar aulas:", err.message);
    return { error: err.message };
  }
}

//Lista atividades com informações da disciplina e curso.
//Sé diciplinaId não for pacado listara todas as diciplinas.

export async function listarAtividades(disciplinaId = null) {
  try {
    let sql = `
      SELECT 
        a.atividade_id,
        a.titulo,
        a.descricao,
        a.tipo,
        a.data_entrega,
        d.nome AS nome_disciplina,
        c.nome AS nome_curso
      FROM Atividade a
      INNER JOIN Disciplina d ON a.disciplina_id = d.disciplina_id
      INNER JOIN Curso c ON d.curso_id = c.curso_id
    `;

    const params = [];

    if (disciplinaId !== null) {
      sql += ` WHERE a.disciplina_id = ?`;
      params.push(disciplinaId);
    }

    sql += ` ORDER BY a.data_entrega`;

    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.error("Erro ao listar atividades:", err.message);
    return { error: err.message };
  }
}

//Lista notas dos alunos com filtos por aluno e/ou diciplina.

export async function listarNotas(alunoId = null, disciplinaId = null) {
  try {
    let sql = `
      SELECT 
        n.id,
        n.nota,
        n.tipo_avaliacao,
        a.titulo AS atividade,
        d.nome AS disciplina,
        u.nome AS aluno
      FROM Nota n
      INNER JOIN Atividade a ON n.atividade_id = a.atividade_id
      INNER JOIN Disciplina d ON a.disciplina_id = d.disciplina_id
      INNER JOIN Aluno al ON n.aluno_id = al.aluno_id
      INNER JOIN Usuario u ON al.usuario_id = u.usuario_id
      WHERE 1 = 1
    `;

    const params = [];

    if (alunoId !== null) {
      sql += ` AND n.aluno_id = ?`;
      params.push(alunoId);
    }

    if (disciplinaId !== null) {
      sql += ` AND d.disciplina_id = ?`;
      params.push(disciplinaId);
    }

    sql += ` ORDER BY u.nome, d.nome, a.titulo`;

    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.error("Erro ao listar notas:", err.message);
    return { error: err.message };
  }
}

export async function updateUsuario(usuarioId, dados) {
  try {
    const { nome, email, senha } = dados;

    let query = `UPDATE usuarios SET nome = ?, email = ?`;
    const valores = [nome, email];

    if (senha && senha.length > 0) {
      query += `, senha = ?`;
      valores.push(senha);
    }

    query += ` WHERE usuario_id = ?`;
    valores.push(usuarioId);

    await db.query(query, valores);
    return { success: true, message: "Perfil atualizado com sucesso!" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
