const router = require('express').Router();
const ctrl = require('../controllers/browser.controller');
const { agentAuth, authenticate } = require('../middleware/auth');

router.post('/savebrowserusages', agentAuth,   ctrl.saveBrowserUsages);
router.get('/getbrowserhistory',  authenticate, ctrl.getBrowserHistory);

module.exports = router;
