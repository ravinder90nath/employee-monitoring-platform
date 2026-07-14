const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, agentAuth } = require('../middleware/auth');

router.post('/savelogs',            agentAuth,   ctrl.saveLogs);
router.get('/getagentlogs',         authenticate, ctrl.getAgentLogs);
router.get('/getuserdetailsbyemail',authenticate, ctrl.getUserByEmail);
router.get('/deleteemployee',       authenticate, ctrl.deleteEmployee);
router.get('/getsessionlist',       authenticate, ctrl.getSessionList);
router.get('/fetchlogdata',         authenticate, ctrl.getAgentLogs);
router.get('/health', (req, res) => res.json({ status: 'Healthy', TimeStamp: new Date().toISOString() }));

module.exports = router;
