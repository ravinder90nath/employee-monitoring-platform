const db = require('../config/database');
const { toMySQL, toDate } = require('../utils/dateHelper');
const logger = require('../utils/logger');

const BrowserModel = {
  async save(email, machineName, createdAt, usages) {
    if (!email) {
      logger.warn('BrowserModel.save called without email');
      return;
    }
    
    const logDate = toDate(createdAt) || new Date().toISOString().split('T')[0];
    const ts = toMySQL(createdAt) || new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    
    logger.info(`Browser.save: Processing ${usages?.length || 0} entries for ${email} on ${logDate}`);
    
    let saved = 0;
    let failed = 0;
    
    for (const u of usages) {
      try {
        let domain = null;
        try { 
          const urlStr = (u.url && typeof u.url === 'string')
            ? (u.url.startsWith('http') ? u.url : 'https://' + u.url)
            : null;
          
          if (!urlStr) {
            logger.debug(`URL missing or invalid for entry: ${JSON.stringify(u).slice(0, 100)}`);
            failed++;
            continue;
          }
          
          domain = new URL(urlStr).hostname.replace(/^www\./, '');
        } catch (e) { 
          logger.debug(`URL parse error for "${u.url}": ${e.message}`);
          failed++;
          continue;
        }
        
        const duration = parseFloat(u.durationInMinutes) || 0;
        const browser = u.browser || 'Chrome';
        
        // Insert into browser_history
        await db.query(
          'INSERT INTO browser_history (emp_email,machine_name,url,domain,duration_minutes,browser,log_date,created_at) VALUES (?,?,?,?,?,?,?,?)',
          [email, machineName, u.url, domain, duration, browser, logDate, ts]
        );
        
        logger.debug(`✓ Browser entry saved: ${domain} (${duration}m, ${browser})`);
        saved++;
        
        // Also update apps_master with domain info
        if (domain) {
          try {
            await db.query(
              `INSERT INTO apps_master (name,type,total_minutes,last_seen) VALUES (?,'Url',?,NOW())
               ON DUPLICATE KEY UPDATE total_minutes=total_minutes+VALUES(total_minutes), last_seen=NOW()`,
              [domain, duration]
            );
          } catch (ame) {
            logger.debug(`Failed to update apps_master for ${domain}: ${ame.message}`);
          }
        }
      } catch (e) {
        logger.error(`Error saving browser entry: ${e.message}`, { entry: u });
        failed++;
      }
    }
    
    logger.info(`Browser.save complete: ${saved}/${usages.length} entries saved, ${failed} failed for ${email}`);
  },

  async getRange(email, from, to) {
    const [rows] = await db.query(
      'SELECT * FROM browser_history WHERE emp_email=? AND log_date BETWEEN ? AND ? ORDER BY created_at DESC', 
      [email, from, to]
    );
    return rows;
  },
};

module.exports = BrowserModel;
