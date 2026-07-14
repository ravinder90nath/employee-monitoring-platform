"""
DESK-WATCH-EMS Windows Monitoring Agent
===================================
Tracks: apps, browser history, idle time, screenshots, network usage.
Sends data to DESK-WATCH-EMS Node.js API.

Setup:
  pip install pywin32 psutil pillow requests schedule

Build EXE:
  pyinstaller --onefile --noconsole --name=EMSAgent agent.py
"""

import os, sys, json, time, uuid, socket, sqlite3, logging, subprocess, getpass
import threading, schedule, platform, configparser
from datetime import datetime, timezone, timedelta
from pathlib import Path

IS_WIN = platform.system() == "Windows"
WIN32_OK = PIL_OK = False

if IS_WIN:
    try:
        import win32gui, win32process
        import psutil
        WIN32_OK = True
    except ImportError:
        print("WARNING: pip install pywin32 psutil")
    try:
        from PIL import ImageGrab
        PIL_OK = True
    except ImportError:
        print("WARNING: pip install pillow")

try:
    import requests
    REQUESTS_OK = True
except ImportError:
    REQUESTS_OK = False

# ── Paths ─────────────────────────────────────────────────────
APP_DIR = Path(os.environ.get("APPDATA", str(Path.home()))) / "DESK-WATCH-EMS"
APP_DIR.mkdir(parents=True, exist_ok=True)
CFG_FILE = APP_DIR / "config.ini"
DB_FILE  = APP_DIR / "buffer.db"
LOG_FILE = APP_DIR / "agent.log"
SS_DIR   = APP_DIR / "screenshots"
SS_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8"), logging.StreamHandler()]
)
log = logging.getLogger("ems")

# ── Config ────────────────────────────────────────────────────
def default_emp_email():
    try:
        username = getpass.getuser() or socket.gethostname()
    except Exception:
        username = socket.gethostname()
    username = username.strip().lower().replace(" ", "")
    return f"{username}@company.com"


def load_config():
    cfg = configparser.ConfigParser()
    cfg.read(CFG_FILE)
    if not cfg.has_section("agent"):
        cfg["agent"] = {
            "server_url":                   "http://localhost:5000",
            "api_key":                      "ems_agent_api_key_2024",
            "emp_email":                    default_emp_email(),
            "machine_name":                 socket.gethostname(),
            "screenshot_interval_minutes":  "5",
            "app_log_interval_minutes":     "30",
            "browser_log_interval_minutes": "30",
            "idle_threshold_minutes":       "5",
        }
        with open(CFG_FILE, "w") as f: cfg.write(f)
    else:
        defaults = {
            "server_url":                   "http://localhost:5000",
            "api_key":                      "ems_agent_api_key_2024",
            "emp_email":                    default_emp_email(),
            "machine_name":                 socket.gethostname(),
            "screenshot_interval_minutes":  "5",
            "app_log_interval_minutes":     "30",
            "browser_log_interval_minutes": "30",
            "idle_threshold_minutes":       "5",
        }
        updated = False
        for key, value in defaults.items():
            if not cfg["agent"].get(key):
                cfg["agent"][key] = value
                updated = True
        email = cfg["agent"].get("emp_email", "").strip()
        if not email or email.lower() in {"employee@company.com", "employee@employee.com"}:
            cfg["agent"]["emp_email"] = default_emp_email()
            updated = True
        if updated:
            with open(CFG_FILE, "w") as f: cfg.write(f)
    return cfg

def save_config(cfg):
    with open(CFG_FILE, "w") as f: cfg.write(f)

CFG = load_config()
SERVER   = CFG["agent"].get("server_url","http://localhost:5000").rstrip("/")
API_KEY  = CFG["agent"].get("api_key","ems_agent_api_key_2024")
EMAIL    = CFG["agent"].get("emp_email", default_emp_email())
MACHINE  = CFG["agent"].get("machine_name",socket.gethostname())
SS_INT   = int(CFG["agent"].get("screenshot_interval_minutes","5"))
APP_INT  = int(CFG["agent"].get("app_log_interval_minutes","30"))
BROWSER_INT = int(CFG["agent"].get("browser_log_interval_minutes","30"))
IDLE_MIN = int(CFG["agent"].get("idle_threshold_minutes","5"))
IS_SCREENSHOT_ENABLED = True
IS_APP_LOG_ENABLED = True
IS_BROWSER_LOG_ENABLED = True
IS_IDLE_ENABLED = True
IS_GEO_ENABLED = False
IS_TRACKING_ENABLED = True

