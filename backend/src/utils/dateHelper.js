const toMySQL = (iso) => {
  if (!iso) return null;
  try { return new Date(iso).toISOString().replace('T',' ').replace(/\.\d+Z?$/,''); }
  catch { return null; }
};
const toDate = (iso) => {
  if (!iso) return null;
  try { return new Date(iso).toISOString().split('T')[0]; }
  catch { return null; }
};
module.exports = { toMySQL, toDate };
