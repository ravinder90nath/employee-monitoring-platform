const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/getdashboarddata',       ctrl.getData);
router.get('/gettopfiveproddistract', ctrl.getTopFive);
router.get('/getnetworkusages',       ctrl.getNetworkUsages);
router.get('/getworkinghrsdata',      ctrl.getWorkingHrsData);
router.get('/getemployeelist',        ctrl.getEmployeeList);

module.exports = router;
