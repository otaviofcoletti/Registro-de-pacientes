# Sistema de Registro de Pacientes - Clínica Odontológica

Sistema completo para gerenciamento de fichas de pacientes de uma clínica odontológica, incluindo cadastro de pacientes, anotações dentárias e desenho de odontogramas.

## 📋 Pré-requisitos

```
cd Backend
``` 

```
python -m venv .venv
```
```
source /home/consultorio/Registro-de-pacientes/Backend/.venv/bin/activate
```

```
pip install -r requirements.txt
```  


```
cd Frontend
```
```
sudo apt install nodejs npm
```
```
npm install
```
```
npm run dev
```

```
cd Database
```
```
docker compose up -d
```

Antes de começar, certifique-se de ter instalado:

### Para Windows:
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** e **npm** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)

### Para Linux:
- **Python 3.8+** - Instale via gerenciador de pacotes:
  ```bash
  sudo apt update
  sudo apt install python3 python3-pip python3-venv
  ```
- **Node.js 18+** e **npm** - Instale via gerenciador de pacotes:
  ```bash
  sudo apt install nodejs npm
  ```
  Ou via [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  ```
- **Docker** e **Docker Compose**:
  ```bash
  sudo apt install docker.io docker-compose
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker $USER
  ```
  (Reinicie o terminal após adicionar o usuário ao grupo docker)

## 🚀 Instalação e Execução

### Método 1: Usando os Scripts Automáticos (Recomendado)

#### Windows:
1. Abra o PowerShell ou Prompt de Comando na raiz do projeto
2. Execute:
   ```powershell
   .\start.bat
   ```

#### Linux:
1. Abra o terminal na raiz do projeto
2. Torne o script executável (apenas na primeira vez):
   ```bash
   chmod +x start.sh
   ```
3. Execute:
   ```bash
   ./start.sh
   ```

Os scripts irão:
- Verificar se o Docker está rodando
- Iniciar o banco de dados PostgreSQL
- Criar o ambiente virtual Python (se não existir)
- Instalar todas as dependências
- Iniciar o backend e frontend automaticamente

### Método 2: Instalação Manual

#### 1. Iniciar o Banco de Dados

Navegue até a pasta `Database` e execute:

```bash
docker-compose up -d
```

Isso irá:
- Baixar a imagem do PostgreSQL
- Criar o container `clinica_postgres`
- Inicializar o banco de dados com as tabelas necessárias
- Expor a porta 5432

**Credenciais do banco:**
- Host: `localhost`
- Porta: `5432`
- Usuário: `admin`
- Senha: `admin123`
- Database: `clinica`

#### 2. Configurar o Backend

1. Navegue até a pasta `Backend`:
   ```bash
   cd Backend
   ```

2. Crie um ambiente virtual (se ainda não tiver):
   ```bash
   # Windows
   python -m venv odonto
   
   # Linux
   python3 -m venv odonto
   ```

3. Ative o ambiente virtual:
   ```bash
   # Windows (PowerShell)
   .\odonto\Scripts\Activate.ps1
   
   # Windows (CMD)
   odonto\Scripts\activate.bat
   
   # Linux
   source odonto/bin/activate
   ```

4. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

5. Inicie o servidor Flask:
   ```bash
   python main.py
   ```

O backend estará rodando em `http://127.0.0.1:5000`

#### 3. Configurar o Frontend

1. Abra um novo terminal e navegue até a pasta `Frontend`:
   ```bash
   cd Frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O frontend estará rodando em `http://localhost:5173` (ou outra porta indicada pelo Vite)

## 📁 Estrutura do Projeto

```
Registro-de-pacientes/
├── Backend/              # API Flask
│   ├── main.py          # Servidor principal
│   ├── requirements.txt # Dependências Python
│   ├── odonto/          # Ambiente virtual (não versionado)
│   └── patient_images/  # Imagens salvas dos pacientes
├── Frontend/            # Aplicação React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas da aplicação
│   │   └── layout/      # Layout (Header, Footer)
│   ├── public/          # Arquivos estáticos
│   └── package.json     # Dependências Node.js
├── Database/            # Configuração do banco
│   ├── docker-compose.yaml
│   └── init.sql        # Script de inicialização
├── start.sh            # Script de inicialização (Linux)
├── start.bat           # Script de inicialização (Windows)
└── README.md           # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

### Backend:
- **Flask** - Framework web Python
- **Flask-CORS** - Permite requisições cross-origin
- **psycopg2** - Driver PostgreSQL para Python
- **Python 3.8+**

### Frontend:
- **React 18** - Biblioteca JavaScript para interfaces
- **React Router DOM** - Roteamento
- **Vite** - Build tool e dev server

### Banco de Dados:
- **PostgreSQL** - Banco de dados relacional
- **Docker** - Containerização

## 📝 Funcionalidades

- ✅ Cadastro de pacientes
- ✅ Edição de informações do paciente
- ✅ Exclusão de fichas (com confirmação)
- ✅ Anotações dentárias por dente
- ✅ Desenho de odontogramas com ferramentas:
  - Pincel
  - Formas geométricas (círculo, retângulo, triângulo)
  - Borracha (apaga apenas desenhos, preserva fundo)
- ✅ Salvamento de imagens editadas
- ✅ Navegação entre versões salvas das imagens
- ✅ Visualização de histórico de anotações

## 🔧 Configuração do Banco de Dados

O banco de dados é inicializado automaticamente pelo Docker. As tabelas criadas são:

- **paciente**: Informações básicas do paciente
- **informacao_tratamentos**: Anotações dentárias
- **imagens**: Registro de imagens salvas

## 🐛 Solução de Problemas

### Docker não está rodando
- **Windows**: Abra o Docker Desktop
- **Linux**: Execute `sudo systemctl start docker`

### Porta 5432 já está em uso
- Pare outros containers PostgreSQL ou altere a porta no `docker-compose.yaml`

### Erro ao conectar ao banco
- Verifique se o container está rodando: `docker ps`
- Verifique os logs: `docker logs clinica_postgres`

### Erro ao instalar dependências Python
- Certifique-se de que o ambiente virtual está ativado
- Tente atualizar o pip: `pip install --upgrade pip`

### Erro ao instalar dependências Node.js
- Limpe o cache: `npm cache clean --force`
- Delete `node_modules` e `package-lock.json` e reinstale

## 📞 Suporte

Para problemas ou dúvidas, verifique:
1. Se todos os serviços estão rodando (Docker, Backend, Frontend)
2. Os logs do console para mensagens de erro
3. As portas estão disponíveis (5000 para backend, 5173 para frontend, 5432 para PostgreSQL)

## 📄 Licença

Este projeto é de uso interno da clínica odontológica.








