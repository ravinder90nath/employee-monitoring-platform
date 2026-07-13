@echo off
echo [1/3] Installing dependencies...
pip install -r requirements.txt
echo [2/3] Building EXE...
pyinstaller --onefile --noconsole --name=EMSAgent agent.py
echo [3/3] Done!
echo.
echo EXE: dist\EMSAgent.exe
echo.
echo Deploy:
echo   1. Copy dist\EMSAgent.exe to employee PC
echo   2. Run: EMSAgent.exe --configure
echo      Enter: Server URL, Employee Email, API Key
echo   3. Run: EMSAgent.exe
echo   4. Add to Windows startup via Task Scheduler
pause
