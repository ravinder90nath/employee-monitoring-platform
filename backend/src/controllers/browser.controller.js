const BrowserModel = require('../models/Browser.model');
const { ok } = require('../utils/response');

const saveBrowserUsages = async (req, res, next) => {
  try {
    const { email, machineName, createdAt, usage } = req.body;
    await BrowserModel.save(email, machineName, createdAt, usage || []);
    return ok(res, null, 'Saved');
  } catch (e) { next(e); }
};

module.exports = { saveBrowserUsages };
