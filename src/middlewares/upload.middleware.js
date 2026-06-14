const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');
const env = require('../config/env');
const AppError = require('../utils/app-error');

const diretorio = path.resolve(env.uploadDir);
fs.mkdirSync(diretorio, { recursive: true });

const extensoesPermitidas = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.zip'
]);

const mimesPermitidos = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed'
]);

const storage = multer.diskStorage({
  destination: (_req, _arquivo, callback) => callback(null, diretorio),
  filename: (_req, arquivo, callback) => {
    const extensao = path.extname(path.basename(arquivo.originalname)).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extensao}`);
  }
});

function fileFilter(_req, arquivo, callback) {
  const extensao = path.extname(path.basename(arquivo.originalname)).toLowerCase();

  if (!extensoesPermitidas.has(extensao) || !mimesPermitidos.has(arquivo.mimetype)) {
    return callback(new AppError(400, 'Tipo de arquivo não permitido.'));
  }

  return callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.uploadMaxBytes,
    files: 1
  }
});

function apagarArquivo(caminho) {
  if (!caminho) return;
  fs.unlink(caminho, () => {});
}

module.exports = { upload, apagarArquivo, diretorio };
