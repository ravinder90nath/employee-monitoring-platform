const IdleModel = require('../models/Idle.model');
const { ok } = require('../utils/response');

const saveIdle = async (req, res, next) => {
  try {
    const { email, machineName, idleStart, idleEnd, durationInMinutes } = req.body;
    await IdleModel.save(email, machineName, idleStart, idleEnd, durationInMinutes);
    return ok(res, null, 'Saved');
  } catch (e) { next(e); }
};

const getIdle = async (req, res, next) => {
  try {
    const { email, from, to } = req.query;
    const f = from || new Date().toISOString().split('T')[0];
    const t = to   || new Date().toISOString().split('T')[0];
    return ok(res, await IdleModel.getRange(email, f, t));
  } catch (e) { next(e); }
};

module.exports = { saveIdle, getIdle };
