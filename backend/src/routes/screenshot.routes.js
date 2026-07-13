const router = require('express').Router();
const ctrl = require('../controllers/screenshot.controller');
const { agentAuth, authenticate } = require('../middleware/auth');

router.post('/savescreenshot', agentAuth, ctrl.upload, ctrl.saveScreenshot);
router.get('/getscreenshots',  authenticate, ctrl.getScreenshots);

module.exports = router;
