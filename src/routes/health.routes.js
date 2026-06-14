const express = require('express');
const asyncHandler = require('../utils/async-handler');
const controller = require('../controllers/health.controller');
const router = express.Router();
router.get('/', controller.verificarApi);
router.get('/db', asyncHandler(controller.verificarBanco));
module.exports = router;
