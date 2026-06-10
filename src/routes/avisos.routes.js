const express = require('express');

const {
  criarAviso,
  listarAvisos
} = require('../controllers/avisos.controller');

const router = express.Router();

router.get('/', listarAvisos);
router.post('/', criarAviso);

module.exports = router;
