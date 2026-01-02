-- ===============================
-- TABELA PACIENTE
-- ===============================
CREATE TABLE IF NOT EXISTS paciente (
    cpf VARCHAR(11) PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE NOT NULL,
    endereco TEXT,
    convenio VARCHAR(50)
);

-- ===============================
-- TABELA INFORMACAO_TRATAMENTOS
-- ===============================
CREATE TABLE IF NOT EXISTS informacao_tratamentos (
    id_paciente VARCHAR(11) NOT NULL,
    epoch_criacao BIGINT NOT NULL,
    numero_dente INT,
    data DATE NOT NULL,
    anotacao TEXT,
    face_dente VARCHAR(50) DEFAULT 'Não se aplica',
    PRIMARY KEY (id_paciente, epoch_criacao),
    FOREIGN KEY (id_paciente) REFERENCES paciente (cpf) ON DELETE CASCADE
);

-- ===============================
-- TABELA IMAGENS
-- ===============================
CREATE TABLE IF NOT EXISTS imagens (
    id_paciente VARCHAR(11) NOT NULL,
    epoch_insercao BIGINT NOT NULL,
    tipo_imagem VARCHAR(20),
    caminho_arquivo TEXT NOT NULL,
    PRIMARY KEY (id_paciente, epoch_insercao),
    FOREIGN KEY (id_paciente) REFERENCES paciente (cpf) ON DELETE CASCADE
);

-- ===============================
-- TABELA ORCAMENTOS
-- ===============================
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    id_paciente VARCHAR(11) NOT NULL,
    data_orcamento DATE NOT NULL,
    FOREIGN KEY (id_paciente) REFERENCES paciente (cpf) ON DELETE CASCADE
);

-- ===============================
-- TABELA ORCAMENTO_ITENS
-- ===============================
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    data_item DATE NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos (id) ON DELETE CASCADE
);

-- ===============================
-- TABELA PAGAMENTOS
-- ===============================
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    meio_pagamento VARCHAR(50),
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos (id) ON DELETE CASCADE
);
