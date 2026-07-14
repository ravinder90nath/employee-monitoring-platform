const router = require('express').Router();
const ctrl = require('../controllers/machine.controller');
const { agentAuth, authenticate } = require('../middleware/auth');

router.post('/heartbeat',       agentAuth,   ctrl.heartbeat);
router.post('/refresh',         agentAuth,   ctrl.refreshSettings);
router.post('/loglockunlock',   agentAuth,   ctrl.lockUnlock);
router.get('/getlockunlock',    authenticate, ctrl.getLockunlock);
router.post('/savenetworkusage',agentAuth,   ctrl.saveNetwork);
router.post('/savegeolocation', agentAuth,   ctrl.saveGeo);
router.get('/getgeolocation',   authenticate, ctrl.getGeolocation);

module.exports = router;
