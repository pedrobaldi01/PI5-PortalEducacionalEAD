# Portal Educacional EAD

Projeto acadêmico de um **Portal Educacional EAD**, inspirado em plataformas como Moodle, com áreas separadas para **alunos**, **professores** e **administradores**.

A aplicação foi desenvolvida para rodar localmente durante a apresentação, com backend em Node.js/Express, frontend em HTML/CSS/JavaScript e banco de dados MySQL local.

---

## Tecnologias utilizadas

- Node.js
- Express
- JavaScript
- HTML5
- CSS3
- MySQL
- JWT/token de autenticação
- MySQL Workbench para criação e manutenção do banco local

---

## Objetivo do sistema

O objetivo do sistema é oferecer uma base funcional de portal educacional, com fluxos separados por perfil.

### Aluno

O aluno consegue:

- acessar sua área após login;
- visualizar turmas e disciplinas em que está matriculado;
- acessar conteúdos/materiais publicados pelos professores;
- visualizar atividades disponíveis;
- enviar resposta em texto para atividades;
- acompanhar notas lançadas pelos professores;
- visualizar avisos publicados para suas turmas.

### Professor

O professor consegue:

- acessar sua área após login;
- visualizar turmas e disciplinas vinculadas a ele;
- publicar conteúdos/materiais por turma;
- criar atividades avaliativas ou não avaliativas;
- acompanhar envios de atividades feitos pelos alunos;
- visualizar a resposta textual enviada pelo aluno;
- lançar notas para alunos da turma da atividade, mesmo que o aluno não tenha enviado resposta;
- publicar avisos para suas turmas;
- remover conteúdos, atividades e avisos quando permitido.

### Administrador

O administrador consegue:

- acessar sua área após login;
- cadastrar alunos;
- cadastrar professores;
- cadastrar cursos;
- cadastrar disciplinas;
- cadastrar turmas;
- criar matrículas de alunos em turmas;
- vincular disciplinas a cursos;
- listar os dados cadastrados;
- remover/inativar alunos e professores;
- remover registros administrativos quando permitido pelo backend.

---

## Estado atual do projeto

O projeto possui backend, banco e frontend integrados para os principais fluxos da aplicação.

### Backend

O backend possui:

- API em Node.js/Express;
- autenticação por token;
- controle de perfis;
- conexão com MySQL;
- senhas com hash para novos usuários cadastrados pela API;
- login compatível com senhas antigas em texto puro para facilitar testes;
- rotas para usuários, cursos, disciplinas, turmas, matrículas, materiais, atividades, envios, notas e avisos;
- validações e regras de permissão por perfil;
- frontend servido localmente pela aplicação Express.

### Frontend

O frontend possui:

- tela de login integrada com `/auth/login`;
- sessão salva no `localStorage`;
- proteção de páginas por perfil;
- redirecionamento automático conforme perfil;
- header, sidebar e footer reutilizáveis;
- menu hambúrguer em telas menores;
- layout responsivo;
- área do aluno integrada ao banco;
- área do professor integrada ao banco;
- área do administrador integrada ao banco;
- mensagens de carregamento, sucesso, erro e estado vazio;
- formulários reais integrados às rotas da API;
- renderização dinâmica dos dados vindos do backend.

### Banco de dados

O projeto usa MySQL com o schema definido em:

```txt
database/DB.sql
```

O banco principal usado localmente é:

```txt
escola_ead
```

O schema possui tabelas para:

- usuários;
- alunos;
- professores;
- administradores;
- coordenadores;
- cursos;
- disciplinas;
- vínculos curso-disciplina;
- turmas;
- matrículas;
- arquivos;
- materiais didáticos;
- atividades;
- envios de atividades;
- notas;
- avisos.

---

## Funcionalidades já implementadas

### Autenticação

- Login por `login` e `senha`;
- token de autenticação;
- armazenamento de sessão no navegador;
- logout;
- exibição do usuário logado no header;
- bloqueio de páginas internas sem login;
- bloqueio por perfil de acesso.

### Área do aluno

- Listagem de turmas/disciplinas matriculadas;
- listagem de conteúdos/materiais;
- listagem de atividades;
- envio de resposta em texto para atividades;
- exibição de envio já realizado;
- listagem de notas;
- listagem de avisos;
- estados vazios quando não há dados.

### Área do professor

