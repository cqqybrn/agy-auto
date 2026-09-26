@echo off
setlocal
set "PATH=%LOCALAPPDATA%\agy\bin;%PATH%"
cd /d "%~dp0"
node bin\agy-auto.js %*
