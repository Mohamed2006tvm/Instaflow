const { Router } = require('express');
const { getAccount, disconnectAccount } = require('../controllers/account.controller');

const router = Router();

router.get('/', getAccount);
router.delete('/disconnect', disconnectAccount);

module.exports = router;
