#!/bin/bash

# Script para instalar o serviço systemd no nível de usuário (não requer sudo para gerenciar)

echo "Instalando serviço systemd de usuário para iniciar docker-compose automaticamente..."

# Cria o diretório de serviços do usuário se não existir
mkdir -p ~/.config/systemd/user

# Copia o arquivo de serviço para o diretório do usuário
cp registro-pacientes.service ~/.config/systemd/user/

# Recarrega o systemd do usuário
systemctl --user daemon-reload

# Habilita o serviço para iniciar automaticamente no login
systemctl --user enable registro-pacientes.service

# Habilita o linger para que o serviço inicie mesmo sem login ativo
# Isso requer sudo uma vez, mas depois não precisa mais
if ! systemctl is-enabled user@$(id -u).service &>/dev/null; then
    echo "Habilitando linger (permite serviços de usuário iniciarem sem login)..."
    sudo loginctl enable-linger $USER
fi

echo ""
echo "✓ Serviço instalado e habilitado com sucesso!"
echo ""
echo "Comandos úteis:"
echo "  - Iniciar o serviço agora: systemctl --user start registro-pacientes"
echo "  - Verificar status: systemctl --user status registro-pacientes"
echo "  - Ver logs: journalctl --user -u registro-pacientes -f"
echo "  - Parar o serviço: systemctl --user stop registro-pacientes"
echo "  - Desabilitar auto-start: systemctl --user disable registro-pacientes"
echo ""


