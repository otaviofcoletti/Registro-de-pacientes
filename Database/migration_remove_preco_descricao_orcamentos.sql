-- Migration para remover colunas preco e descricao da tabela orcamentos
-- Essas colunas agora estão na tabela orcamento_itens

-- Primeiro, verificar se as colunas existem antes de tentar removê-las
-- Remover constraint NOT NULL se existir
DO $$ 
BEGIN
    -- Remover NOT NULL constraint de preco se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orcamentos' AND column_name = 'preco'
    ) THEN
        ALTER TABLE orcamentos ALTER COLUMN preco DROP NOT NULL;
    END IF;
    
    -- Remover NOT NULL constraint de descricao se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orcamentos' AND column_name = 'descricao'
    ) THEN
        ALTER TABLE orcamentos ALTER COLUMN descricao DROP NOT NULL;
    END IF;
END $$;

-- Remover as colunas preco e descricao da tabela orcamentos
DO $$ 
BEGIN
    -- Remover coluna preco se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orcamentos' AND column_name = 'preco'
    ) THEN
        ALTER TABLE orcamentos DROP COLUMN preco;
    END IF;
    
    -- Remover coluna descricao se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orcamentos' AND column_name = 'descricao'
    ) THEN
        ALTER TABLE orcamentos DROP COLUMN descricao;
    END IF;
END $$;

-- Garantir que a tabela orcamento_itens existe
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    data_item DATE NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos (id) ON DELETE CASCADE
);

-- Garantir que a tabela pagamentos existe
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    meio_pagamento VARCHAR(50),
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos (id) ON DELETE CASCADE
);


