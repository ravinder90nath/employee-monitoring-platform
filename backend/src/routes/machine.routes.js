const router = require('express').Router();
const ctrl = require('../controllers/machine.controller');
const { agentAuth } = require('../middleware/auth');

router.post('/heartbeat',       agentAuth, ctrl.heartbeat);
router.post('/loglockunlock',   agentAuth, ctrl.lockUnlock);
router.post('/savenetworkusage',agentAuth, ctrl.saveNetwork);
router.post('/savegeolocation', agentAuth, ctrl.saveGeo);

module.exports = router;
