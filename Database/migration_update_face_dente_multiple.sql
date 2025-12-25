-- Atualizar coluna face_dente para suportar múltiplas faces
-- Primeiro, remover a constraint antiga
ALTER TABLE informacao_tratamentos 
DROP CONSTRAINT IF EXISTS check_face_dente;

-- Aumentar o tamanho do VARCHAR para suportar múltiplas faces (ex: "M, D, V, O, P")
ALTER TABLE informacao_tratamentos 
ALTER COLUMN face_dente TYPE VARCHAR(50);

-- Converter valores antigos para o novo formato de letras
-- Vestibular -> V
UPDATE informacao_tratamentos 
SET face_dente = 'V' 
WHERE face_dente = 'Vestibular';

-- Mesial -> M
UPDATE informacao_tratamentos 
SET face_dente = 'M' 
WHERE face_dente = 'Mesial';

-- Distal -> D
UPDATE informacao_tratamentos 
SET face_dente = 'D' 
WHERE face_dente = 'Distal';

-- Oclusal -> O
UPDATE informacao_tratamentos 
SET face_dente = 'O' 
WHERE face_dente = 'Oclusal';

-- Lingual -> P (Palatino)
UPDATE informacao_tratamentos 
SET face_dente = 'P' 
WHERE face_dente = 'Lingual';

-- Se houver múltiplas faces já separadas por vírgula, manter como está
-- Caso contrário, os valores já foram convertidos acima

