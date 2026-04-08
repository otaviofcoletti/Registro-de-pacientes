#!/bin/bash

# Script para abrir as portas no firewall (UFW ou firewalld)

echo "Abrindo portas 5000 (backend) e 5173 (frontend) no firewall..."

# Verifica se está usando UFW
if command -v ufw &> /dev/null; then
    echo "Usando UFW..."
    sudo ufw allow 5000/tcp
    sudo ufw allow 5173/tcp
    echo "✓ Portas abertas no UFW"
    sudo ufw status | grep -E "5000|5173"
fi

# Verifica se está usando firewalld
if command -v firewall-cmd &> /dev/null; then
    echo "Usando firewalld..."
    sudo firewall-cmd --permanent --add-port=5000/tcp
    sudo firewall-cmd --permanent --add-port=5173/tcp
    sudo firewall-cmd --reload
    echo "✓ Portas abertas no firewalld"
    sudo firewall-cmd --list-ports | grep -E "5000|5173"
fi

echo ""
echo "Importante: Se estiver usando outro firewall ou roteador,"
echo "certifique-se de que as portas 5000 e 5173 estão abertas."

