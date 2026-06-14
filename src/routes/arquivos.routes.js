const express = require('express');
const permitir = require('../middlewares/perfil.middleware');
const asyncHandler = require('../utils/async-handler');
const { upload } = require('../middlewares/upload.middleware');
const c = require('../controllers/arquivos.controller');
const router = express.Router();
router.post('/', permitir('Administrador', 'Professor', 'Aluno'), upload.single('arquivo'), asyncHandler(c.enviarArquivo));
router.get('/:id/download', asyncHandler(c.baixarArquivo));
module.exports = router;
