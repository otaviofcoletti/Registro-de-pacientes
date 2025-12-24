@echo off
echo ========================================
echo   Sistema de Registro de Pacientes
echo   Script de Inicializacao - Windows
echo ========================================
echo.

REM Verificar se Docker está rodando
echo [1/6] Verificando Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERRO: Docker nao esta rodando!
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)
echo Docker esta rodando. OK!
echo.

REM Iniciar banco de dados
echo [2/6] Iniciando banco de dados PostgreSQL...
cd Database
docker-compose up -d
if errorlevel 1 (
    echo ERRO: Falha ao iniciar o banco de dados!
    pause
    exit /b 1
)
echo Banco de dados iniciado. OK!
cd ..
echo.

REM Aguardar banco ficar pronto
echo [3/6] Aguardando banco de dados ficar pronto...
timeout /t 5 /nobreak >nul
echo.

REM Configurar Backend
echo [4/6] Configurando Backend...
cd Backend

REM Verificar se ambiente virtual existe
if not exist "odonto\Scripts\activate.bat" (
    echo Criando ambiente virtual Python...
    python -m venv odonto
    if errorlevel 1 (
        echo ERRO: Falha ao criar ambiente virtual!
        echo Certifique-se de que Python esta instalado.
        pause
        exit /b 1
    )
)

REM Ativar ambiente virtual e instalar dependências
echo Ativando ambiente virtual e instalando dependencias...
call odonto\Scripts\activate.bat
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias do backend!
    pause
    exit /b 1
)
echo Backend configurado. OK!
cd ..
echo.

REM Configurar Frontend
echo [5/6] Configurando Frontend...
cd Frontend

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias do frontend...
    call npm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias do frontend!
        pause
        exit /b 1
    )
) else (
    echo Dependencias do frontend ja instaladas.
)
echo Frontend configurado. OK!
cd ..
echo.

REM Iniciar serviços
echo [6/6] Iniciando servicos...
echo.
echo ========================================
echo   Servicos sendo iniciados...
echo ========================================
echo   Backend: http://127.0.0.1:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Pressione Ctrl+C para parar todos os servicos.
echo.

REM Iniciar Backend em nova janela
start "Backend - Flask" cmd /k "cd Backend && call odonto\Scripts\activate.bat && python main.py"

REM Aguardar um pouco antes de iniciar frontend
timeout /t 3 /nobreak >nul

REM Iniciar Frontend em nova janela
start "Frontend - React" cmd /k "cd Frontend && npm run dev"

echo.
echo Servicos iniciados com sucesso!
echo.
echo Para parar os servicos:
echo - Feche as janelas do Backend e Frontend
echo - Execute: cd Database && docker-compose down
echo.
pause



