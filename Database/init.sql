-- Criar tabela paciente
CREATE TABLE paciente (
    cpf VARCHAR(11) PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE NOT NULL,
    endereco TEXT,
    convenio VARCHAR(50)
);

-- Criar tabela informacao_tratamentos
CREATE TABLE informacao_tratamentos (
    id_paciente VARCHAR(11) NOT NULL,
    epoch_criacao BIGINT NOT NULL,
    numero_dente INT,
    data DATE NOT NULL,
    anotacao TEXT,
    PRIMARY KEY (id_paciente, epoch_criacao),
    FOREIGN KEY (id_paciente) REFERENCES paciente (cpf)
);

-- Criar tabela imagens
CREATE TABLE imagens (
    id_paciente VARCHAR(11) NOT NULL,
    epoch_insercao BIGINT NOT NULL,
    tipo_imagem VARCHAR(20) CHECK (tipo_imagem IN ('foto', 'rx', 'ficha')),
    caminho_arquivo TEXT NOT NULL,
    PRIMARY KEY (id_paciente, epoch_insercao),
    FOREIGN KEY (id_paciente) REFERENCES paciente (cpf)
);

-- Criar tabela orcamentos
CREATE TABLE orcamentos (
    id SERIAL PRIMARY KEY,
    id_paciente VARCHAR(11) NOT NULL,
    data_orcamento DATE NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    FOREIGN KEY (id_paciente) REFERENCES paciente (cpf) ON DELETE CASCADE
);

-- Criar tabela pagamentos
CREATE TABLE pagamentos (
    id SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    meio_pagamento TEXT,
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos (id) ON DELETE CASCADE
);