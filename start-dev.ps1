# Script para iniciar Backend e Frontend em terminais separados
# Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Backend e Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obter o diretório do script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Abrir terminal para Backend
Write-Host "Abrindo terminal do Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$scriptPath\Backend'; Write-Host '========================================' -ForegroundColor Green; Write-Host '  BACKEND - Flask' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; if (Test-Path 'odonto\Scripts\Activate.ps1') { . odonto\Scripts\Activate.ps1; Write-Host 'Ambiente virtual ativado' -ForegroundColor Cyan; Write-Host ''; python main.py } else { Write-Host 'ERRO: Ambiente virtual nao encontrado!' -ForegroundColor Red; Write-Host 'Execute: python -m venv odonto' -ForegroundColor Yellow; pause }"
) -WindowStyle Normal

# Aguardar um pouco antes de abrir o frontend
Start-Sleep -Seconds 2

# Abrir terminal para Frontend
Write-Host "Abrindo terminal do Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$scriptPath\Frontend'; Write-Host '========================================' -ForegroundColor Blue; Write-Host '  FRONTEND - React/Vite' -ForegroundColor Blue; Write-Host '========================================' -ForegroundColor Blue; Write-Host ''; if (Test-Path 'node_modules') { npm run dev -- --host 0.0.0.0 } else { Write-Host 'ERRO: node_modules nao encontrado!' -ForegroundColor Red; Write-Host 'Execute: npm install' -ForegroundColor Yellow; pause }"
) -WindowStyle Normal

Write-Host ""
Write-Host "Terminais abertos com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://127.0.0.1:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173 (ou http://0.0.0.0:5173)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para parar os servicos, feche as janelas dos terminais." -ForegroundColor Yellow
Write-Host ""

