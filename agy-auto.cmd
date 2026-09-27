@echo off
setlocal
set "PATH=%LOCALAPPDATA%\agy\bin;%PATH%"
cd /d "%~dp0"
if exist "%LOCALAPPDATA%\agy\bin\agy.exe" set "AGY_BIN=%LOCALAPPDATA%\agy\bin\agy.exe"
if defined ANODE (
  "%ANODE%" bin\agy-auto.js %*
) else if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
  call "%APPDATA%\Antigravity\bin\agy-node.cmd" bin\agy-auto.js %*
) else (
  node bin\agy-auto.js %*
)
