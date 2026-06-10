const express = require('express');

const {
  lancarNota,
  listarNotas
} = require('../controllers/notas.controller');

const router = express.Router();

router.get('/', listarNotas);
router.post('/', lancarNota);

module.exports = router;
