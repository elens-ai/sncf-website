@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
if "%~1"=="" pause
