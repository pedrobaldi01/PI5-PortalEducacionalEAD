const { executar, transacao } = require('../database/conexao');
const { formatarData, formatarDataHora } = require('../utils/mapeadores');
const { gerarHashSenha } = require('../utils/senhas');
const {
  textoValido,
  emailValido,
  dataISOValida,
  cpfValido,
  somenteDigitos,
  normalizarEmail,
  exigirCampos
} = require('../utils/validacoes');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

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

const selectBase = `
  SELECT a.aluno_id, u.usuario_id, u.nome, u.cpf, u.data_nascimento,
         u.email, u.telefone, u.endereco, u.login, u.status, u.data_cadastro
    FROM Aluno a
    JOIN Usuario u ON u.usuario_id = a.usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE a.aluno_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Aluno não encontrado.');
  return linhas[0];
}

async function listarAlunos(_req, res) {
  const linhas = await executar(`${selectBase} WHERE u.status = 'Ativo' ORDER BY u.nome`);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatarAluno) });
}

async function buscarAlunoPorId(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  return res.status(200).json({ dados: formatarAluno(registro) });
}

async function buscarMeuPerfil(req, res) {
  if (!req.usuario.aluno_id) throw new AppError(404, 'Perfil de aluno não encontrado.');
  const registro = await buscarRegistro(req.usuario.aluno_id);
  return res.status(200).json({ dados: formatarAluno(registro) });
}

function validarCriacao(body) {
  const faltantes = exigirCampos(body, [
    'nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'endereco', 'login', 'senha'
  ]);
  if (faltantes.length) throw new AppError(400, `Campos obrigatórios: ${faltantes.join(', ')}.`);

  const cpf = somenteDigitos(body.cpf);
  if (!cpfValido(cpf)) throw new AppError(400, 'CPF inválido.');
  if (!dataISOValida(body.dataNascimento)) throw new AppError(400, 'Data de nascimento inválida. Use YYYY-MM-DD.');
  if (!emailValido(body.email)) throw new AppError(400, 'E-mail inválido.');
  if (String(body.senha).length < 6) throw new AppError(400, 'A senha deve possuir ao menos 6 caracteres.');

  return { cpf, email: normalizarEmail(body.email) };
}

async function criarAluno(req, res) {
  const { cpf, email } = validarCriacao(req.body);
  const { nome, dataNascimento, telefone, endereco, login, senha } = req.body;

  const dados = await transacao(async (conexao) => {
    const [duplicados] = await conexao.execute(
      'SELECT usuario_id FROM Usuario WHERE login = ? OR email = ? OR cpf = ? LIMIT 1',
      [login.trim(), email, cpf]
    );
    if (duplicados.length) throw new AppError(409, 'Login, e-mail ou CPF já cadastrado.');

    const senhaHash = await gerarHashSenha(senha);
    const [usuarioResultado] = await conexao.execute(
      `INSERT INTO Usuario
        (nome, cpf, data_nascimento, email, telefone, endereco, login, senha, tipo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Aluno')`,
      [nome.trim(), cpf, dataNascimento, email, telefone.trim(), endereco.trim(), login.trim(), senhaHash]
    );

    const [alunoResultado] = await conexao.execute(
      'INSERT INTO Aluno (usuario_id) VALUES (?)',
      [usuarioResultado.insertId]
    );

    const [linhas] = await conexao.execute(
      `${selectBase} WHERE a.aluno_id = ? LIMIT 1`,
      [alunoResultado.insertId]
    );
    return linhas[0];
  });

  return res.status(201).json({ mensagem: 'Aluno criado com sucesso.', dados: formatarAluno(dados) });
}

async function atualizarAluno(req, res) {
  const alunoId = obterId(req.params.id);
  const atual = await buscarRegistro(alunoId);
  const body = req.body;

  if (!Object.keys(body).length) throw new AppError(400, 'Informe ao menos um campo para atualizar.');

  const camposUsuario = [];
  const valoresUsuario = [];

  if (Object.hasOwn(body, 'nome')) {
    if (!textoValido(body.nome)) throw new AppError(400, 'Nome inválido.');
    camposUsuario.push('nome = ?'); valoresUsuario.push(body.nome.trim());
  }
  if (Object.hasOwn(body, 'cpf')) {
    const cpf = somenteDigitos(body.cpf);
    if (!cpfValido(cpf)) throw new AppError(400, 'CPF inválido.');
    camposUsuario.push('cpf = ?'); valoresUsuario.push(cpf);
  }
  if (Object.hasOwn(body, 'dataNascimento')) {
    if (!dataISOValida(body.dataNascimento)) throw new AppError(400, 'Data de nascimento inválida.');
    camposUsuario.push('data_nascimento = ?'); valoresUsuario.push(body.dataNascimento);
  }
  if (Object.hasOwn(body, 'email')) {
    if (!emailValido(body.email)) throw new AppError(400, 'E-mail inválido.');
    camposUsuario.push('email = ?'); valoresUsuario.push(normalizarEmail(body.email));
  }
  for (const [api, banco] of [['telefone', 'telefone'], ['endereco', 'endereco'], ['login', 'login']]) {
    if (Object.hasOwn(body, api)) {
      if (!textoValido(body[api])) throw new AppError(400, `${api} inválido.`);
      camposUsuario.push(`${banco} = ?`); valoresUsuario.push(body[api].trim());
    }
  }
  if (Object.hasOwn(body, 'status')) {
    if (!['Ativo', 'Inativo'].includes(body.status)) throw new AppError(400, 'Status deve ser Ativo ou Inativo.');
    camposUsuario.push('status = ?'); valoresUsuario.push(body.status);
  }
  if (Object.hasOwn(body, 'senha')) {
    if (String(body.senha).length < 6) throw new AppError(400, 'A senha deve possuir ao menos 6 caracteres.');
    camposUsuario.push('senha = ?'); valoresUsuario.push(await gerarHashSenha(body.senha));
  }

  if (!camposUsuario.length) throw new AppError(400, 'Nenhum campo reconhecido para atualização.');

  valoresUsuario.push(atual.usuario_id);
  await executar(`UPDATE Usuario SET ${camposUsuario.join(', ')} WHERE usuario_id = ?`, valoresUsuario);

  const atualizado = await buscarRegistro(alunoId);
  return res.status(200).json({ mensagem: 'Aluno atualizado com sucesso.', dados: formatarAluno(atualizado) });
}

async function removerAluno(req, res) {
  const alunoId = obterId(req.params.id);
  const atual = await buscarRegistro(alunoId);
  await executar("UPDATE Usuario SET status = 'Inativo' WHERE usuario_id = ?", [atual.usuario_id]);
  return res.status(200).json({ mensagem: 'Aluno inativado com sucesso.' });
}

module.exports = {
  listarAlunos,
  buscarAlunoPorId,
  buscarMeuPerfil,
  criarAluno,
  atualizarAluno,
  removerAluno
};
