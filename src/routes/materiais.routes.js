const express = require('express');

const {
  criarMaterial,
  listarMateriais
} = require('../controllers/materiais.controller');

const router = express.Router();

router.get('/', listarMateriais);
router.post('/', criarMaterial);

module.exports = router;
