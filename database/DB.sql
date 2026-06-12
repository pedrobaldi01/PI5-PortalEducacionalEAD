CREATE DATABASE IF NOT EXISTS escola_ead;
USE escola_ead;

CREATE TABLE Usuario (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    endereco VARCHAR(255),
    login VARCHAR(50) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('Aluno', 'Professor', 'Administrador', 'Coordenador') NOT NULL,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE Curso (
    curso_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    carga_horaria_total INT NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo'
);


CREATE TABLE Aluno (
    aluno_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id) ON DELETE CASCADE
);


CREATE TABLE Professor (
    professor_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    especialidade VARCHAR(100) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id) ON DELETE CASCADE
);


CREATE TABLE Administrador (
    administrador_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id) ON DELETE CASCADE
);


CREATE TABLE Coordenador (
    coordenador_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    curso_id INT,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES Curso(curso_id) ON DELETE SET NULL
);


CREATE TABLE Disciplina (
    disciplina_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    carga_horaria INT NOT NULL,
    professor_responsavel_id INT NOT NULL,
    FOREIGN KEY (professor_responsavel_id) REFERENCES Professor(professor_id) ON DELETE RESTRICT
);


CREATE TABLE Curso_Disciplina (
    curso_disciplina_id INT AUTO_INCREMENT PRIMARY KEY,
    curso_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    sequencia INT NOT NULL,
    FOREIGN KEY (curso_id) REFERENCES Curso(curso_id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES Disciplina(disciplina_id) ON DELETE CASCADE,
    UNIQUE (curso_id, disciplina_id),
    UNIQUE (curso_id, sequencia)
);


CREATE TABLE Turma (
    turma_id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,
    periodo_letivo VARCHAR(30) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    status ENUM('Aberta', 'Em andamento', 'Encerrada', 'Cancelada') NOT NULL DEFAULT 'Aberta',
    FOREIGN KEY (disciplina_id) REFERENCES Disciplina(disciplina_id) ON DELETE RESTRICT,
    FOREIGN KEY (professor_id) REFERENCES Professor(professor_id) ON DELETE RESTRICT
);


CREATE TABLE Matricula (
    matricula_id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    turma_id INT NOT NULL,
    data_matricula DATE NOT NULL DEFAULT (CURRENT_DATE),
    status_matricula ENUM('Ativa', 'Trancada', 'Cancelada', 'Concluída') NOT NULL DEFAULT 'Ativa',
    FOREIGN KEY (aluno_id) REFERENCES Aluno(aluno_id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES Turma(turma_id) ON DELETE CASCADE,
    UNIQUE (aluno_id, turma_id)
);


CREATE TABLE ArquivoUpload (
    arquivo_id INT AUTO_INCREMENT PRIMARY KEY,
    nome_original VARCHAR(255) NOT NULL,
    caminho_arquivo VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamanho_bytes INT NOT NULL,
    usuario_id INT NOT NULL,
    data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id) ON DELETE CASCADE
);


CREATE TABLE MaterialDidatico (
    material_id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    arquivo_id INT,
    link VARCHAR(255),
    data_postagem DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    turma_id INT NOT NULL,
    professor_id INT NOT NULL,
    FOREIGN KEY (arquivo_id) REFERENCES ArquivoUpload(arquivo_id) ON DELETE SET NULL,
    FOREIGN KEY (turma_id) REFERENCES Turma(turma_id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES Professor(professor_id) ON DELETE RESTRICT
);


CREATE TABLE Atividade (
    atividade_id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_entrega DATETIME,
    nota_maxima DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    turma_id INT NOT NULL,
    professor_id INT NOT NULL,
    avaliativa BOOLEAN NOT NULL DEFAULT TRUE,
    status ENUM('Aberta', 'Encerrada', 'Cancelada') NOT NULL DEFAULT 'Aberta',
    FOREIGN KEY (turma_id) REFERENCES Turma(turma_id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES Professor(professor_id) ON DELETE RESTRICT
);


CREATE TABLE EnvioAtividade (
    envio_id INT AUTO_INCREMENT PRIMARY KEY,
    atividade_id INT NOT NULL,
    aluno_id INT NOT NULL,
    arquivo_id INT,
    data_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentario TEXT,
    status ENUM('Enviada', 'Atrasada', 'Reenviada', 'Corrigida') NOT NULL DEFAULT 'Enviada',
    FOREIGN KEY (atividade_id) REFERENCES Atividade(atividade_id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES Aluno(aluno_id) ON DELETE CASCADE,
    FOREIGN KEY (arquivo_id) REFERENCES ArquivoUpload(arquivo_id) ON DELETE SET NULL,
    UNIQUE (atividade_id, aluno_id)
);


CREATE TABLE Nota (
    nota_id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    atividade_id INT NOT NULL,
    nota DECIMAL(5,2) NOT NULL,
    feedback TEXT,
    data_correcao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    professor_responsavel_id INT NOT NULL,
    FOREIGN KEY (aluno_id) REFERENCES Aluno(aluno_id) ON DELETE CASCADE,
    FOREIGN KEY (atividade_id) REFERENCES Atividade(atividade_id) ON DELETE CASCADE,
    FOREIGN KEY (professor_responsavel_id) REFERENCES Professor(professor_id) ON DELETE RESTRICT,
    UNIQUE (aluno_id, atividade_id),
    CHECK (nota >= 0)
);


CREATE TABLE Aviso (
    aviso_id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    data_publicacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    turma_id INT NOT NULL,
    autor_usuario_id INT NOT NULL,
    FOREIGN KEY (turma_id) REFERENCES Turma(turma_id) ON DELETE CASCADE,
    FOREIGN KEY (autor_usuario_id) REFERENCES Usuario(usuario_id) ON DELETE RESTRICT
);


CREATE INDEX idx_usuario_email ON Usuario(email);
CREATE INDEX idx_usuario_login ON Usuario(login);
CREATE INDEX idx_usuario_tipo ON Usuario(tipo);
CREATE INDEX idx_curso_status ON Curso(status); 
CREATE INDEX idx_disciplina_professor ON Disciplina(professor_responsavel_id);
CREATE INDEX idx_turma_disciplina ON Turma(disciplina_id);
CREATE INDEX idx_turma_professor ON Turma(professor_id);
CREATE INDEX idx_matricula_aluno ON Matricula(aluno_id);
CREATE INDEX idx_matricula_turma ON Matricula(turma_id);
CREATE INDEX idx_material_turma ON MaterialDidatico(turma_id);
CREATE INDEX idx_atividade_turma ON Atividade(turma_id);
CREATE INDEX idx_envio_atividade ON EnvioAtividade(atividade_id);
CREATE INDEX idx_nota_aluno ON Nota(aluno_id);
CREATE INDEX idx_aviso_turma ON Aviso(turma_id);


INSERT IGNORE INTO Usuario (
    nome,
    email,
    login,
    senha,
    tipo,
    status
) VALUES (
    'Administrador',
    'admin@portal.local',
    'admin',
    'scrypt:portaldevadminseed:617406a5e681c9b87dff4cb6c2436f7d497489336d259b8ac3b8750f041562c8f6fe6e58d87be302af53c6ee02a8cb0c765597cbef716ff33a33b3daf44b0bc3',
    'Administrador',
    'Ativo'
);

INSERT IGNORE INTO Administrador (usuario_id)
SELECT usuario_id
FROM Usuario
WHERE login = 'admin';


INSERT IGNORE INTO Usuario (
    nome,
    email,
    login,
    senha,
    tipo,
    status
) VALUES
(
    'Marcos Andre Lucas',
    'mlucas@uricer.edu.br',
    'marcos.lucas',
    'scrypt:portaldevprofseed:75e442e6ec5225cf28c67211efb3edcf247ae2071df31827a8f2ac55beea0992870fda2fcf475b251bdde0b370fc66bac7d93467646eb708737ce52cc37ecf2d',
    'Professor',
    'Ativo'
),
(
    'Daniel Menin Tortelli',
    'danielmenintortelli@uricer.edu.br',
    'daniel.tortelli',
    'scrypt:portaldevprofseed:75e442e6ec5225cf28c67211efb3edcf247ae2071df31827a8f2ac55beea0992870fda2fcf475b251bdde0b370fc66bac7d93467646eb708737ce52cc37ecf2d',
    'Professor',
    'Ativo'
),
(
    'Douglas Tagliari Dos Santos',
    'dtagliari@uricer.edu.br',
    'douglas.santos',
    'scrypt:portaldevprofseed:75e442e6ec5225cf28c67211efb3edcf247ae2071df31827a8f2ac55beea0992870fda2fcf475b251bdde0b370fc66bac7d93467646eb708737ce52cc37ecf2d',
    'Professor',
    'Ativo'
),
(
    'Malomar Alex Seminotti',
    'malomar@uricer.edu.br',
    'malomar.seminotti',
    'scrypt:portaldevprofseed:75e442e6ec5225cf28c67211efb3edcf247ae2071df31827a8f2ac55beea0992870fda2fcf475b251bdde0b370fc66bac7d93467646eb708737ce52cc37ecf2d',
    'Professor',
    'Ativo'
),
(
    'Hélio Leal Barcelos',
    'helio.barcelos@urisantiago.br',
    'helio.barcelos',
    'scrypt:portaldevprofseed:75e442e6ec5225cf28c67211efb3edcf247ae2071df31827a8f2ac55beea0992870fda2fcf475b251bdde0b370fc66bac7d93467646eb708737ce52cc37ecf2d',
    'Professor',
    'Ativo'
);

INSERT IGNORE INTO Professor (usuario_id, especialidade)
SELECT usuario_id, 'Computação'
FROM Usuario
WHERE login IN (
    'marcos.lucas',
    'daniel.tortelli',
    'douglas.santos',
    'malomar.seminotti',
    'helio.barcelos'
);

INSERT INTO Curso (
    nome,
    descricao,
    carga_horaria_total,
    categoria,
    status
)
SELECT
    'Sistemas de Informação - 5º Semestre',
    'Curso base para as disciplinas do quinto semestre.',
    950,
    'Tecnologia',
    'Ativo'
WHERE NOT EXISTS (
    SELECT 1
    FROM Curso
    WHERE nome = 'Sistemas de Informação - 5º Semestre'
);

INSERT INTO Disciplina (
    nome,
    descricao,
    carga_horaria,
    professor_responsavel_id
)
SELECT
    'Processamento de Imagens',
    'Disciplina de processamento e análise de imagens digitais.',
    200,
    p.professor_id
FROM Professor p
JOIN Usuario u ON u.usuario_id = p.usuario_id
WHERE u.login = 'daniel.tortelli'
  AND NOT EXISTS (
      SELECT 1
      FROM Disciplina
      WHERE nome = 'Processamento de Imagens'
  );

INSERT INTO Disciplina (
    nome,
    descricao,
    carga_horaria,
    professor_responsavel_id
)
SELECT
    'Programação Paralela e Distribuída',
    'Disciplina de programação paralela, concorrente e distribuída.',
    100,
    p.professor_id
FROM Professor p
JOIN Usuario u ON u.usuario_id = p.usuario_id
WHERE u.login = 'marcos.lucas'
  AND NOT EXISTS (
      SELECT 1
      FROM Disciplina
      WHERE nome = 'Programação Paralela e Distribuída'
  );

INSERT INTO Disciplina (
    nome,
    descricao,
    carga_horaria,
    professor_responsavel_id
)
SELECT
    'Programação Web',
    'Disciplina de desenvolvimento de aplicações para a web.',
    200,
    p.professor_id
FROM Professor p
JOIN Usuario u ON u.usuario_id = p.usuario_id
WHERE u.login = 'douglas.santos'
  AND NOT EXISTS (
      SELECT 1
      FROM Disciplina
      WHERE nome = 'Programação Web'
  );

INSERT INTO Disciplina (
    nome,
    descricao,
    carga_horaria,
    professor_responsavel_id
)
SELECT
    'Projeto Integrador V - Desenvolvimento Avançado de Aplicações',
    'Disciplina de projeto integrador para desenvolvimento avançado de aplicações.',
    150,
    p.professor_id
FROM Professor p
JOIN Usuario u ON u.usuario_id = p.usuario_id
WHERE u.login = 'malomar.seminotti'
  AND NOT EXISTS (
      SELECT 1
      FROM Disciplina
      WHERE nome = 'Projeto Integrador V - Desenvolvimento Avançado de Aplicações'
  );

INSERT INTO Disciplina (
    nome,
    descricao,
    carga_horaria,
    professor_responsavel_id
)
SELECT
    'Redes e Telecomunicações',
    'Disciplina de fundamentos, protocolos e infraestrutura de redes.',
    200,
    p.professor_id
FROM Professor p
JOIN Usuario u ON u.usuario_id = p.usuario_id
WHERE u.login = 'marcos.lucas'
  AND NOT EXISTS (
      SELECT 1
      FROM Disciplina
      WHERE nome = 'Redes e Telecomunicações'
  );

INSERT INTO Disciplina (
    nome,
    descricao,
    carga_horaria,
    professor_responsavel_id
)
SELECT
    'Tópicos Especiais em Computação I',
    'Disciplina de tópicos especiais em computação.',
    100,
    p.professor_id
FROM Professor p
JOIN Usuario u ON u.usuario_id = p.usuario_id
WHERE u.login = 'helio.barcelos'
  AND NOT EXISTS (
      SELECT 1
      FROM Disciplina
      WHERE nome = 'Tópicos Especiais em Computação I'
  );

INSERT IGNORE INTO Curso_Disciplina (curso_id, disciplina_id, sequencia)
SELECT c.curso_id, d.disciplina_id, dados.sequencia
FROM Curso c
CROSS JOIN (
    SELECT 'Processamento de Imagens' AS nome, 1 AS sequencia
    UNION ALL SELECT 'Programação Paralela e Distribuída', 2
    UNION ALL SELECT 'Programação Web', 3
    UNION ALL SELECT 'Projeto Integrador V - Desenvolvimento Avançado de Aplicações', 4
    UNION ALL SELECT 'Redes e Telecomunicações', 5
    UNION ALL SELECT 'Tópicos Especiais em Computação I', 6
) dados
JOIN Disciplina d ON d.nome = dados.nome
WHERE c.nome = 'Sistemas de Informação - 5º Semestre';
