const { Router } = require('express');
const { getLogs, getStats } = require('../controllers/logs.controller');

const router = Router();

router.get('/', getLogs);
router.get('/stats', getStats);

module.exports = router;
