# Instruções para Executar a Migração do Banco de Dados

O erro indica que a coluna `preco` não existe na tabela `informacao_tratamentos`. 
Execute um dos métodos abaixo para corrigir:

## Método 1: Via psql (Recomendado)

1. Conecte-se ao banco de dados PostgreSQL:
```bash
psql -h localhost -U admin -d clinica
```

2. Quando solicitado, digite a senha: `admin123`

3. Execute os seguintes comandos SQL:

```sql
-- Adicionar coluna preco
ALTER TABLE informacao_tratamentos ADD COLUMN preco DECIMAL(10, 2);

-- Criar tabela pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    id_paciente VARCHAR(11) NOT NULL,
    epoch_tratamento BIGINT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    meio_pagamento TEXT,
    FOREIGN KEY (id_paciente, epoch_tratamento) 
    REFERENCES informacao_tratamentos (id_paciente, epoch_criacao) 
    ON DELETE CASCADE
);
```

## Método 2: Via Docker (se estiver usando Docker)

```bash
docker exec -i clinica_postgres psql -U admin -d clinica < migration_add_preco.sql
```

## Método 3: Via Python (usando o ambiente virtual do backend)

1. Ative o ambiente virtual do backend:
```bash
cd Backend
.\odonto\Scripts\activate
```

2. Execute o script de migração:
```bash
cd ..\Database
python migrate.py
```

## Verificação

Após executar a migração, verifique se funcionou:

```sql
-- Verificar se a coluna preco existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'informacao_tratamentos' 
AND column_name = 'preco';

-- Verificar se a tabela pagamentos existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'pagamentos';
```

Se ambos retornarem resultados, a migração foi bem-sucedida!

