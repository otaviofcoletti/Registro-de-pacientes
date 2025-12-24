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
