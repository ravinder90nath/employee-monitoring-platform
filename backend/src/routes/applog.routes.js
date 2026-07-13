const router = require('express').Router();
const ctrl = require('../controllers/applog.controller');
const { agentAuth, authenticate } = require('../middleware/auth');

router.post('/saveapplog', agentAuth,   ctrl.saveApplog);
router.get('/getapplog',   authenticate, ctrl.getApplog);

module.exports = router;
