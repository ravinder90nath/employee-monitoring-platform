const router = require('express').Router();
const ctrl = require('../controllers/browser.controller');
const { agentAuth, authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Agent endpoints
router.post('/savebrowserusages', agentAuth, async (req, res, next) => {
  logger.info('Browser save endpoint called', { 
    email: req.body.email, 
    entryCount: (req.body.usage || []).length,
    machine: req.body.machineName 
  });
  await ctrl.saveBrowserUsages(req, res, next);
});

// Admin endpoints
router.get('/getbrowserhistory',  authenticate, ctrl.getBrowserHistory);

module.exports = router;