- Listagem de turmas e disciplinas;
- publicação de conteúdos;
- criação de atividades;
- listagem de conteúdos publicados;
- listagem de atividades criadas;
- consulta de alunos por turma;
- consulta de envios de atividades;
- visualização da resposta textual do aluno;
- lançamento de notas por atividade e aluno;
- criação de avisos para turmas;
- listagem de avisos publicados;
- remoção de conteúdos, atividades e avisos quando permitido.

### Área do administrador

- Cadastro e listagem de alunos;
- cadastro e listagem de professores;
- cadastro e listagem de cursos;
- cadastro e listagem de disciplinas;
- cadastro e listagem de turmas;
- criação e listagem de matrículas;
- vínculo de disciplinas a cursos;
- listagem de vínculos curso-disciplina;
- remoção/inativação de alunos e professores;
- remoção de registros quando permitido pela regra do backend.

### Responsividade

- Header fixo;
- sidebar lateral no desktop;
- menu hambúrguer em tablet/celular;
- cards adaptáveis;
- formulários em coluna em telas menores;
- tabelas com rolagem horizontal;
- botões adaptados para telas pequenas.

---

## Estrutura de pastas

A estrutura principal do projeto está organizada assim:

```txt
PI5-PortalEducacionalEAD/
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
│       ├── api.js
│       ├── session.js
│       ├── ui.js
│       ├── auth.js
│       ├── components.js
│       ├── aluno.js
│       ├── professor.js
│       └── admin.js
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   └── env.js
│   │
│   ├── controllers/
│   │   ├── alunos.controller.js
│   │   ├── atividades.controller.js
│   │   ├── auth.controller.js
│   │   ├── avisos.controller.js
│   │   ├── cursos.controller.js
│   │   ├── disciplinas.controller.js
│   │   ├── enviosAtividades.controller.js
│   │   ├── materiais.controller.js
│   │   ├── matriculas.controller.js
│   │   ├── notas.controller.js
│   │   ├── professores.controller.js
│   │   └── turmas.controller.js
│   │
│   ├── database/
│   │   ├── conexao.js
│   │   └── memoria.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── perfil.middleware.js
│   │
│   ├── routes/
│   │   ├── alunos.routes.js
│   │   ├── atividades.routes.js
│   │   ├── auth.routes.js
│   │   ├── avisos.routes.js
│   │   ├── cursos.routes.js
│   │   ├── disciplinas.routes.js
│   │   ├── enviosAtividades.routes.js
│   │   ├── materiais.routes.js
│   │   ├── matriculas.routes.js
│   │   ├── notas.routes.js
│   │   ├── professores.routes.js
│   │   └── turmas.routes.js
│   │
│   ├── services/
│   │   └── acesso.service.js
│   │
│   └── utils/
│       ├── app-error.js
│       ├── async-handler.js
│       ├── controller-helpers.js
│       ├── mapeadores.js
│       ├── senhas.js
│       ├── tokens.js
│       └── validacoes.js
│
├── package.json
├── package-lock.json
├── README.md
└── .env
```

---

## Explicação das principais pastas

### `public/`

Contém o frontend da aplicação.

Inclui as páginas HTML, os componentes reutilizáveis, o CSS e os scripts do navegador.

### `public/components/`

Contém os componentes reaproveitados pelas páginas:

- `header.html`;
- `footer.html`;
- `sidebar-aluno.html`;
- `sidebar-professor.html`;
- `sidebar-admin.html`.

Esses componentes evitam duplicação de código. Alterações no header, footer ou menu podem ser feitas em um único arquivo.

### `public/css/styles.css`

Arquivo principal de estilos do sistema.

Define:

- identidade visual;
- cores;
- layout;
- cards;
- formulários;
- tabelas;
- feedbacks;
- responsividade;
- menu hambúrguer.

### `public/js/api.js`

Centraliza as chamadas ao backend.

Responsável por:

- montar requisições HTTP;
- enviar token automaticamente;
- tratar respostas JSON;
- tratar erros de autenticação ou falha de API.

### `public/js/session.js`

Controla a sessão no navegador.

Responsável por:

- salvar token;
- salvar usuário;
- obter perfil;
- proteger páginas;
- redirecionar por perfil;
- fazer logout.

### `public/js/ui.js`

Centraliza funções visuais reutilizáveis.

Exemplos:

- loading;
- mensagens de sucesso;
- mensagens de erro;
- estados vazios;
- feedbacks de formulário.

### `public/js/components.js`

Carrega componentes HTML com `fetch`.

