-- Migration para adicionar tabela de itens de orçamento
-- Execute este script no banco de dados se as tabelas orcamentos e pagamentos já existirem

-- Criar tabela orcamentos (se não existir)
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    id_paciente VARCHAR(11) NOT NULL,
    data_orcamento DATE NOT NULL,
    FOREIGN KEY (id_paciente) REFERENCES paciente (cpf) ON DELETE CASCADE
);

-- Criar tabela orcamento_itens
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    data_item DATE NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos (id) ON DELETE CASCADE
);

-- Criar tabela pagamentos (se não existir)
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    meio_pagamento VARCHAR(50),
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos (id) ON DELETE CASCADE
);


