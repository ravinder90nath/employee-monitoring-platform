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

import os, sys, json, time, uuid, socket, sqlite3, logging
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
def load_config():
    cfg = configparser.ConfigParser()
    cfg.read(CFG_FILE)
    if not cfg.has_section("agent"):
        cfg["agent"] = {
            "server_url":                   "http://localhost:5000",
            "api_key":                      "ems_agent_api_key_2024",
            "emp_email":                    "employee@company.com",
            "machine_name":                 socket.gethostname(),
            "screenshot_interval_minutes":  "5",
            "app_log_interval_minutes":     "30",
            "idle_threshold_minutes":       "5",
        }
        with open(CFG_FILE, "w") as f: cfg.write(f)
    return cfg

def save_config(cfg):
    with open(CFG_FILE, "w") as f: cfg.write(f)

CFG = load_config()
SERVER   = CFG["agent"].get("server_url","http://localhost:5000").rstrip("/")
API_KEY  = CFG["agent"].get("api_key","ems_agent_api_key_2024")
EMAIL    = CFG["agent"].get("emp_email","employee@company.com")
MACHINE  = CFG["agent"].get("machine_name",socket.gethostname())
SS_INT   = int(CFG["agent"].get("screenshot_interval_minutes","5"))
APP_INT  = int(CFG["agent"].get("app_log_interval_minutes","30"))
IDLE_MIN = int(CFG["agent"].get("idle_threshold_minutes","5"))

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
        cutoff = int((datetime.now()-timedelta(minutes=APP_INT)).timestamp()*1e6+11644473600*1e6)
        for browser, base in [("Chrome",local/"Google/Chrome/User Data"),("Edge",local/"Microsoft/Edge/User Data")]:
            for prof in ["Default","Profile 1"]:
                h = base/prof/"History"
                if not h.exists(): continue
                try:
                    tmp = APP_DIR/f"hist_{browser}.db"
                    shutil.copy2(str(h),str(tmp))
                    con = sq.connect(str(tmp))
                    rows = con.execute(
                        "SELECT url,visit_duration FROM visits v JOIN urls u ON v.url=u.id WHERE v.visit_time>? LIMIT 100",
                        (cutoff,)
                    ).fetchall()
                    con.close(); tmp.unlink(missing_ok=True)
                    for url,dur in rows:
                        entries.append({"url":url,"durationInMinutes":round(dur/60000000,2),"browser":browser})
                except: pass
    except Exception as e: log.debug(f"Browser history: {e}")
    return entries

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
                # Self-configure from server settings
                global SS_INT, APP_INT, IDLE_MIN
                if data.get("screenshot_interval_minutes"):
                    SS_INT  = int(data["screenshot_interval_minutes"])
                if data.get("app_log_interval_minutes"):
                    APP_INT = int(data["app_log_interval_minutes"])
                if data.get("idle_threshold_minutes"):
                    IDLE_MIN = int(data["idle_threshold_minutes"])
                return True
            return False
        except Exception as e:
            log.debug(f"Heartbeat: {e}"); return False

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

# ── App Tracker ───────────────────────────────────────────────
class AppTracker:
    def __init__(self):
        self._cur   = None
        self._start = None
        self._acc   = {}
        self._idle_start = None
        self._lock  = threading.Lock()

    def tick(self):
        idle = get_idle_seconds()
        is_idle = idle >= (IDLE_MIN*60)
        app, _ = get_active_app()
        now = datetime.now(timezone.utc)
        with self._lock:
            if is_idle:
                if self._idle_start is None:
                    self._idle_start = now
                    if self._cur and self._start:
                        dur = (now-self._start).total_seconds()/60
                        self._acc[self._cur] = self._acc.get(self._cur,0)+dur
                    self._cur = None; self._start = None
            else:
                if self._idle_start is not None:
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
        if not WIN32_OK: return
        try:
            s = psutil.net_io_counters()
            if self._last:
                self.api.send_network(max(0,s.bytes_sent-self._last.bytes_sent),max(0,s.bytes_recv-self._last.bytes_recv))
            self._last = s
        except: pass

# ── Main Agent ────────────────────────────────────────────────
class EMSAgent:
    def __init__(self):
        init_db()
        self.api    = API()
        self.tracker= AppTracker()
        self.ss     = ScreenshotService(self.api)
        self.net    = NetMonitor(self.api)
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

        schedule.every(1).minutes.do(self.api.heartbeat)
        schedule.every(APP_INT).minutes.do(self._flush_apps)
        schedule.every(APP_INT).minutes.do(self._flush_browser)
        schedule.every(SS_INT).minutes.do(self.ss.capture)
        schedule.every(5).minutes.do(self.ss.retry)
        schedule.every(5).minutes.do(self.net.update)

        threading.Timer(4.0, self.ss.capture).start()

        self._run = True
        t = threading.Thread(target=self._tick_loop, daemon=True)
        t.start()
        log.info("Agent running. Ctrl+C to stop.")
        try:
            while self._run:
                schedule.run_pending(); time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

    def _flush_apps(self):
        apps = self.tracker.flush()
        if apps:
            if self.api.send_apps(apps): log.info(f"Uploaded {len(apps)} app records ✓")
            else: log.warning("App upload failed — will retry")
        # Also flush any completed idle period
        idle_start, idle_end, idle_mins = self.tracker.get_idle()
        if idle_start and idle_mins >= 1.0:
            if self.api.send_idle(idle_start, idle_end, idle_mins):
                log.info(f"Uploaded idle: {idle_mins:.1f} mins ✓")

    def _flush_browser(self):
        usages = get_browser_history()
        if usages:
            if self.api.send_browser(usages): log.info(f"Uploaded {len(usages)} browser entries ✓")

    def _tick_loop(self):
        while self._run:
            try: self.tracker.tick()
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
        CFG["agent"].update({"server_url":url,"emp_email":email,"api_key":key,"machine_name":socket.gethostname(),"screenshot_interval_minutes":sint})
        save_config(CFG)
        print(f"✓ Config saved to {CFG_FILE}")
        sys.exit(0)
    EMSAgent().start()
