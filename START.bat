@echo off
cd /d "%~dp0"
echo Starter DYPERE...
start http://localhost:8080/var-stund.html
python -m http.server 8080
pause
