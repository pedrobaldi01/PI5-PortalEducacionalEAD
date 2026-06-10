const { executar, transacao } = require('../database/conexao');
const { formatarDataHora } = require('../utils/mapeadores');
const { gerarHashSenha } = require('../utils/senhas');
const { textoValido } = require('../utils/validacoes');

function formatarProfessor(linha) {
  return {
    id: linha.professor_id,
    usuarioId: linha.usuario_id,
    nome: linha.nome,
    cpf: linha.cpf,
    especialidade: linha.especialidade,
    email: linha.email,
    telefone: linha.telefone,
    endereco: linha.endereco,
    login: linha.login,
    status: linha.status,
    criadoEm: formatarDataHora(linha.data_cadastro)
  };
}

function erroValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.statusCode = 400;
  return erro;
}

async function criarProfessor(req, res, next) {
  try {
    const {
      nome,
      cpf,
      especialidade,
      email,
      telefone,
      endereco,
      login,
      senha
    } = req.body;

    if (
      !textoValido(nome) ||
      !textoValido(cpf) ||
      !textoValido(especialidade) ||
      !textoValido(email) ||
      !textoValido(telefone) ||
      !textoValido(login) ||
      !textoValido(senha)
    ) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: nome, cpf, especialidade, email, telefone, login e senha.'
      });
    }

    const professorCriado = await transacao(async (conexao) => {
      const [duplicados] = await conexao.execute(
        `SELECT usuario_id
           FROM Usuario
          WHERE login = ? OR email = ? OR cpf = ?
          LIMIT 1`,
        [login.trim(), email.trim().toLowerCase(), cpf.trim()]
      );

      if (duplicados.length > 0) {
        throw erroValidacao('Já existe usuário com este login, e-mail ou CPF.');
      }

      const [usuarioResultado] = await conexao.execute(
        `INSERT INTO Usuario
          (nome, cpf, email, telefone, endereco, login, senha, tipo)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Professor')`,
        [
          nome.trim(),
          cpf.trim(),
          email.trim().toLowerCase(),
          telefone.trim(),
          textoValido(endereco) ? endereco.trim() : null,
          login.trim(),
          gerarHashSenha(senha)
        ]
      );

      const usuarioId = usuarioResultado.insertId;

      const [professorResultado] = await conexao.execute(
        'INSERT INTO Professor (usuario_id, especialidade) VALUES (?, ?)',
        [usuarioId, especialidade.trim()]
      );

      return {
        professor_id: professorResultado.insertId,
        usuario_id: usuarioId,
        nome: nome.trim(),
        cpf: cpf.trim(),
        especialidade: especialidade.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        endereco: textoValido(endereco) ? endereco.trim() : null,
        login: login.trim(),
        status: 'Ativo',
        data_cadastro: new Date().toISOString()
      };
    });

    return res.status(201).json({
      mensagem: 'Professor criado com sucesso.',
      dados: formatarProfessor(professorCriado)
    });
  } catch (erro) {
    if (erro.statusCode) {
      return res.status(erro.statusCode).json({ erro: erro.message });
    }

    return next(erro);
  }
}

async function listarProfessores(req, res, next) {
  try {
    const professores = await executar(
      `SELECT p.professor_id, p.especialidade, u.usuario_id, u.nome, u.cpf,
              u.email, u.telefone, u.endereco, u.login, u.status, u.data_cadastro
         FROM Professor p
         JOIN Usuario u ON u.usuario_id = p.usuario_id
        ORDER BY u.nome`
    );

    return res.status(200).json({
      total: professores.length,
      dados: professores.map(formatarProfessor)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarProfessor,
  listarProfessores
};
