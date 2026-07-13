const router = require('express').Router();
const ctrl = require('../controllers/browser.controller');
const { agentAuth } = require('../middleware/auth');

router.post('/savebrowserusages', agentAuth, ctrl.saveBrowserUsages);

module.exports = router;
