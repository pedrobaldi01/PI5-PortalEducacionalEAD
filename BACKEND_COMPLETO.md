# Backend completo — Portal Educacional EAD

Este pacote foi adaptado ao schema atual do projeto (`Usuario`, `Aluno`, `Professor`, `Curso`, `Turma` etc.). Ele não substitui o seu `.env` e não apaga o `database/DB.sql`.

## Requisitos cobertos

1. Login e senha.
2. Perfis Administrador, Coordenador, Professor e Aluno.
3. CRUD administrativo de alunos, professores, cursos, disciplinas e turmas.
4. Professor publica materiais, atividades, notas e avisos somente nas próprias turmas.
5. Aluno acessa somente turmas em que está matriculado.
6. Cadastro completo de alunos.
7. Cadastro completo de professores.
8. Cadastro completo de cursos.
9. Cadastro completo de disciplinas.
10. Vínculo entre curso e disciplina com sequência.
11. Cadastro completo de turmas.
12. Matrículas e alteração de status.
13. Materiais didáticos.
14. Upload com limite e tipos permitidos.
15. Atividades.
16. Envio e reenvio de atividades.
17. Notas com validação da nota máxima.
18. Avisos e comunicados.

## Rotas principais

- `POST /auth/login`, `GET /auth/me`
- CRUD `/alunos`, `/professores`, `/cursos`, `/disciplinas`, `/turmas`
- `/cursos/:cursoId/disciplinas`
- `/matriculas` e `/matriculas/minhas`
- `/materiais`, `/atividades`, `/envios-atividades`, `/notas`, `/avisos`
- `POST /arquivos` com `multipart/form-data`, campo `arquivo`
- `GET /arquivos/:id/download`

## Comandos

```powershell
npm install
npm run check
npm test
npm start
```

Com o servidor aberto, em outro terminal:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/testar-basico.ps1
```

## Observação sobre o banco

Execute `database/VERIFICAR_ESTRUTURA.sql`. O resultado esperado é `16` tabelas. Se alguma estiver faltando, execute o `database/DB.sql` que já existe no seu projeto.