# ── Local buffer DB ───────────────────────────────────────────
def init_db():
    c = sqlite3.connect(DB_FILE)
    c.executescript("""
        CREATE TABLE IF NOT EXISTS app_buffer(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT, duration_minutes REAL DEFAULT 0,
            created_at TEXT, uploaded INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS ss_buffer(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT, captured_at TEXT, uploaded INTEGER DEFAULT 0);
    """)
    c.commit(); c.close()

# ── Helpers ───────────────────────────────────────────────────
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def get_ip():
    try: return socket.gethostbyname(socket.gethostname())
    except: return "127.0.0.1"

FRIENDLY = {
    "chrome":"Google Chrome","msedge":"Microsoft Edge","firefox":"Mozilla Firefox",
    "code":"Visual Studio Code","devenv":"Microsoft Visual Studio 2022",
    "WINWORD":"Microsoft Word","EXCEL":"Microsoft Excel","POWERPNT":"PowerPoint",
    "OUTLOOK":"Outlook","slack":"Slack","teams":"Microsoft Teams",
    "zoom":"Zoom","postman":"Postman","figma":"Figma",
    "discord":"Discord","spotify":"Spotify","notepad":"Notepad",
}

def get_active_app():
    if not IS_WIN or not WIN32_OK:
        return "Demo App", "Demo Window"
    try:
        hwnd = win32gui.GetForegroundWindow()
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        title = win32gui.GetWindowText(hwnd)
        proc = psutil.Process(pid).name().replace(".exe","")
        for k, v in FRIENDLY.items():
            if k.lower() in proc.lower(): return v, title
        return proc.title(), title
    except: return None, None

