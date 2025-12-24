-- Script de migração para nova estrutura de orçamentos e pagamentos
-- Execute este script no banco de dados existente

-- 1. Remover coluna preco da tabela informacao_tratamentos (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'informacao_tratamentos' 
        AND column_name = 'preco'
    ) THEN
        ALTER TABLE informacao_tratamentos DROP COLUMN preco;
    END IF;
END $$;

-- 2. Deletar tabela pagamentos antiga (se existir)
DROP TABLE IF EXISTS pagamentos CASCADE;

-- 3. Criar tabela orcamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    id_paciente VARCHAR(11) NOT NULL,
    data_orcamento DATE NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    FOREIGN KEY (id_paciente) REFERENCES paciente (cpf) ON DELETE CASCADE
);

-- 4. Criar nova tabela pagamentos ligada a orcamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    meio_pagamento TEXT,
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos (id) ON DELETE CASCADE
);

