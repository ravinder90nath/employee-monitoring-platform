const router = require('express').Router();
const ctrl = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/activitylog',       ctrl.activityLog);
router.get('/activitylogbyuser', ctrl.activityLogByUser);
router.get('/workinghrscompliance', ctrl.workingCompliance);
router.get('/productivity',      ctrl.productivityReport);

module.exports = router;
