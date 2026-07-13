const ok = (res, data=null, message=null, code=200) =>
  res.status(code).json({ success:true, message, statusCode:code, data, errorList:null });
const fail = (res, message='Error', code=400) =>
  res.status(code).json({ success:false, message, statusCode:code, data:null, errorList:null });
module.exports = { ok, fail };
