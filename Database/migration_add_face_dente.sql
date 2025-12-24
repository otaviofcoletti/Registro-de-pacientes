-- Adicionar coluna face_dente na tabela informacao_tratamentos
ALTER TABLE informacao_tratamentos 
ADD COLUMN face_dente VARCHAR(20) DEFAULT 'Não se aplica';

-- Adicionar constraint para garantir valores válidos
ALTER TABLE informacao_tratamentos 
ADD CONSTRAINT check_face_dente 
CHECK (face_dente IN ('Não se aplica', 'Vestibular', 'Lingual', 'Mesial', 'Distal', 'Oclusal'));

