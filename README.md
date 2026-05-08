# Portal Educacional EAD

Projeto acadêmico de um **Portal Educacional EAD**, inspirado em plataformas como Moodle, com áreas separadas para **alunos**, **professores** e **administradores**.

O projeto está em fase inicial e atualmente possui:

- uma API em Node.js/Express;
- autenticação simples com token;
- dados temporários salvos em memória;
- estrutura inicial de frontend em HTML, CSS e JavaScript;
- páginas separadas para aluno, professor e administrador;
- componentes visuais reutilizáveis para header, sidebar e footer.

> Observação: neste momento, frontend e backend ainda estão em desenvolvimento e podem não estar totalmente integrados entre si. A integração completa será feita em uma etapa posterior.

---

## Tecnologias utilizadas

- Node.js
- Express
- JavaScript
- HTML5
- CSS3
- Armazenamento temporário em memória

---

## Objetivo do sistema

A ideia do sistema é criar um portal educacional onde diferentes perfis tenham acessos e funções específicas.

### Aluno

O aluno deverá conseguir:

- visualizar disciplinas em que está matriculado;
- acessar conteúdos publicados pelos professores;
- visualizar atividades;
- acompanhar notas lançadas pelos professores.

### Professor

O professor deverá conseguir:

- visualizar as disciplinas em que foi vinculado;
- publicar conteúdos;
- criar atividades;
- lançar notas dos alunos.

### Administrador

O administrador deverá conseguir:

- cadastrar usuários;
- cadastrar cursos;
- cadastrar turmas;
- cadastrar disciplinas;
- organizar vínculos entre alunos, professores, turmas e disciplinas.

---

## Estado atual do projeto

Nesta versão, o projeto possui uma base funcional de backend e uma primeira estrutura de frontend.

### Já existe no backend

- Login básico;
- autenticação por token;
- cadastro e listagem de alunos;
- cadastro e listagem de professores;
- cadastro e listagem de cursos;
- cadastro e listagem de disciplinas;
- cadastro e listagem de turmas;
- dados salvos em memória.

### Já existe no frontend

- tela de login;
- painel do aluno;
- painel do professor;
- painel do administrador;
- header separado em componente HTML;
- sidebar separada por tipo de usuário;
- footer separado em componente HTML;
- CSS base com identidade visual própria;
- JavaScript inicial para carregamento de componentes.

### Ainda não existe ou ainda não está finalizado

- integração completa entre frontend e backend;
- persistência em banco de dados;
- upload de arquivos;
- envio real de atividades;
- lançamento real de notas pelo frontend;
- edição e exclusão de registros;
- controle completo de permissões por tela;
- sistema de materiais/conteúdos integrado ao backend;
- sistema de avisos;
- dashboard com dados reais vindos da API.

---

## Estrutura de pastas

A estrutura atual do projeto está organizada da seguinte forma:

```txt
PI5 - base/
├── database/
│   └── DB.sql
│
├── docs/
│   └── Banco de dados.png
│
├── old/
│   ├── interacao.js
│   └── server.js
│
├── public/
│   ├── login.html
│   ├── aluno.html
│   ├── professor.html
│   ├── admin.html
│   │
│   ├── components/
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── sidebar-aluno.html
│   │   ├── sidebar-professor.html
│   │   └── sidebar-admin.html
│   │
│   ├── css/
│   │   └── styles.css
│   │
│   └── js/
│       ├── auth.js
│       ├── app.js
│       ├── admin.js
│       └── components.js
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── controllers/
│   │   ├── alunos.controller.js
│   │   ├── auth.controller.js
│   │   ├── cursos.controller.js
│   │   ├── disciplinas.controller.js
│   │   ├── professores.controller.js
│   │   └── turmas.controller.js
│   │
│   ├── database/
│   │   └── memoria.js
│   │
│   ├── middlewares/
│   │   └── auth.middleware.js
│   │
│   ├── routes/
│   │   ├── alunos.routes.js
│   │   ├── auth.routes.js
│   │   ├── cursos.routes.js
│   │   ├── disciplinas.routes.js
│   │   ├── professores.routes.js
│   │   └── turmas.routes.js
│   │
│   └── utils/
│       └── validacoes.js
│
├── package.json
├── package-lock.json
└── README.md
```

---

## Explicação das principais pastas

### `public/`

Contém os arquivos do frontend.

Nesta pasta ficam as páginas HTML, os arquivos CSS, os scripts do navegador e os componentes reutilizáveis.

### `public/components/`

Contém partes reutilizáveis da interface:

- `header.html`;
- `footer.html`;
- `sidebar-aluno.html`;
- `sidebar-professor.html`;
- `sidebar-admin.html`.

Esses arquivos existem para evitar repetir o mesmo código em várias páginas. Assim, se for necessário alterar o header, por exemplo, basta editar `header.html`.

### `public/css/`

Contém o arquivo principal de estilos do frontend.

### `public/js/`

Contém os scripts do frontend.

Exemplos:

- carregamento dos componentes HTML;
- lógica inicial de login;
- scripts provisórios das telas;
- funções que futuramente irão se comunicar com a API.

### `src/`

Contém o backend da aplicação.

### `src/server.js`

Arquivo responsável por iniciar o servidor.

### `src/app.js`

Arquivo responsável por configurar o Express, registrar middlewares e conectar as rotas da API.

### `src/controllers/`

Contém as funções que recebem as requisições e retornam respostas.

Exemplos:

- criar aluno;
- listar alunos;
- criar curso;
- fazer login.

