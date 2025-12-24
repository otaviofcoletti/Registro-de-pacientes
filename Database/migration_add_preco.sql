-- Script de migração para adicionar a coluna preco na tabela informacao_tratamentos
-- Execute este script no banco de dados existente

-- Adicionar coluna preco se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'informacao_tratamentos' 
        AND column_name = 'preco'
    ) THEN
        ALTER TABLE informacao_tratamentos ADD COLUMN preco DECIMAL(10, 2);
    END IF;
END $$;

-- Criar tabela pagamentos se ela não existir
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    id_paciente VARCHAR(11) NOT NULL,
    epoch_tratamento BIGINT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    meio_pagamento TEXT,
    FOREIGN KEY (id_paciente, epoch_tratamento) REFERENCES informacao_tratamentos (id_paciente, epoch_criacao) ON DELETE CASCADE
);

