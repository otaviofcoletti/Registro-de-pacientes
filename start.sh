#!/bin/bash

echo "========================================"
echo "  Sistema de Registro de Pacientes"
echo "  Script de Inicialização - Linux"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Docker está rodando
echo "[1/6] Verificando Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}ERRO: Docker não está rodando!${NC}"
    echo "Por favor, inicie o Docker e tente novamente:"
    echo "  sudo systemctl start docker"
    exit 1
fi
echo -e "${GREEN}Docker está rodando. OK!${NC}"
echo ""

# Iniciar banco de dados
echo "[2/6] Iniciando banco de dados PostgreSQL..."
cd Database
if ! docker-compose up -d; then
    echo -e "${RED}ERRO: Falha ao iniciar o banco de dados!${NC}"
    exit 1
fi
echo -e "${GREEN}Banco de dados iniciado. OK!${NC}"
cd ..
echo ""

# Aguardar banco ficar pronto
echo "[3/6] Aguardando banco de dados ficar pronto..."
sleep 5
echo ""

# Configurar Backend
echo "[4/6] Configurando Backend..."
cd Backend

# Verificar se ambiente virtual existe
if [ ! -d "odonto" ]; then
    echo "Criando ambiente virtual Python..."
    if ! python3 -m venv odonto; then
        echo -e "${RED}ERRO: Falha ao criar ambiente virtual!${NC}"
        echo "Certifique-se de que Python 3 está instalado."
        exit 1
    fi
fi

# Ativar ambiente virtual e instalar dependências
echo "Ativando ambiente virtual e instalando dependências..."
source odonto/bin/activate
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}ERRO: Falha ao instalar dependências do backend!${NC}"
    exit 1
fi
echo -e "${GREEN}Backend configurado. OK!${NC}"
cd ..
echo ""

# Configurar Frontend
echo "[5/6] Configurando Frontend..."
cd Frontend

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERRO: Falha ao instalar dependências do frontend!${NC}"
        exit 1
    fi
else
    echo "Dependências do frontend já instaladas."
fi
echo -e "${GREEN}Frontend configurado. OK!${NC}"
cd ..
echo ""

# Iniciar serviços
echo "[6/6] Iniciando serviços..."
echo ""
echo "========================================"
echo "  Serviços sendo iniciados..."
echo "========================================"
echo "  Backend: http://127.0.0.1:5000"
echo "  Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar todos os serviços.${NC}"
echo ""

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "Parando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "Para parar o banco de dados, execute:"
    echo "  cd Database && docker-compose down"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Backend em background
cd Backend
source odonto/bin/activate
python main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar um pouco antes de iniciar frontend
sleep 3

# Iniciar Frontend em background
cd Frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}Serviços iniciados com sucesso!${NC}"
echo ""
echo "Logs:"
echo "  Backend: tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "Para parar os serviços:"
echo "  - Pressione Ctrl+C"
echo "  - Execute: cd Database && docker-compose down"
echo ""

# Aguardar processos
wait

