const { executar, transacao } = require('../database/conexao');
const { formatarData, formatarDataHora } = require('../utils/mapeadores');
const { gerarHashSenha } = require('../utils/senhas');
const { textoValido } = require('../utils/validacoes');

function formatarAluno(linha) {
  return {
    id: linha.aluno_id,
    usuarioId: linha.usuario_id,
    nome: linha.nome,
    cpf: linha.cpf,
    dataNascimento: formatarData(linha.data_nascimento),
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

async function criarAluno(req, res, next) {
  try {
    const {
      nome,
      cpf,
      dataNascimento,
      email,
      telefone,
      endereco,
      login,
      senha
    } = req.body;

    if (
      !textoValido(nome) ||
      !textoValido(cpf) ||
      !textoValido(dataNascimento) ||
      !textoValido(email) ||
      !textoValido(telefone) ||
      !textoValido(endereco) ||
      !textoValido(login) ||
      !textoValido(senha)
    ) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: nome, cpf, dataNascimento, email, telefone, endereco, login e senha.'
      });
    }

    const alunoCriado = await transacao(async (conexao) => {
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
          (nome, cpf, data_nascimento, email, telefone, endereco, login, senha, tipo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Aluno')`,
        [
          nome.trim(),
          cpf.trim(),
          dataNascimento.trim(),
          email.trim().toLowerCase(),
          telefone.trim(),
          endereco.trim(),
          login.trim(),
          gerarHashSenha(senha)
        ]
      );

      const usuarioId = usuarioResultado.insertId;

      const [alunoResultado] = await conexao.execute(
        'INSERT INTO Aluno (usuario_id) VALUES (?)',
        [usuarioId]
      );

      return {
        aluno_id: alunoResultado.insertId,
        usuario_id: usuarioId,
        nome: nome.trim(),
        cpf: cpf.trim(),
        data_nascimento: dataNascimento.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        login: login.trim(),
        status: 'Ativo',
        data_cadastro: new Date().toISOString()
      };
    });

    return res.status(201).json({
      mensagem: 'Aluno criado com sucesso.',
      dados: formatarAluno(alunoCriado)
    });
  } catch (erro) {
    if (erro.statusCode) {
      return res.status(erro.statusCode).json({ erro: erro.message });
    }

    return next(erro);
  }
}

async function listarAlunos(req, res, next) {
  try {
    const alunos = await executar(
      `SELECT a.aluno_id, u.usuario_id, u.nome, u.cpf, u.data_nascimento,
              u.email, u.telefone, u.endereco, u.login, u.status, u.data_cadastro
         FROM Aluno a
         JOIN Usuario u ON u.usuario_id = a.usuario_id
        ORDER BY u.nome`
    );

    return res.status(200).json({
      total: alunos.length,
      dados: alunos.map(formatarAluno)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criarAluno,
  listarAlunos
};
