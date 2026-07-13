// Convert to IST (UTC+5:30)
const toMySQL = (iso) => {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    const istDate = new Date(date.getTime() + 5.5*60*60*1000);
    return istDate.toISOString().replace('T',' ').replace(/\.\d+Z?$/,'');
  }
  catch { return null; }
};

const toDate = (iso) => {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    const istDate = new Date(date.getTime() + 5.5*60*60*1000);
    return istDate.toISOString().split('T')[0];
  }
  catch { return null; }
};

// Get current time in IST format
const nowIST = () => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5*60*60*1000);
  return istDate.toISOString().replace('T',' ').replace(/\.\d+Z?$/,'');
};

module.exports = { toMySQL, toDate, nowIST };
