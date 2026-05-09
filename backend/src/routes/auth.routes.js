const { Router } = require('express');
const { login, logout, me, initiateOAuth, handleOAuthCallback } = require('../controllers/auth.controller');

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.get('/instagram', initiateOAuth);
router.get('/instagram/callback', handleOAuthCallback);

module.exports = router;
