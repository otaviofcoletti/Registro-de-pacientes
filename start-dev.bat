@echo off
REM Script para iniciar Backend e Frontend em terminais separados
REM Windows Batch

echo ========================================
echo   Iniciando Backend e Frontend
echo ========================================
echo.

REM Obter o diretório do script
cd /d "%~dp0"

REM Abrir terminal para Backend
echo Abrindo terminal do Backend...
start "Backend - Flask" powershell -NoExit -Command "cd '%~dp0Backend'; Write-Host '========================================' -ForegroundColor Green; Write-Host '  BACKEND - Flask' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; if (Test-Path 'odonto\Scripts\Activate.ps1') { . odonto\Scripts\Activate.ps1; Write-Host 'Ambiente virtual ativado' -ForegroundColor Cyan; Write-Host ''; python main.py } else { Write-Host 'ERRO: Ambiente virtual nao encontrado!' -ForegroundColor Red; Write-Host 'Execute: python -m venv odonto' -ForegroundColor Yellow; pause }"

REM Aguardar um pouco antes de abrir o frontend
timeout /t 2 /nobreak >nul

REM Abrir terminal para Frontend
echo Abrindo terminal do Frontend...
start "Frontend - React/Vite" cmd /k "cd /d %~dp0Frontend && echo ======================================== && echo   FRONTEND - React/Vite && echo ======================================== && echo. && if exist node_modules (npm run dev -- --host 0.0.0.0) else (echo ERRO: node_modules nao encontrado! && echo Execute: npm install && pause)"

echo.
echo Terminais abertos com sucesso!
echo.
echo Backend: http://127.0.0.1:5000
echo Frontend: http://localhost:5173 (ou http://0.0.0.0:5173)
echo.
echo Para parar os servicos, feche as janelas dos terminais.
echo.
pause

