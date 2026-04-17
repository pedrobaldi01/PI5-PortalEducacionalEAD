CREATE DATABASE escola_ead;
USE escola_ead;

CREATE TABLE Usuario (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('Aluno', 'Professor', 'Administrador') NOT NULL
);

CREATE TABLE Curso (
    curso_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
);

CREATE TABLE Aluno (
    aluno_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    curso_id INT,
    turma VARCHAR(50) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES Curso(curso_id) ON DELETE CASCADE
);

CREATE TABLE Professor (
    professor_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id) ON DELETE CASCADE
);

CREATE TABLE Administrador (
    administrador_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id) ON DELETE CASCADE
);

CREATE TABLE Disciplina (
    disciplina_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    curso_id INT NOT NULL,
    FOREIGN KEY (curso_id) REFERENCES Curso(curso_id) ON DELETE CASCADE
);

CREATE TABLE Professor_Disciplina (
    professor_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    PRIMARY KEY (professor_id, disciplina_id),
    FOREIGN KEY (professor_id) REFERENCES Professor(professor_id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES Disciplina(disciplina_id) ON DELETE CASCADE
); – TABELA INTERMEDIÁRIA ENTRE ALUNO E PROFESSOR

CREATE TABLE VideoAula (
    aula_id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    url VARCHAR(255) NOT NULL,
    disciplina_id INT NOT NULL,
    FOREIGN KEY (disciplina_id) REFERENCES Disciplina(disciplina_id) ON DELETE CASCADE
);

CREATE TABLE Atividade (
    atividade_id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    tipo ENUM('Trabalho', 'Prova') NOT NULL,
    disciplina_id INT NOT NULL,
    data_entrega DATE,
    FOREIGN KEY (disciplina_id) REFERENCES Disciplina(disciplina_id) ON DELETE CASCADE
);

CREATE TABLE Nota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nota DECIMAL(5,2) NOT NULL,
    tipo_avaliacao ENUM('Av1', 'Av2', 'Recuperação') NOT NULL,
    atividade_id INT NOT NULL,
    aluno_id INT NOT NULL,
    FOREIGN KEY (atividade_id) REFERENCES Atividade(atividade_id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES Aluno(aluno_id) ON DELETE CASCADE
);

CREATE TABLE Aluno_Atividade (
    aluno_id INT NOT NULL,
    atividade_id INT NOT NULL,
    status ENUM('Pendente', 'Concluída', 'Atrasada') NOT NULL,
    PRIMARY KEY (aluno_id, atividade_id),
    FOREIGN KEY (aluno_id) REFERENCES Aluno(aluno_id) ON DELETE CASCADE,
    FOREIGN KEY (atividade_id) REFERENCES Atividade(atividade_id) ON DELETE CASCADE
); – TABELA INTERMEDIÁRIA ENTRE ALUNO E ATIVIDADE

CREATE INDEX idx_email_usuario ON Usuario(email);
CREATE INDEX idx_curso_id_aluno ON Aluno(curso_id);
CREATE INDEX idx_disciplina_id ON Disciplina(disciplina_id);