def get_idle_seconds():
    if not IS_WIN: return 0
    try:
        import ctypes
        class LII(ctypes.Structure):
            _fields_ = [("cbSize",ctypes.c_uint),("dwTime",ctypes.c_uint)]
        lii = LII(); lii.cbSize = ctypes.sizeof(lii)
        ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii))
        return max(0,(ctypes.windll.kernel32.GetTickCount()-lii.dwTime)//1000)
    except: return 0

def take_screenshot():
    if not PIL_OK: return None
    try:
        ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = SS_DIR / f"ss_{ts}.jpg"
        img  = ImageGrab.grab()
        img  = img.resize((1280,720))
        img.save(str(path),"JPEG",quality=70)
        return str(path)
    except Exception as e: log.error(f"Screenshot: {e}"); return None

def get_browser_history():
    entries = []
    if not IS_WIN: return entries
    try:
        import shutil, sqlite3 as sq
        local = Path(os.environ.get("LOCALAPPDATA",""))
        cutoff = int((datetime.now()-timedelta(minutes=BROWSER_INT)).timestamp()*1e6+11644473600*1e6)
        # detect available browser profile folders dynamically
        bases = [("Chrome", local/"Google/Chrome/User Data"), ("Edge", local/"Microsoft/Edge/User Data")]
        for browser, base in bases:
            if not base.exists(): continue
            for prof in [p for p in base.iterdir() if p.is_dir()]:
                h = prof / "History"
                if not h.exists(): continue
                try:
                    tmp = APP_DIR/f"hist_{browser}_{prof.name}.db"
                    shutil.copy2(str(h), str(tmp))
                    con = sq.connect(str(tmp))
                    # Try multiple query patterns to be compatible with different Chromium versions
                    rows = []
                    try:
                        rows = con.execute(
                            "SELECT u.url, IFNULL(v.visit_duration,0), v.visit_time FROM visits v JOIN urls u ON v.url=u.id WHERE v.visit_time>? LIMIT 200",
                            (cutoff,)
                        ).fetchall()
                    except Exception:
                        try:
                            rows = con.execute(
                                "SELECT url, 0 as visit_duration, last_visit_time as visit_time FROM urls WHERE last_visit_time>? LIMIT 200",
                                (cutoff,)
                            ).fetchall()
                        except Exception:
                            rows = []
                    con.close(); tmp.unlink(missing_ok=True)
                    for url, dur, vtime in rows:
                        try:
                            # convert chromium timestamp (microseconds since 1601) to unix
                            ts = None
                            if isinstance(vtime, (int, float)) and vtime > 1000000000000:
                                ts = datetime.fromtimestamp(vtime/1e6 - 11644473600, timezone.utc).isoformat()
                            else:
                                ts = datetime.now(timezone.utc).isoformat()
                        except: ts = datetime.now(timezone.utc).isoformat()
                        entries.append({"url": url, "durationInMinutes": round((dur or 0)/60000000, 2) if isinstance(dur, (int, float)) else 0, "browser": browser, "createdAt": ts})
                except Exception as e:
                    log.debug(f"Browser history read failed for {h}: {e}")
    except Exception as e: log.debug(f"Browser history: {e}")
    return entries

def get_installed_software():
    items = []
    if not IS_WIN: return items
    try:
        # WMIC can be slow; use it as a best-effort fallback
        res = subprocess.run(["wmic", "product", "get", "name,version"], capture_output=True, text=True, timeout=30)
        out = res.stdout.splitlines()
        for line in out:
            line = line.strip()
            if not line or line.lower().startswith("name") or line.lower().startswith("version"): continue
            parts = [p for p in line.split() if p]
            if len(parts) >= 1:
                items.append(line)
    except Exception as e:
        log.debug(f"Installed software enumeration failed: {e}")
    return items

def get_system_info():
    info = {}
    try:
        info['os'] = platform.platform()
        info['hostname'] = socket.gethostname()
        info['username'] = os.getlogin() if hasattr(os, 'getlogin') else None
        info['ip'] = get_ip()
        try:
            import psutil
            info['cpu_count'] = psutil.cpu_count(logical=True)
            info['total_memory'] = getattr(psutil.virtual_memory(), 'total', None)
            du = psutil.disk_usage(str(Path.home()))
            info['disk_total'] = du.total
            info['disk_free'] = du.free
            info['boot_time'] = datetime.fromtimestamp(psutil.boot_time(), timezone.utc).isoformat()
        except Exception:
            pass
        info['installed_software'] = get_installed_software()
    except Exception as e:
        log.debug(f"get_system_info error: {e}")
    return info


def is_desktop_locked():
    if not IS_WIN:
        return False
    try:
        import ctypes
        user32 = ctypes.WinDLL('user32', use_last_error=True)
        DESKTOP_SWITCHDESKTOP = 0x0100
        hdesk = user32.OpenInputDesktop(0, False, DESKTOP_SWITCHDESKTOP)
        if not hdesk:
            return True
        result = user32.SwitchDesktop(hdesk)
        user32.CloseDesktop(hdesk)
        return result == 0
    except Exception as e:
        log.debug(f"Lock state detect failed: {e}")
        return False


def get_geolocation():
    if not REQUESTS_OK:
        return None, None, None
    try:
        for url in ("https://ipinfo.io/json", "http://ip-api.com/json/"):
            r = requests.get(url, timeout=10)
            if not r.ok:
                continue
            data = r.json()
            lat = data.get("latitude") or data.get("lat")
            lon = data.get("longitude") or data.get("lon")
            if lat is None or lon is None:
                loc = data.get("loc")
                if loc:
                    parts = loc.split(",")
                    if len(parts) == 2:
                        lat, lon = parts[0], parts[1]
            if lat is None or lon is None:
                continue
            city = data.get("city") or data.get("regionName") or data.get("region") or ""
            country = data.get("country") or ""
            address = ", ".join([p for p in [city, country] if p])
            return float(lat), float(lon), address
    except Exception as e:
        log.debug(f"Geolocation lookup failed: {e}")
    return None, None, None

# ── API Client ────────────────────────────────────────────────
class API:
    def __init__(self):
        self.s = requests.Session() if REQUESTS_OK else None
        self.h = {"X-Api-Key":API_KEY,"Content-Type":"application/json"}

    def post(self, path, data):
        if not REQUESTS_OK: return False
        try:
            r = self.s.post(f"{SERVER}{path}",json=data,headers=self.h,timeout=20)
            ok = r.status_code in (200,201)
            if not ok: log.debug(f"POST {path} → {r.status_code}: {r.text[:200]}")
            return ok
        except Exception as e: log.debug(f"POST {path}: {e}"); return False

    def post_file(self, path, files, data):
        if not REQUESTS_OK: return False
        try:
            r = self.s.post(f"{SERVER}{path}",files=files,data=data,headers={"X-Api-Key":API_KEY},timeout=30)
            return r.status_code in (200,201)
        except Exception as e: log.debug(f"POST file {path}: {e}"); return False

    def heartbeat(self):
        if not REQUESTS_OK: return False
        try:
            r = self.s.post(f"{SERVER}/api/machine/heartbeat",
                json={"email":EMAIL,"machineName":MACHINE,"ipAddress":get_ip()},
                headers=self.h, timeout=10)
            if r.status_code in (200,201):
                data = r.json().get("data") or {}
                self._apply_settings(data)
                return True
            return False
        except Exception as e:
            log.debug(f"Heartbeat: {e}"); return False

    def refresh_settings(self):
        if not REQUESTS_OK: return False
        try:
            r = self.s.post(f"{SERVER}/api/machine/refresh",
                json={"email":EMAIL}, headers=self.h, timeout=10)
            if r.status_code in (200,201):
                data = r.json().get("data") or {}
                self._apply_settings(data)
                return True
            return False
        except Exception as e:
            log.debug(f"Refresh settings: {e}"); return False

    def _apply_settings(self, data):
        global SS_INT, APP_INT, BROWSER_INT, IDLE_MIN
        global IS_SCREENSHOT_ENABLED, IS_APP_LOG_ENABLED, IS_BROWSER_LOG_ENABLED
        global IS_GEO_ENABLED, IS_TRACKING_ENABLED
        if data.get("screenshot_interval_minutes") is not None:
            SS_INT = int(data["screenshot_interval_minutes"])
        if data.get("app_log_interval_minutes") is not None:
            APP_INT = int(data["app_log_interval_minutes"])
        if data.get("browser_log_interval_minutes") is not None:
            BROWSER_INT = int(data["browser_log_interval_minutes"])
        if data.get("idle_threshold_minutes") is not None:
            IDLE_MIN = int(data["idle_threshold_minutes"])
        if data.get("is_screenshot_enabled") is not None:
            IS_SCREENSHOT_ENABLED = bool(data["is_screenshot_enabled"])
        if data.get("is_app_log_enabled") is not None:
            IS_APP_LOG_ENABLED = bool(data["is_app_log_enabled"])
        if data.get("is_browser_log_enabled") is not None:
            IS_BROWSER_LOG_ENABLED = bool(data["is_browser_log_enabled"])
        if data.get("is_idle_enabled") is not None:
            IS_IDLE_ENABLED = bool(data["is_idle_enabled"])
        if data.get("is_geolocation_enabled") is not None:
            IS_GEO_ENABLED = bool(data["is_geolocation_enabled"])
        if data.get("is_tracking_enabled") is not None:
            IS_TRACKING_ENABLED = bool(data["is_tracking_enabled"])

    def save_log(self, etype, data=""):
        self.post("/api/admin/savelogs",{"empEmail":EMAIL,"machineName":MACHINE,"eventType":etype,"eventData":data,"createdAt":now_iso()})

    def send_apps(self, apps):
        return self.post("/api/applog/saveapplog",{"email":EMAIL,"machineName":MACHINE,"createdAt":now_iso(),"apps":apps})

    def send_browser(self, usages):
        return self.post("/api/browserhistory/savebrowserusages",{"email":EMAIL,"machineName":MACHINE,"createdAt":now_iso(),"usage":usages})

    def send_idle(self, start, end, minutes):
        if minutes < 0.1: return False
        return self.post("/api/idle/saveidle",{
            "email":EMAIL,"machineName":MACHINE,
            "idleStart":start,"idleEnd":end,"durationInMinutes":round(minutes,2)
        })

    def send_screenshot(self, path, captured_at):
        try:
            safe = EMAIL.replace("@","_").replace(".","_")
            with open(path,"rb") as f:
                return self.post_file(
                    f"/api/screenshot/savescreenshot?email={EMAIL}",
                    files={"screenshot":("ss.jpg",f,"image/jpeg")},
                    data={"email":EMAIL,"machineName":MACHINE,"capturedAt":captured_at,"screenIndex":1}
                )
        except Exception as e: log.debug(f"SS upload: {e}"); return False

    def send_network(self, up, down):
        return self.post("/api/machine/savenetworkusage",{"email":EMAIL,"machineName":MACHINE,"uploadBytes":up,"downloadBytes":down})

    def send_lock_unlock(self, eventType, eventTime):
        return self.post("/api/machine/loglockunlock",{
            "email":EMAIL,"machineName":MACHINE,
            "eventType":eventType,"eventTime":eventTime
        })

    def send_geolocation(self, latitude, longitude, address=None, locationType="ip"):
        return self.post("/api/machine/savegeolocation",{
            "email":EMAIL,"machineName":MACHINE,
            "latitude":latitude,"longitude":longitude,
            "address":address or "","locationType":locationType
        })

# ── App Tracker ───────────────────────────────────────────────
class AppTracker:
    def __init__(self):
        self._cur   = None
        self._start = None
        self._acc   = {}
        self._idle_start = None
        self._completed_idle = []
        self._lock  = threading.Lock()

    def tick(self):
        if not IS_TRACKING_ENABLED or (not IS_APP_LOG_ENABLED and not IS_IDLE_ENABLED):
            return
        idle = get_idle_seconds()
        is_idle = idle >= (IDLE_MIN*60)
        app, _ = get_active_app()
        now = datetime.now(timezone.utc)
        with self._lock:
            if is_idle:
                if self._idle_start is None:
                    if self._cur and self._start:
                        dur = (now-self._start).total_seconds()/60
                        self._acc[self._cur] = self._acc.get(self._cur,0)+dur
                    self._idle_start = now
                    self._cur = None
                    self._start = None
            else:
                if self._idle_start is not None:
                    dur = (now-self._idle_start).total_seconds()/60
                    if dur >= 0.1:
                        self._completed_idle.append((self._idle_start.isoformat(), now.isoformat(), round(dur,2)))
                    self._idle_start = None
                if app and app != self._cur:
                    if self._cur and self._start:
                        dur = (now-self._start).total_seconds()/60
                        self._acc[self._cur] = self._acc.get(self._cur,0)+dur
                    self._cur = app; self._start = now

    def flush(self):
        with self._lock:
            apps = [{"appName":k,"durationInMinutes":round(v,2)} for k,v in self._acc.items() if v>0.01]
            self._acc = {}
        return apps

    def flush_idle(self):
        with self._lock:
            completed = self._completed_idle[:]
            self._completed_idle = []
            if self._idle_start:
                now = datetime.now(timezone.utc)
                dur = (now-self._idle_start).total_seconds()/60
                if dur >= 0.1:
                    completed.append((self._idle_start.isoformat(), now.isoformat(), round(dur,2)))
                self._idle_start = None
            return completed

    def get_idle(self):
        with self._lock:
            if self._idle_start:
                now = datetime.now(timezone.utc)
                dur = (now-self._idle_start).total_seconds()/60
                return self._idle_start.isoformat(), now.isoformat(), round(dur,2)
        return None, None, 0

# ── Screenshot Service ────────────────────────────────────────
class ScreenshotService:
    def __init__(self, api):
        self.api = api

    def capture(self):
        if not IS_TRACKING_ENABLED or not IS_SCREENSHOT_ENABLED:
            return
        ca = now_iso()
        path = take_screenshot()
        if not path: return
        log.info(f"Screenshot: {path}")
        if self.api.send_screenshot(path, ca):
            try: os.remove(path)
            except: pass
            log.info("Screenshot uploaded ✓")
        else:
            c = sqlite3.connect(DB_FILE)
            c.execute("INSERT INTO ss_buffer (file_path,captured_at) VALUES (?,?)",(path,ca))
            c.commit(); c.close()
            log.warning("Screenshot queued locally")

    def retry(self):
        c = sqlite3.connect(DB_FILE)
        rows = c.execute("SELECT id,file_path,captured_at FROM ss_buffer WHERE uploaded=0").fetchall()
        c.close()
        for rid,fp,ca in rows:
            if os.path.exists(fp) and self.api.send_screenshot(fp,ca):
                os.remove(fp)
                c = sqlite3.connect(DB_FILE)
                c.execute("UPDATE ss_buffer SET uploaded=1 WHERE id=?",(rid,))
                c.commit(); c.close()

# ── Network Monitor ───────────────────────────────────────────
class NetMonitor:
    def __init__(self, api):
        self.api = api; self._last = None
    def update(self):
        if not WIN32_OK or not IS_TRACKING_ENABLED:
            return
        try:
            s = psutil.net_io_counters()
            if self._last:
                up = max(0, s.bytes_sent - self._last.bytes_sent)
                down = max(0, s.bytes_recv - self._last.bytes_recv)
                log.debug(f"NetMonitor: {up} up, {down} down")
                if up or down:
                    if self.api.send_network(up, down):
                        log.info(f"Uploaded network usage: up={up} down={down} ✓")
                    else:
                        log.warning("Network upload failed — will retry")
            self._last = s
        except: pass


class LockMonitor:
    def __init__(self, api):
        self.api = api
        self._locked = None

    def update(self):
        if not IS_WIN or not IS_TRACKING_ENABLED:
            return
        try:
            current_locked = is_desktop_locked()
            if self._locked is None:
                self._locked = current_locked
                return
            if current_locked != self._locked:
                self._locked = current_locked
                event = "locked" if current_locked else "unlocked"
                if self.api.send_lock_unlock(event, now_iso()):
                    log.info(f"Uploaded lock state: {event} ✓")
                else:
                    log.warning(f"Lock state upload failed: {event}")
        except Exception as e:
            log.debug(f"Lock monitor: {e}")


class GeoMonitor:
    def __init__(self, api):
        self.api = api
        self._last = None

    def update(self):
        if not IS_GEO_ENABLED or not REQUESTS_OK:
            return
        try:
            lat, lon, address = get_geolocation()
            if lat is None or lon is None:
                return
            key = f"{lat:.6f}:{lon:.6f}"
            if key == self._last:
                return
            self._last = key
            if self.api.send_geolocation(lat, lon, address, "ip"):
                log.info(f"Uploaded GPS location ✓ {lat},{lon}")
            else:
                log.warning("Geolocation upload failed")
        except Exception as e:
            log.debug(f"Geo monitor: {e}")

# ── Main Agent ────────────────────────────────────────────────
class EMSAgent:
    def __init__(self):
        init_db()
        self.api    = API()
        self.tracker= AppTracker()
        self.ss     = ScreenshotService(self.api)
        self.net    = NetMonitor(self.api)
        self.lock   = LockMonitor(self.api)
        self.geo    = GeoMonitor(self.api)
        self._run   = False

    def start(self):
        log.info("="*50)
        log.info("DESK-WATCH-EMS Agent v1.0")
        log.info(f"  Server:   {SERVER}")
        log.info(f"  Employee: {EMAIL}")
        log.info(f"  Machine:  {MACHINE}")
        log.info(f"  Log:      {LOG_FILE}")
        log.info("="*50)
        if not REQUESTS_OK:
            log.error("pip install requests"); sys.exit(1)
        if self.api.heartbeat():
            log.info("✓ Connected to server")
            self.api.save_log("Info","Agent started")
        else:
            log.warning("Cannot reach server — buffering locally")

        self._schedule_jobs()
        if IS_TRACKING_ENABLED and IS_SCREENSHOT_ENABLED:
            self.ss.capture()

        self._run = True
        t = threading.Thread(target=self._tick_loop, daemon=True)
        t.start()
        log.info("Agent running. Ctrl+C to stop.")
        try:
            while self._run:
                schedule.run_pending(); time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

    def _schedule_jobs(self):
        schedule.clear('heartbeat')
        schedule.clear('app_flush')
        schedule.clear('browser_flush')
        schedule.clear('screenshot')
        schedule.clear('geolocation')
        schedule.clear('retry')
        schedule.clear('network')

        schedule.every(1).minutes.tag('heartbeat').do(self._refresh_settings)
        schedule.every(max(1, APP_INT)).minutes.tag('app_flush').do(self._flush_apps)
        schedule.every(max(1, BROWSER_INT)).minutes.tag('browser_flush').do(self._flush_browser)
        schedule.every(max(1, SS_INT)).minutes.tag('screenshot').do(self.ss.capture)
        schedule.every(15).minutes.tag('geolocation').do(self.geo.update)
        schedule.every(5).minutes.tag('retry').do(self.ss.retry)
        schedule.every(5).minutes.tag('network').do(self.net.update)

    def _refresh_settings(self):
        old_ss = SS_INT
        old_browser = BROWSER_INT
        if self.api.heartbeat():
            if old_ss != SS_INT or old_browser != BROWSER_INT:
                log.info(f'✓ Settings refreshed from server (screenshot interval={SS_INT}m, browser interval={BROWSER_INT}m)')
            else:
                log.info('✓ Settings refreshed from server')
            self._schedule_jobs()

    def _flush_apps(self):
        if not IS_TRACKING_ENABLED:
            return
        if IS_APP_LOG_ENABLED:
            apps = self.tracker.flush()
            if apps:
                if self.api.send_apps(apps): log.info(f"Uploaded {len(apps)} app records ✓")
                else: log.warning("App upload failed — will retry")
        if IS_IDLE_ENABLED:
            idle_periods = self.tracker.flush_idle()
            for idle_start, idle_end, idle_mins in idle_periods:
                if idle_mins >= 1.0 and self.api.send_idle(idle_start, idle_end, idle_mins):
                    log.info(f"Uploaded idle: {idle_mins:.1f} mins ✓")

    def _flush_browser(self):
        if not IS_TRACKING_ENABLED or not IS_BROWSER_LOG_ENABLED:
            return
        log.info("_flush_browser: triggered")
        usages = get_browser_history()
        if not usages:
            log.debug("_flush_browser: no entries found")
            return
        log.info(f"_flush_browser: found {len(usages)} entries")
        if self.api.send_browser(usages): log.info(f"Uploaded {len(usages)} browser entries ✓")
        else: log.warning("Browser upload failed — will retry")

    def _tick_loop(self):
        while self._run:
            try: self.tracker.tick()
            except Exception as e: log.debug(f"Tick: {e}")
            try: self.lock.update()
            except Exception as e: log.debug(f"Tick: {e}")
            time.sleep(1)

    def stop(self):
        log.info("Stopping...")
        self._run = False
        self._flush_apps()
        self.api.save_log("SessionEnd","Agent stopped")
        log.info("Agent stopped.")

if __name__ == "__main__":
    if "--configure" in sys.argv:
        print("\n=== DESK-WATCH-EMS Agent Configuration ===")
        url   = input(f"Server URL [{SERVER}]: ").strip() or SERVER
        email = input(f"Employee Email [{EMAIL}]: ").strip() or EMAIL
        key   = input(f"API Key [{API_KEY}]: ").strip() or API_KEY
        sint  = input(f"Screenshot interval minutes [{SS_INT}]: ").strip() or str(SS_INT)
        CFG["agent"].update({
            "server_url": url,
            "emp_email": email,
            "api_key": key,
            "machine_name": socket.gethostname(),
            "screenshot_interval_minutes": sint
        })
        save_config(CFG)
        print(f"✓ Config saved to {CFG_FILE}")
        sys.exit(0)
    EMSAgent().start()
