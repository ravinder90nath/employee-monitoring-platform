const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/login',                   ctrl.login);
router.get('/getstaffdetails',          authenticate, ctrl.getStaffDetails);
router.get('/getstaffdetailsbyfilter',  authenticate, ctrl.getStaffDetails);
router.get('/getdepartmentandtitle',    authenticate, ctrl.getDepartmentAndTitle);
router.get('/getuserlist',              authenticate, ctrl.getUserList);
router.get('/getemployeelist',          authenticate, ctrl.getEmployeeList);
router.post('/assign-role',             authenticate, ctrl.assignRole);
router.post('/deltemanagementuser',     authenticate, ctrl.deleteManagementUser);

module.exports = router;
