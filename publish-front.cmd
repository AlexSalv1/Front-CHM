@echo off
setlocal
set "ROOT=%~dp0.."
set "GIT=%ROOT%\git-local.cmd"

cd /d "%~dp0"

call "%GIT%" config --global --add safe.directory "%cd%"
call "%GIT%" branch -M main
call "%GIT%" remote remove origin 2>nul
call "%GIT%" remote add origin https://github.com/AlexSalv1/Front-CHM.git
call "%GIT%" add .
call "%GIT%" commit -m "Update frontend CRM and contract reports"
call "%GIT%" push -u origin main

endlocal
