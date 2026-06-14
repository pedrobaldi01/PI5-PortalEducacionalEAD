USE escola_ead;

-- Este arquivo não altera dados. Ele apenas confirma se as tabelas exigidas existem.
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'escola_ead'
  AND TABLE_NAME IN (
    'Usuario', 'Aluno', 'Professor', 'Administrador', 'Coordenador',
    'Curso', 'Disciplina', 'Curso_Disciplina', 'Turma', 'Matricula',
    'ArquivoUpload', 'MaterialDidatico', 'Atividade', 'EnvioAtividade',
    'Nota', 'Aviso'
  )
ORDER BY TABLE_NAME;

SELECT COUNT(*) AS total_tabelas_encontradas
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'escola_ead'
  AND TABLE_NAME IN (
    'Usuario', 'Aluno', 'Professor', 'Administrador', 'Coordenador',
    'Curso', 'Disciplina', 'Curso_Disciplina', 'Turma', 'Matricula',
    'ArquivoUpload', 'MaterialDidatico', 'Atividade', 'EnvioAtividade',
    'Nota', 'Aviso'
  );

-- O resultado esperado é 16.
