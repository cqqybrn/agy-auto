@echo off
setlocal
set "PATH=%LOCALAPPDATA%\agy\bin;%PATH%"
cd /d "%~dp0"
if exist "%LOCALAPPDATA%\agy\bin\agy.exe" set "AGY_BIN=%LOCALAPPDATA%\agy\bin\agy.exe"
if defined ANODE (
  "%ANODE%" src\server.js %*
) else if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
  call "%APPDATA%\Antigravity\bin\agy-node.cmd" src\server.js %*
) else (
  node src\server.js %*
)
