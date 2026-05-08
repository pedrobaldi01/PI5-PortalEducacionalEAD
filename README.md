# Back-end EAD simples com login

Este projeto é um back-end simples para a primeira entrega de um sistema EAD.

Ele foi feito com:

- Node.js
- Express
- Dados salvos em memória
- Login básico

## O que o projeto faz

O sistema permite:

- Fazer login
- Criar e listar alunos
- Criar e listar professores
- Criar e listar cursos
- Criar e listar disciplinas
- Criar e listar turmas

## O que ele ainda não faz

Nesta primeira versão, ele ainda não possui:

- Banco de dados MySQL
- Upload de arquivos
- Materiais
- Avisos
- Notas
- Atividades
- Edição
- Exclusão

## Observação importante sobre memória

Os dados ficam salvos apenas enquanto o servidor está ligado.

Se você fechar o servidor e abrir de novo, os dados criados somem.

Isso acontece porque ainda não estamos usando banco de dados.

## Usuário inicial para testar

Como o sistema exige login, já existe um usuário administrador inicial:

```json
{
  "login": "admin",
  "senha": "123456"
}
```

Use esse usuário para fazer login primeiro.

## Como rodar o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar arquivo .env

Crie um arquivo chamado `.env` com este conteúdo:

```env
PORT=3000
```

### 3. Rodar o servidor

```bash
npm start
```

Se funcionar, aparecerá:

```bash
Servidor rodando em http://localhost:3000
```

## Como funciona o login

Primeiro você faz login em:

```txt
POST /auth/login
```

Exemplo:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin",
    "senha": "123456"
  }'
```

A resposta será parecida com:

```json
{
  "mensagem": "Login realizado com sucesso.",
  "token": "um-token-gerado-pelo-sistema",
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "login": "admin",
    "perfil": "administrador"
  }
}
```

Copie o valor do `token`.

Depois, nas outras rotas, envie esse token no cabeçalho:

```txt
Authorization: Bearer SEU_TOKEN_AQUI
```

## Rotas disponíveis

Todas essas rotas precisam de login:

```txt
GET  /alunos
POST /alunos

GET  /professores
POST /professores

GET  /cursos
POST /cursos

GET  /disciplinas
POST /disciplinas

GET  /turmas
POST /turmas
```

A única rota principal que não precisa de login é:

```txt
POST /auth/login
```

## Exemplos de uso

### Criar aluno

```bash
curl -X POST http://localhost:3000/alunos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Ana Souza",
    "cpf": "12345678900",
    "dataNascimento": "2000-01-10",
    "email": "ana@exemplo.com",
    "telefone": "54999999999",
    "endereco": "Rua A",
    "login": "ana",
    "senha": "123456"
  }'
```

### Listar alunos

```bash
curl http://localhost:3000/alunos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar professor

```bash
curl -X POST http://localhost:3000/professores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Carlos Lima",
    "cpf": "98765432100",
    "especialidade": "Programação Web",
    "email": "carlos@exemplo.com",
    "telefone": "54988888888",
    "login": "carlos",
    "senha": "123456"
  }'
```

### Listar professores

```bash
curl http://localhost:3000/professores \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar curso

```bash
curl -X POST http://localhost:3000/cursos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Sistemas para Internet",
    "descricao": "Curso voltado ao desenvolvimento web",
    "cargaHorariaTotal": 1200,
    "categoria": "Tecnologia",
    "status": "ativo"
  }'
```

### Listar cursos

```bash
curl http://localhost:3000/cursos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar disciplina

```bash
curl -X POST http://localhost:3000/disciplinas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Programação Web",
    "descricao": "Introdução ao desenvolvimento web",
    "cargaHoraria": 60,
    "professorResponsavelId": 1
  }'
```

### Listar disciplinas

```bash
curl http://localhost:3000/disciplinas \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar turma

```bash
curl -X POST http://localhost:3000/turmas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "codigo": "TURMA-A-2026",
    "nome": "Turma A",
    "disciplinaId": 1,
    "professorId": 1,
    "periodoLetivo": "2026/1",
    "dataInicio": "2026-02-01",
    "dataTermino": "2026-07-01"
  }'
```

### Listar turmas

```bash
curl http://localhost:3000/turmas \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## Explicação simples da estrutura

### src/server.js

Liga o servidor.

### src/app.js

Configura o Express e conecta todas as rotas.

### src/database/memoria.js

Guarda os dados temporários do sistema.

### src/middlewares/auth.middleware.js

Verifica se o usuário enviou um token válido.

### src/routes

Guarda os arquivos com os caminhos da API.

Exemplo:

```txt
/alunos
/professores
/auth/login
```

### src/controllers

Guarda as funções que executam as ações.

Exemplo:

- criar aluno
- listar aluno
- fazer login

## Ordem recomendada para testar

1. Fazer login com admin
2. Criar professor
3. Criar disciplina
4. Criar turma
5. Criar aluno
6. Listar os dados
