#!/bin/bash

# Script para ajustar permissões da pasta patient_images
# Permite que o usuário possa escrever na pasta

echo "Ajustando permissões da pasta patient_images..."

# Obtém o usuário atual
USER=$(whoami)
GROUP=$(id -gn)

# Ajusta o dono da pasta para o usuário atual
sudo chown -R $USER:$GROUP /home/consultorio/Registro-de-pacientes/patient_images

# Ajusta permissões: 775 (rwxrwxr-x) - dono e grupo podem ler/escrever/executar, outros podem ler/executar
sudo chmod -R 775 /home/consultorio/Registro-de-pacientes/patient_images

echo "✓ Permissões ajustadas com sucesso!"
echo ""
echo "Permissões atuais:"
ls -la /home/consultorio/Registro-de-pacientes/ | grep patient_images
echo ""
echo "Pasta está agora acessível para escrita pelo usuário $USER"