Também configura:

- header;
- footer;
- sidebar correta por perfil;
- nome do usuário logado;
- botão de logout;
- link ativo da navegação;
- menu hambúrguer.

### `public/js/aluno.js`

Controla a tela do aluno.

Carrega e renderiza:

- turmas;
- matrículas;
- atividades;
- conteúdos;
- notas;
- avisos;
- envios de atividade.

Também envia respostas em texto para atividades.

### `public/js/professor.js`

Controla a tela do professor.

Gerencia:

- turmas;
- conteúdos;
- atividades;
- alunos por turma;
- envios de atividade;
- notas;
- avisos.

### `public/js/admin.js`

Controla a tela administrativa.

Gerencia:

- alunos;
- professores;
- cursos;
- disciplinas;
- turmas;
- matrículas;
- vínculos curso-disciplina.

### `src/`

Contém o backend da aplicação.

### `src/app.js`

Configura o Express, middlewares, rotas da API e o frontend estático.

### `src/server.js`

Inicializa o servidor local.

### `src/controllers/`

Contém as funções que processam as requisições e retornam as respostas.

### `src/routes/`

Define os caminhos da API.

### `src/database/conexao.js`

Configura a conexão com o MySQL.

### `src/middlewares/`

Contém middlewares de autenticação e permissão por perfil.

### `src/services/acesso.service.js`

Centraliza regras de acesso, como verificar se um professor pertence a determinada turma ou se um aluno está matriculado.

### `src/utils/`

Contém funções auxiliares para validações, tokens, senhas, tratamento de erros e mapeamento de dados.

---

## Como rodar o projeto localmente

### 1. Instalar dependências

Na raiz do projeto, execute:

```bash
npm install
```

### 2. Criar o banco MySQL

Abra o MySQL Workbench e execute o script:

```txt
database/DB.sql
```

Esse script cria o banco:

```txt
escola_ead
```

e suas tabelas.

### 3. Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado:

```txt
.env
```

Exemplo:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_do_mysql
DB_NAME=escola_ead

