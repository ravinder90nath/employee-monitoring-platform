const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/shifts',          ctrl.getShifts);
router.post('/shifts/assign',  ctrl.assignShift);   // must be before /:id
router.post('/shifts',         ctrl.createShift);
router.put('/shifts/:id',      ctrl.updateShift);
router.delete('/shifts/:id',   ctrl.deleteShift);

router.get('/apps',            ctrl.getApps);
router.post('/apps',           ctrl.addApp);
router.put('/apps/:id',        ctrl.updateAppCat);

router.get('/timesettings',            ctrl.getTimeSettings);
router.post('/timesettings/toggle',    ctrl.toggleService);   // must be before /
router.post('/timesettings',           ctrl.updateTimeSettings);

module.exports = router;
