#!/bin/bash

# Script para instalar o serviço systemd que inicia o docker-compose automaticamente

echo "Instalando serviço systemd para iniciar docker-compose automaticamente..."

# Copia o arquivo de serviço para o diretório do systemd
sudo cp registro-pacientes.service /etc/systemd/system/

# Recarrega o systemd para reconhecer o novo serviço
sudo systemctl daemon-reload

# Habilita o serviço para iniciar automaticamente no boot
sudo systemctl enable registro-pacientes.service

echo ""
echo "✓ Serviço instalado e habilitado com sucesso!"
echo ""
echo "Comandos úteis:"
echo "  - Iniciar o serviço agora: sudo systemctl start registro-pacientes"
echo "  - Verificar status: sudo systemctl status registro-pacientes"
echo "  - Ver logs: sudo journalctl -u registro-pacientes -f"
echo "  - Desabilitar auto-start: sudo systemctl disable registro-pacientes"
echo ""