TOKEN_SECRET=portal_ead_chave_secreta_local
```

O arquivo `.env` deve ficar no mesmo nível de `package.json`.

### 4. Rodar o servidor

Execute:

```bash
npm start
```

ou:

```bash
npm run dev
```

Se tudo estiver correto, o terminal mostrará algo parecido com:

```txt
Servidor rodando em http://localhost:3000
```

Depois acesse:

```txt
http://localhost:3000
```

---

## Usuário inicial para testes

O script `database/DB.sql` cria um administrador inicial.

```txt
login: admin
senha: 123456
```

Esse usuário pode ser usado para entrar na área administrativa e cadastrar outros usuários.

---

## Autenticação

O login é feito por:

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

Resposta esperada:

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

O token deve ser enviado nas rotas protegidas:

```txt
Authorization: Bearer SEU_TOKEN_AQUI
```

No frontend, esse processo é feito automaticamente pelos arquivos `auth.js`, `session.js` e `api.js`.

---

## Rotas principais da API

### Autenticação

```txt
POST /auth/login
GET  /auth/me
```

### Alunos

```txt
GET    /alunos
POST   /alunos
GET    /alunos/:id
PUT    /alunos/:id
DELETE /alunos/:id
```

### Professores

```txt
GET    /professores
GET    /professores/me
POST   /professores
GET    /professores/:id
PUT    /professores/:id
DELETE /professores/:id
```

### Cursos

```txt
GET    /cursos
POST   /cursos
GET    /cursos/:id
PUT    /cursos/:id
DELETE /cursos/:id
GET    /cursos/:cursoId/disciplinas
POST   /cursos/:cursoId/disciplinas
DELETE /cursos/:cursoId/disciplinas/:disciplinaId
```

### Disciplinas

```txt
GET    /disciplinas
POST   /disciplinas
GET    /disciplinas/:id
PUT    /disciplinas/:id
DELETE /disciplinas/:id
```

### Turmas

```txt
GET    /turmas
GET    /turmas/minhas
GET    /turmas/:id
POST   /turmas
PUT    /turmas/:id
DELETE /turmas/:id
GET    /turmas/:turmaId/alunos
GET    /turmas/:turmaId/materiais
GET    /turmas/:turmaId/atividades
GET    /turmas/:turmaId/avisos
```

### Matrículas

```txt
GET    /matriculas
GET    /matriculas/minhas
POST   /matriculas
GET    /matriculas/:id
PUT    /matriculas/:id/status
DELETE /matriculas/:id
```

### Materiais

```txt
GET    /materiais
POST   /materiais
GET    /materiais/:id
PUT    /materiais/:id
DELETE /materiais/:id
```

### Atividades

```txt
GET    /atividades
POST   /atividades
GET    /atividades/:id
PUT    /atividades/:id
DELETE /atividades/:id
```

### Envios de atividades

```txt
GET  /envios-atividades
GET  /envios-atividades/meus
POST /envios-atividades
GET  /envios-atividades/:id
PUT  /envios-atividades/:id
```

### Notas

```txt
GET    /notas
GET    /notas/minhas
POST   /notas
GET    /notas/:id
PUT    /notas/:id
DELETE /notas/:id
```

### Avisos

```txt
GET    /avisos
POST   /avisos
GET    /avisos/:id
PUT    /avisos/:id
DELETE /avisos/:id
```

---

## Fluxo básico de uso

### Fluxo do administrador

1. Fazer login como administrador.
2. Cadastrar professores.
3. Cadastrar alunos.
4. Cadastrar cursos.
5. Cadastrar disciplinas.
6. Cadastrar turmas.
7. Matricular alunos nas turmas.
8. Vincular disciplinas aos cursos.

### Fluxo do professor

1. Fazer login como professor.
2. Visualizar suas turmas.
3. Publicar conteúdos.
4. Criar atividades.
5. Publicar avisos.
6. Acompanhar envios dos alunos.
7. Lançar notas.

### Fluxo do aluno

1. Fazer login como aluno.
2. Ver turmas e disciplinas.
3. Acessar conteúdos.
4. Visualizar atividades.
5. Enviar resposta em texto.
6. Ver notas.
7. Ver avisos.

---

## Sobre o frontend

O frontend foi desenvolvido em HTML, CSS e JavaScript puro.

Ele não acessa o banco diretamente. O fluxo é:

```txt
Frontend → Backend/API → MySQL
```

O frontend usa:

- `api.js` para chamadas HTTP;
- `session.js` para sessão;
- `ui.js` para feedback visual;
- `components.js` para carregar header, footer e sidebar;
- `aluno.js`, `professor.js` e `admin.js` para regras específicas de cada perfil.

As páginas principais são:

```txt
login.html
aluno.html
professor.html
admin.html
```

---

## Componentes reutilizáveis

O sistema usa componentes HTML separados:

```txt
components/header.html
components/footer.html
components/sidebar-aluno.html
components/sidebar-professor.html
components/sidebar-admin.html
```

Eles são carregados via `fetch` pelo `components.js`.

Isso permite alterar header, footer ou menus em um único arquivo, sem editar todas as páginas.

---

## Responsividade

A interface possui ajustes para telas menores:

- menu hambúrguer para abrir a sidebar;
- header compacto;
- botão de logout mantido no canto direito;
- cards adaptados para coluna única;
- formulários reorganizados em uma coluna;
- tabelas com rolagem horizontal;
- menu lateral oculto em tablet/celular.

---

## Observações importantes

- O sistema foi pensado para rodar localmente para apresentação acadêmica.
- O banco deve estar criado no MySQL antes de iniciar o servidor.
- O arquivo `.env` não deve ser enviado para repositórios públicos.
- O frontend não usa dados simulados nas telas principais: os dados exibidos vêm da API e do banco.
- Upload real de arquivos ainda não é o foco principal; materiais podem ser cadastrados com link ou `arquivoId`.
- A resposta de atividade pelo aluno foi implementada por campo de texto.
- A remoção de alunos e professores pode funcionar como inativação, para evitar quebra de vínculos históricos.

---

## Limitações atuais

- O upload completo de arquivos ainda pode ser melhorado no frontend.
- Algumas ações de edição podem depender de aprimoramento visual nas telas.
- O projeto não utiliza framework frontend.
- O sistema é voltado para execução local e apresentação, não para produção pública.
- Ainda podem ser feitos refinamentos de usabilidade, validação e acessibilidade.

---

## Próximos passos sugeridos

- Melhorar o fluxo visual de edição de registros;
- aprimorar upload de arquivos no frontend;
- revisar mensagens de erro vindas da API;
- melhorar acessibilidade;
- criar roteiro de apresentação;
- revisar todos os fluxos com dados reais no banco;
- atualizar a documentação conforme ajustes finais.
