const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function listarJs(diretorio) {
  return fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((item) => {
    const caminho = path.join(diretorio, item.name);
    if (item.isDirectory()) return listarJs(caminho);
    return item.name.endsWith('.js') ? [caminho] : [];
  });
}

const arquivos = [...listarJs(path.resolve('src')), ...listarJs(path.resolve('tests'))];
let falhou = false;

for (const arquivo of arquivos) {
  const resultado = spawnSync(process.execPath, ['--check', arquivo], { stdio: 'inherit' });
  if (resultado.status !== 0) falhou = true;
}

if (falhou) process.exit(1);
console.log(`${arquivos.length} arquivos JavaScript verificados sem erro de sintaxe.`);
