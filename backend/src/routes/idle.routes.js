const router = require('express').Router();
const ctrl = require('../controllers/idle.controller');
const { agentAuth, authenticate } = require('../middleware/auth');

router.post('/saveidle', agentAuth,   ctrl.saveIdle);
router.get('/',          authenticate, ctrl.getIdle);

module.exports = router;