### `src/routes/`

Contém os arquivos que definem os caminhos da API.

Exemplos:

```txt
/auth/login
/alunos
/professores
/cursos
/disciplinas
/turmas
```

### `src/database/memoria.js`

Contém os dados temporários usados pelo sistema enquanto ainda não há banco de dados integrado.

### `src/middlewares/`

Contém funções intermediárias, como a verificação de autenticação.

### `src/utils/`

Contém funções auxiliares e validações reutilizáveis.

### `database/`

Contém arquivos relacionados ao banco de dados, como scripts SQL.

### `docs/`

Contém materiais de documentação, diagramas ou imagens auxiliares do projeto.

### `old/`

Contém arquivos antigos mantidos apenas como referência temporária.

Esses arquivos não fazem parte da versão atual principal do sistema.

---

## Como rodar o projeto

### 1. Instalar as dependências

```bash
npm install
```

### 2. Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env` com:

```env
PORT=3000
```

### 3. Iniciar o servidor

```bash
npm start
```

Ou, se estiver usando o script de desenvolvimento:

```bash
npm run dev
```

Se tudo estiver correto, o terminal deverá mostrar algo parecido com:

```bash
Servidor rodando em http://localhost:3000
```

---

## Usuário inicial para testes

Existe um usuário administrador inicial para testar o login da API:

```json
{
  "login": "admin",
  "senha": "123456"
}
```

---

## Funcionamento atual da autenticação

O login é feito pela rota:

```txt
POST /auth/login
```

Exemplo de requisição:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin",
    "senha": "123456"
  }'
```

A resposta retorna um token:

```json
{
  "mensagem": "Login realizado com sucesso.",
  "token": "token-gerado-pelo-sistema",
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "login": "admin",
    "perfil": "administrador"
  }
}
```

Esse token deve ser enviado nas rotas protegidas pelo cabeçalho:

```txt
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## Rotas disponíveis na API

### Autenticação

```txt
POST /auth/login
GET  /auth/me
```

### Alunos

```txt
GET  /alunos
POST /alunos
```

### Professores

```txt
GET  /professores
POST /professores
```

### Cursos

```txt
GET  /cursos
POST /cursos
```

### Disciplinas

```txt
GET  /disciplinas
POST /disciplinas
```

### Turmas

```txt
GET  /turmas
POST /turmas
```

As rotas de alunos, professores, cursos, disciplinas e turmas exigem autenticação.

---

## Exemplos de uso da API

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

### Criar curso

```bash
curl -X POST http://localhost:3000/cursos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Técnico em Informática",
    "descricao": "Curso voltado à formação técnica na área de tecnologia.",
    "cargaHorariaTotal": 1200,
    "categoria": "Tecnologia",
    "status": "ativo"
  }'
```

### Criar disciplina

```bash
curl -X POST http://localhost:3000/disciplinas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Programação Web",
    "descricao": "Introdução ao desenvolvimento de aplicações web.",
    "cargaHoraria": 60,
    "professorResponsavelId": 1
  }'
```

### Criar turma

```bash
curl -X POST http://localhost:3000/turmas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "codigo": "INFO-2026-A",
    "nome": "2º Info A",
    "disciplinaId": 1,
    "professorId": 1,
    "periodoLetivo": "2026/1",
    "dataInicio": "2026-02-01",
    "dataTermino": "2026-07-01"
  }'
```

---

## Sobre o frontend

O frontend está organizado em páginas separadas por perfil:

```txt
login.html       → tela de login
aluno.html       → painel do aluno
professor.html   → painel do professor
admin.html       → painel administrativo
```

As páginas utilizam componentes HTML separados:

```txt
components/header.html
components/footer.html
components/sidebar-aluno.html
components/sidebar-professor.html
components/sidebar-admin.html
```

O carregamento desses componentes é feito via JavaScript, usando `fetch`.

Por isso, ao testar apenas o frontend, é recomendado rodar o projeto por um servidor local. Abrir os arquivos diretamente com `file:///` pode impedir o carregamento dos componentes.

---

## Observação sobre integração frontend/backend

Neste momento, o frontend serve principalmente como protótipo visual e estrutural do portal.

Algumas chamadas JavaScript já apontam para rotas de API, mas a integração final entre telas, formulários, autenticação, permissões e dados reais ainda precisa ser revisada.

Essa integração será uma etapa futura do projeto.

---

## Observação sobre armazenamento em memória

Os dados atuais ficam salvos apenas enquanto o servidor está rodando.

Se o servidor for encerrado, os dados cadastrados são perdidos.

Isso acontece porque a versão atual ainda usa armazenamento em memória. O arquivo `database/DB.sql` serve como referência inicial para a futura integração com banco de dados.

---

## Ordem recomendada para testes da API

1. Fazer login com o usuário administrador.
2. Copiar o token retornado.
3. Criar um professor.
4. Criar um curso.
5. Criar uma disciplina.
6. Criar uma turma.
7. Criar um aluno.
8. Listar os dados cadastrados.

---

## Próximos passos sugeridos

- Servir oficialmente a pasta `public` pelo Express;
- alinhar as rotas chamadas pelo frontend com as rotas existentes no backend;
- integrar o login visual com o login real da API;
- salvar o token no navegador após login;
- proteger páginas por perfil de usuário;
- conectar formulários administrativos às rotas reais;
- criar rotas para conteúdos, atividades e notas;
- integrar o projeto ao banco de dados;
- adicionar edição e exclusão de registros;
- melhorar validações e mensagens de erro.
