import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from flask import jsonify
import psycopg2.extras


import os
import base64
from datetime import datetime


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Permite requisições de qualquer origem

# Middleware para logging de requisições
@app.before_request
def log_request_info():
    print(f"\n{'='*60}")
    print(f"REQUEST RECEBIDA:")
    print(f"  Método: {request.method}")
    print(f"  URL: {request.url}")
    print(f"  Origem: {request.remote_addr}")
    print(f"  Headers: {dict(request.headers)}")
    print(f"  Path: {request.path}")
    print(f"{'='*60}\n")

@app.after_request
def log_response_info(response):
    print(f"\n{'='*60}")
    print(f"RESPOSTA ENVIADA:")
    print(f"  Status: {response.status_code}")
    print(f"  Headers: {dict(response.headers)}")
    print(f"{'='*60}\n")
    return response

# Configuração do banco de dados
DB_CONFIG = {
    'dbname': 'clinica',
    'user': 'admin',
    'password': 'admin123',
    'host': 'localhost',
    'port': 5432
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# Endpoint para cadastrar um novo paciente
@app.route('/pacientes', methods=['POST'])
def add_paciente():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO paciente (cpf, nome, telefone, data_nascimento, endereco, convenio)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            data['cpf'], data['nome'], data.get('telefone'),
            data['dataNascimento'], data.get('endereco'),
            data.get('convenio')
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Paciente cadastrado com sucesso!'}), 201
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao cadastrar paciente.'}), 500

# Endpoint para listar todos os pacientes
@app.route('/pacientes', methods=['GET'])
def get_pacientes():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT cpf, nome, telefone, data_nascimento, endereco, convenio FROM paciente"
        cursor.execute(query)
        rows = cursor.fetchall()
        pacientes = [
            {
                'cpf': row[0],
                'nome': row[1],
                'telefone': row[2],
                'dataNascimento': row[3],
                'endereco': row[4],
                'convenio': row[5]
            } for row in rows
        ]
        cursor.close()
        conn.close()
        return jsonify(pacientes), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao buscar pacientes.'}), 500

# Endpoint para buscar um paciente específico pelo CPF
@app.route('/pacientes/<cpf>', methods=['GET'])
def get_paciente(cpf):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT cpf, nome, telefone, data_nascimento, endereco, convenio FROM paciente WHERE cpf = %s"
        cursor.execute(query, (cpf,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if row:
            paciente = {
                'cpf': row[0],
                'nome': row[1],
                'telefone': row[2],
                'dataNascimento': row[3],
                'endereco': row[4],
                'convenio': row[5]
            }
            return jsonify(paciente), 200
        else:
            return jsonify({'message': 'Paciente não encontrado.'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao buscar paciente.'}), 500

# Endpoint para atualizar os dados de um paciente
@app.route('/pacientes/<cpf>', methods=['PUT'])
def update_paciente(cpf):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Busca o nome antigo antes de atualizar
        cursor.execute("SELECT nome FROM paciente WHERE cpf = %s", (cpf,))
        old_row = cursor.fetchone()
        old_nome = old_row[0] if old_row else None
        
        # Atualiza os dados do paciente
        query = """
            UPDATE paciente
            SET nome = %s, telefone = %s, data_nascimento = %s, endereco = %s, convenio = %s
            WHERE cpf = %s
        """
        cursor.execute(query, (
            data['nome'], data.get('telefone'),
            data['dataNascimento'], data.get('endereco'),
            data.get('convenio'), cpf
        ))
        conn.commit()
        
        # Se o nome mudou, renomeia a pasta de imagens
        new_nome = data['nome']
        if old_nome and old_nome.strip() != new_nome.strip():
            import shutil
            # Remove caracteres inválidos do nome antigo e novo
            def sanitize_name(name):
                return name.replace('/', '-').replace('\\', '-').replace(':', '-').replace('*', '-').replace('?', '-').replace('"', '-').replace('<', '-').replace('>', '-').replace('|', '-').strip()
            
            old_nome_safe = sanitize_name(old_nome)
            new_nome_safe = sanitize_name(new_nome)
            
            old_folder_name = f"{old_nome_safe} - {cpf}"
            new_folder_name = f"{new_nome_safe} - {cpf}"
            
            old_folder_path = os.path.join(BASE_FOLDER, old_folder_name)
            new_folder_path = os.path.join(BASE_FOLDER, new_folder_name)
            
            # Se a pasta antiga existe e é diferente da nova, renomeia
            if os.path.exists(old_folder_path) and old_folder_path != new_folder_path:
                try:
                    # Se a pasta nova já existe, move os arquivos para dentro dela
                    if os.path.exists(new_folder_path):
                        for filename in os.listdir(old_folder_path):
                            old_file = os.path.join(old_folder_path, filename)
                            new_file = os.path.join(new_folder_path, filename)
                            if not os.path.exists(new_file):
                                shutil.move(old_file, new_file)
                        # Remove a pasta antiga se estiver vazia
                        if not os.listdir(old_folder_path):
                            os.rmdir(old_folder_path)
                    else:
                        # Renomeia a pasta inteira
                        shutil.move(old_folder_path, new_folder_path)
                    print(f"Pasta renomeada de '{old_folder_name}' para '{new_folder_name}'")
                except Exception as e:
                    print(f"Erro ao renomear pasta de imagens: {e}")
                    # Não falha a atualização do paciente se houver erro ao renomear pasta
        
        cursor.close()
        conn.close()
        return jsonify({'message': 'Paciente atualizado com sucesso!'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao atualizar paciente.'}), 500

# Endpoint para deletar um paciente
@app.route('/pacientes/<cpf>', methods=['DELETE'])
def delete_paciente(cpf):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "DELETE FROM paciente WHERE cpf = %s"
        cursor.execute(query, (cpf,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Paciente deletado com sucesso!'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao deletar paciente.'}), 500
    


@app.route('/paciente/<cpf>', methods=['GET'])
def get_patient_details(cpf):
    try:
        conn = get_db_connection()
        # Usando RealDictCursor para retornar resultados como dicionários
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Busca os dados do paciente
        query = "SELECT * FROM paciente WHERE cpf = %s"
        cursor.execute(query, (cpf,))
        patient = cursor.fetchone()

        if not patient:
            return jsonify({'error': 'Paciente não encontrado.'}), 404

        # Busca as anotações dentárias relacionadas ao paciente
        treatments_query = """
            SELECT numero_dente, data, anotacao, epoch_criacao, face_dente
            FROM informacao_tratamentos
            WHERE id_paciente = %s
            ORDER BY data DESC
        """
        cursor.execute(treatments_query, (cpf,))
        treatments = cursor.fetchall() or []
        # Monta a resposta
        patient_details = {
            'cpf': patient['cpf'],
            'name': patient['nome'],
            'phone': patient['telefone'],
            'birthdate': patient['data_nascimento'],
            'address': patient['endereco'],
            'convenio': patient['convenio'],
            'treatments': [
                {
                    'tooth': 'boca_inteira' if row['numero_dente'] is None else row['numero_dente'],
                    'date': row['data'],
                    'note': row['anotacao'],
                    'epoch': row['epoch_criacao'],
                    'face': row.get('face_dente', 'Não se aplica')
                }
                for row in treatments
            ]
        }


        return jsonify(patient_details), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao buscar detalhes do paciente.'}), 500
    finally:
        # Garantir que recursos sejam fechados
        cursor.close()
        conn.close()

    
@app.route('/paciente/<cpf>/anotacoes', methods=['POST'])
def add_annotation(cpf):
    try:
        data = request.json
        numero_dente = data.get('tooth')
        data_tratamento = data.get('date')
        anotacao = data.get('note')
        face_dente = data.get('face', 'Não se aplica')
        epoch_criacao = data.get('epoch')

        if not numero_dente or not data_tratamento or not anotacao:
            return jsonify({'error': 'Campos obrigatórios não preenchidos.'}), 400

        # Converte "boca_inteira" para None (NULL no banco)
        if numero_dente == 'boca_inteira':
            numero_dente = None

        conn = get_db_connection()
        cursor = conn.cursor()

        # Confirma que o paciente existe
        patient_query = "SELECT 1 FROM paciente WHERE cpf = %s"
        cursor.execute(patient_query, (cpf,))
        if not cursor.fetchone():
            return jsonify({'error': 'Paciente não encontrado.'}), 404

        # Insere a nova anotação
        insert_query = """
            INSERT INTO informacao_tratamentos (id_paciente, epoch_criacao, numero_dente, data, anotacao, face_dente)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (cpf, epoch_criacao, numero_dente, data_tratamento, anotacao, face_dente))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Anotação adicionada com sucesso.'}), 201
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao adicionar anotação.'}), 500
    

@app.route('/paciente/<cpf>/anotacoes/<int:annotation_id>', methods=['PUT'])
def update_annotation(cpf, annotation_id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Atualiza os campos apropriados na tabela
        query = """
            UPDATE informacao_tratamentos
            SET data = %s, numero_dente = %s, anotacao = %s, face_dente = %s
            WHERE id_paciente = %s AND epoch_criacao = %s
        """
        
        # Verifique se todas as chaves necessárias estão presentes no JSON
        if not all(key in data for key in ['data', 'numero_dente', 'anotacao']):
            return jsonify({'error': 'Faltam campos obrigatórios no corpo da requisição.'}), 400

        # Converte "boca_inteira" para None (NULL no banco)
        numero_dente = data['numero_dente']
        if numero_dente == 'boca_inteira':
            numero_dente = None

        face_dente = data.get('face_dente', 'Não se aplica')
        cursor.execute(query, (data['data'], numero_dente, data['anotacao'], face_dente, cpf, annotation_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Anotação atualizada com sucesso!'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao atualizar anotação.'}), 500


@app.route('/paciente/<cpf>/anotacoes/<int:annotation_id>', methods=['DELETE'])
def delete_annotation(cpf, annotation_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Verifica se a anotação existe
        query_check = """
            SELECT 1 
            FROM informacao_tratamentos 
            WHERE id_paciente = %s AND epoch_criacao = %s
        """
        cursor.execute(query_check, (cpf, annotation_id))
        if not cursor.fetchone():
            return jsonify({'error': 'Anotação não encontrada.'}), 404

        # Exclui a anotação
        query_delete = """
            DELETE FROM informacao_tratamentos 
            WHERE id_paciente = %s AND epoch_criacao = %s
        """
        cursor.execute(query_delete, (cpf, annotation_id))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({'message': 'Anotação deletada com sucesso!'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao deletar anotação.'}), 500
    


BASE_FOLDER = 'patient_images'

# Garante que a pasta base exista
if not os.path.exists(BASE_FOLDER):
    os.makedirs(BASE_FOLDER)

# Função auxiliar para obter o nome da pasta do paciente no formato "{nome} - {cpf}"
def get_patient_folder_name(cpf):
    """
    Busca o nome do paciente no banco e retorna o nome da pasta no formato "{nome} - {cpf}".
    Se o paciente não for encontrado, retorna apenas o CPF.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT nome FROM paciente WHERE cpf = %s"
        cursor.execute(query, (cpf,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if row and row[0]:
            nome = row[0].strip()
            # Remove caracteres inválidos para nome de pasta (Windows/Linux)
            nome_safe = nome.replace('/', '-').replace('\\', '-').replace(':', '-').replace('*', '-').replace('?', '-').replace('"', '-').replace('<', '-').replace('>', '-').replace('|', '-')
            return f"{nome_safe} - {cpf}"
        else:
            return cpf
    except Exception as e:
        print(f"Erro ao buscar nome do paciente: {e}")
        return cpf

@app.route('/save_image', methods=['POST'])
def save_image():
    data = request.get_json()
    cpf = data.get('cpf')
    image_data = data.get('image')
    # Caso não seja fornecido, usa o timestamp atual
    timestamp = data.get('timestamp', datetime.utcnow().isoformat())

    if not cpf or not image_data:
        return jsonify({'error': 'cpf e image são obrigatórios'}), 400

    # Obtém o nome da pasta no formato "{nome} - {cpf}"
    folder_name = get_patient_folder_name(cpf)
    
    # Cria uma pasta para o paciente, se não existir
    patient_folder = os.path.join(BASE_FOLDER, folder_name)
    if not os.path.exists(patient_folder):
        os.makedirs(patient_folder)
        
        # Se existir uma pasta antiga com apenas o CPF, migra as imagens
        old_folder = os.path.join(BASE_FOLDER, cpf)
        if os.path.exists(old_folder) and old_folder != patient_folder:
            import shutil
            try:
                # Move todos os arquivos da pasta antiga para a nova
                for filename in os.listdir(old_folder):
                    old_file = os.path.join(old_folder, filename)
                    new_file = os.path.join(patient_folder, filename)
                    shutil.move(old_file, new_file)
                # Remove a pasta antiga se estiver vazia
                if not os.listdir(old_folder):
                    os.rmdir(old_folder)
                print(f"Migradas imagens de {old_folder} para {patient_folder}")
            except Exception as e:
                print(f"Erro ao migrar pasta antiga: {e}")

    # Remove o cabeçalho (data:image/png;base64,) se existir
    if "," in image_data:
        header, encoded = image_data.split(',', 1)
    else:
        encoded = image_data

    image_bytes = base64.b64decode(encoded)
    
    # Salva a imagem com o timestamp como nome de arquivo
    # Substitui os ":" por "-" para evitar problemas no nome do arquivo
    safe_timestamp = timestamp.replace(":", "-")
    filename = f"{safe_timestamp}.png"
    filepath = os.path.join(patient_folder, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)
    
    # Aqui você pode inserir no banco de dados as informações da imagem, se necessário
    # Exemplo: db.insert_image(cpf=cpf, filename=filename, timestamp=timestamp)

    return jsonify({'message': 'Imagem salva com sucesso', 'filename': filename}), 200

@app.route('/update_image', methods=['PUT'])
def update_image():
    data = request.get_json()
    cpf = data.get('cpf')
    image_data = data.get('image')
    timestamp_iso = data.get('timestamp_iso')  # Timestamp da imagem original a ser atualizada

    if not cpf or not image_data or not timestamp_iso:
        return jsonify({'error': 'cpf, image e timestamp_iso são obrigatórios'}), 400

    try:
        # Obtém o nome da pasta no formato "{nome} - {cpf}"
        folder_name = get_patient_folder_name(cpf)
        patient_folder = os.path.join(BASE_FOLDER, folder_name)
        
        # Se a pasta nova não existir, tenta a pasta antiga (apenas CPF)
        if not os.path.exists(patient_folder):
            old_folder = os.path.join(BASE_FOLDER, cpf)
            if os.path.exists(old_folder):
                patient_folder = old_folder
            else:
                return jsonify({'error': 'Pasta do paciente não encontrada'}), 404

        # Reconstrói o nome do arquivo a partir do timestamp_iso
        safe_timestamp = timestamp_iso.replace(":", "-")
        filename = f"{safe_timestamp}.png"
        filepath = os.path.join(patient_folder, filename)

        if not os.path.exists(filepath):
            return jsonify({'error': 'Imagem não encontrada'}), 404

        # Remove o cabeçalho (data:image/png;base64,) se existir
        if "," in image_data:
            header, encoded = image_data.split(',', 1)
        else:
            encoded = image_data

        image_bytes = base64.b64decode(encoded)
        
        # Substitui o arquivo existente
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        return jsonify({'message': 'Imagem atualizada com sucesso', 'filename': filename}), 200
    except Exception as e:
        print(f"Erro ao atualizar imagem: {e}")
        return jsonify({'error': 'Erro ao atualizar imagem'}), 500

@app.route('/get_images', methods=['GET'])
def get_images():
    cpf = request.args.get('cpf')
    if not cpf:
        return jsonify({'error': 'cpf é obrigatório'}), 400

    # Obtém o nome da pasta no formato "{nome} - {cpf}"
    folder_name = get_patient_folder_name(cpf)
    patient_folder = os.path.join(BASE_FOLDER, folder_name)
    
    # Se a pasta nova não existir, tenta a pasta antiga (apenas CPF)
    if not os.path.exists(patient_folder):
        old_folder = os.path.join(BASE_FOLDER, cpf)
        if os.path.exists(old_folder):
            patient_folder = old_folder
    
    images = []
    if os.path.exists(patient_folder):
        for filename in os.listdir(patient_folder):
            filepath = os.path.join(patient_folder, filename)
            with open(filepath, "rb") as f:
                image_bytes = f.read()
                encoded = base64.b64encode(image_bytes).decode('utf-8')
                data_url = f"data:image/png;base64,{encoded}"
                
                # Processa o nome do arquivo para extrair o timestamp e formatá-lo de forma amigável
                # O nome esperado é algo como "2025-02-28T16-26-29.545Z.png"
                raw = filename.replace(".png", "")
                try:
                    # Separa a parte da data e do tempo
                    date_part, time_part = raw.split("T")
                    # Substitui somente os dois primeiros hífens da parte do tempo por dois pontos
                    time_part_fixed = time_part.replace("-", ":", 2)
                    iso_timestamp = f"{date_part}T{time_part_fixed}"
                    # Ajusta para um formato ISO compatível com datetime.fromisoformat (substituindo 'Z' por '+00:00')
                    iso_timestamp_fixed = iso_timestamp.replace("Z", "+00:00")
                    dt = datetime.fromisoformat(iso_timestamp_fixed)
                    # Formata a data de forma amigável
                    friendly_timestamp = dt.strftime("%d/%m/%Y %H:%M:%S")
                except Exception as e:
                    # Em caso de erro, retorna o valor bruto
                    friendly_timestamp = raw

                images.append({
                    'image': data_url,
                    'timestamp': friendly_timestamp,
                    'timestamp_iso': raw  # Timestamp original para ordenação
                })
    return jsonify({'images': images}), 200

@app.route('/delete_image', methods=['DELETE'])
def delete_image():
    cpf = request.args.get('cpf')
    timestamp_iso = request.args.get('timestamp_iso')
    
    if not cpf or not timestamp_iso:
        return jsonify({'error': 'cpf e timestamp_iso são obrigatórios'}), 400
    
    try:
        # Obtém o nome da pasta no formato "{nome} - {cpf}"
        folder_name = get_patient_folder_name(cpf)
        patient_folder = os.path.join(BASE_FOLDER, folder_name)
        
        # Se a pasta nova não existir, tenta a pasta antiga (apenas CPF)
        if not os.path.exists(patient_folder):
            old_folder = os.path.join(BASE_FOLDER, cpf)
            if os.path.exists(old_folder):
                patient_folder = old_folder
            else:
                return jsonify({'error': 'Pasta do paciente não encontrada'}), 404
        
        # Reconstrói o nome do arquivo a partir do timestamp_iso
        # O timestamp_iso vem no formato "2025-12-24T15-11-48.329Z"
        # Precisamos garantir que está no formato correto para o nome do arquivo
        safe_timestamp = timestamp_iso.replace(":", "-")
        filename = f"{safe_timestamp}.png"
        filepath = os.path.join(patient_folder, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Imagem não encontrada'}), 404
        
        # Deleta o arquivo
        os.remove(filepath)
        
        return jsonify({'message': 'Imagem deletada com sucesso'}), 200
    except Exception as e:
        print(f"Erro ao deletar imagem: {e}")
        return jsonify({'error': 'Erro ao deletar imagem'}), 500


# ========== ROTAS DE ORÇAMENTOS E PAGAMENTOS ==========

# Endpoint para buscar todos os orçamentos de um paciente com seus itens e pagamentos
@app.route('/paciente/<cpf>/orcamentos', methods=['GET'])
def get_orcamentos(cpf):
    try:
        print(f"[DEBUG] GET /paciente/{cpf}/orcamentos - Requisição recebida de {request.remote_addr}")
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        print(f"[DEBUG] CPF limpo: {cpf_clean}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Verifica se o paciente existe
        patient_query = "SELECT 1 FROM paciente WHERE cpf = %s"
        cursor.execute(patient_query, (cpf_clean,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Paciente não encontrado.'}), 404
        
        # Busca todos os orçamentos
        orcamentos_query = """
            SELECT id, data_orcamento
            FROM orcamentos
            WHERE id_paciente = %s
            ORDER BY data_orcamento DESC, id DESC
        """
        cursor.execute(orcamentos_query, (cpf_clean,))
        orcamentos = cursor.fetchall() or []
        
        # Para cada orçamento, busca os itens e pagamentos
        resultado = []
        for orcamento in orcamentos:
            # Busca os itens do orçamento
            itens_query = """
                SELECT id, data_item, preco, descricao
                FROM orcamento_itens
                WHERE id_orcamento = %s
                ORDER BY id ASC
            """
            cursor.execute(itens_query, (orcamento['id'],))
            itens = cursor.fetchall() or []
            
            # Calcula o total dos itens
            total_orcamento = sum(float(item['preco']) for item in itens)
            
            # Busca os pagamentos
            pagamentos_query = """
                SELECT id, data_pagamento, valor_parcela, meio_pagamento
                FROM pagamentos
                WHERE id_orcamento = %s
                ORDER BY data_pagamento DESC
            """
            cursor.execute(pagamentos_query, (orcamento['id'],))
            pagamentos = cursor.fetchall() or []
            
            # Converte itens para dicionários com campos formatados
            itens_formatados = []
            for item in itens:
                itens_formatados.append({
                    'id': item['id'],
                    'data_item': str(item['data_item']),
                    'preco': float(item['preco']),
                    'descricao': item['descricao'] or ''
                })
            
            resultado.append({
                'id': orcamento['id'],
                'data_orcamento': str(orcamento['data_orcamento']),
                'itens': itens_formatados,
                'total': float(total_orcamento),
                'pagamentos': [dict(p) for p in pagamentos]
            })
        
        cursor.close()
        conn.close()
        
        print(f"[DEBUG] Retornando {len(resultado)} orçamentos")
        return jsonify(resultado), 200
    except Exception as e:
        print(f"[ERROR] Erro ao buscar orçamentos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Erro ao buscar orçamentos.'}), 500

# Endpoint para adicionar um orçamento
@app.route('/paciente/<cpf>/orcamentos', methods=['POST'])
def add_orcamento(cpf):
    try:
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        
        data = request.json
        data_orcamento = data.get('data_orcamento')
        itens = data.get('itens', [])
        
        if not data_orcamento:
            return jsonify({'error': 'Data do orçamento é obrigatória.'}), 400
        
        if not itens or len(itens) == 0:
            return jsonify({'error': 'É necessário adicionar pelo menos um item ao orçamento.'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verifica se o paciente existe
        check_query = "SELECT 1 FROM paciente WHERE cpf = %s"
        cursor.execute(check_query, (cpf_clean,))
        if not cursor.fetchone():
            return jsonify({'error': 'Paciente não encontrado.'}), 404
        
        # Insere o orçamento
        insert_query = """
            INSERT INTO orcamentos (id_paciente, data_orcamento)
            VALUES (%s, %s)
            RETURNING id
        """
        cursor.execute(insert_query, (cpf_clean, data_orcamento))
        orcamento_id = cursor.fetchone()[0]
        
        # Insere os itens do orçamento
        for item in itens:
            item_data = item.get('data_item', data_orcamento)
            item_preco = item.get('preco')
            item_descricao = item.get('descricao', '')
            
            if not item_preco:
                conn.rollback()
                cursor.close()
                conn.close()
                return jsonify({'error': 'Todos os itens devem ter um preço.'}), 400
            
            insert_item_query = """
                INSERT INTO orcamento_itens (id_orcamento, data_item, preco, descricao)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(insert_item_query, (orcamento_id, item_data, item_preco, item_descricao))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Orçamento adicionado com sucesso.', 'id': orcamento_id}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao adicionar orçamento.'}), 500

# Endpoint para atualizar um orçamento
@app.route('/paciente/<cpf>/orcamentos/<int:orcamento_id>', methods=['PUT'])
def update_orcamento(cpf, orcamento_id):
    try:
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        
        data = request.json
        data_orcamento = data.get('data_orcamento')
        
        if not data_orcamento:
            return jsonify({'error': 'Data do orçamento é obrigatória.'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verifica se o orçamento existe e pertence ao paciente
        check_query = "SELECT 1 FROM orcamentos WHERE id = %s AND id_paciente = %s"
        cursor.execute(check_query, (orcamento_id, cpf_clean))
        if not cursor.fetchone():
            return jsonify({'error': 'Orçamento não encontrado.'}), 404
        
        # Atualiza a data do orçamento
        update_query = """
            UPDATE orcamentos
            SET data_orcamento = %s
            WHERE id = %s AND id_paciente = %s
        """
        cursor.execute(update_query, (data_orcamento, orcamento_id, cpf_clean))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Orçamento atualizado com sucesso.'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao atualizar orçamento.'}), 500

# Endpoint para deletar um orçamento
@app.route('/paciente/<cpf>/orcamentos/<int:orcamento_id>', methods=['DELETE'])
def delete_orcamento(cpf, orcamento_id):
    try:
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            DELETE FROM orcamentos
            WHERE id = %s AND id_paciente = %s
        """
        cursor.execute(query, (orcamento_id, cpf_clean))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Orçamento não encontrado.'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Orçamento deletado com sucesso.'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao deletar orçamento.'}), 500

# Endpoint para adicionar um pagamento a um orçamento
@app.route('/orcamentos/<int:orcamento_id>/pagamentos', methods=['POST'])
def add_pagamento(orcamento_id):
    try:
        data = request.json
        data_pagamento = data.get('data_pagamento')
        valor_parcela = data.get('valor_parcela')
        meio_pagamento = data.get('meio_pagamento', '')
        
        if not data_pagamento or not valor_parcela:
            return jsonify({'error': 'Data e valor são obrigatórios.'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verifica se o orçamento existe
        check_query = "SELECT 1 FROM orcamentos WHERE id = %s"
        cursor.execute(check_query, (orcamento_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Orçamento não encontrado.'}), 404
        
        # Insere o pagamento
        insert_query = """
            INSERT INTO pagamentos (id_orcamento, data_pagamento, valor_parcela, meio_pagamento)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(insert_query, (orcamento_id, data_pagamento, valor_parcela, meio_pagamento))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Pagamento adicionado com sucesso.'}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao adicionar pagamento.'}), 500

# Endpoint para atualizar um pagamento
@app.route('/orcamentos/<int:orcamento_id>/pagamentos/<int:pagamento_id>', methods=['PUT'])
def update_pagamento(orcamento_id, pagamento_id):
    try:
        data = request.json
        data_pagamento = data.get('data_pagamento')
        valor_parcela = data.get('valor_parcela')
        meio_pagamento = data.get('meio_pagamento', '')
        
        if not data_pagamento or not valor_parcela:
            return jsonify({'error': 'Data e valor são obrigatórios.'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            UPDATE pagamentos
            SET data_pagamento = %s, valor_parcela = %s, meio_pagamento = %s
            WHERE id = %s AND id_orcamento = %s
        """
        cursor.execute(query, (data_pagamento, valor_parcela, meio_pagamento, pagamento_id, orcamento_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Pagamento não encontrado.'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Pagamento atualizado com sucesso.'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao atualizar pagamento.'}), 500

# Endpoint para deletar um pagamento
@app.route('/orcamentos/<int:orcamento_id>/pagamentos/<int:pagamento_id>', methods=['DELETE'])
def delete_pagamento(orcamento_id, pagamento_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            DELETE FROM pagamentos
            WHERE id = %s AND id_orcamento = %s
        """
        cursor.execute(query, (pagamento_id, orcamento_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Pagamento não encontrado.'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Pagamento deletado com sucesso.'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao deletar pagamento.'}), 500

# Endpoint para adicionar um item a um orçamento
@app.route('/orcamentos/<int:orcamento_id>/itens', methods=['POST'])
def add_item_orcamento(orcamento_id):
    try:
        data = request.json
        data_item = data.get('data_item')
        preco = data.get('preco')
        descricao = data.get('descricao', '')
        
        if not data_item or not preco:
            return jsonify({'error': 'Data e preço são obrigatórios.'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verifica se o orçamento existe
        check_query = "SELECT 1 FROM orcamentos WHERE id = %s"
        cursor.execute(check_query, (orcamento_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Orçamento não encontrado.'}), 404
        
        # Insere o item
        insert_query = """
            INSERT INTO orcamento_itens (id_orcamento, data_item, preco, descricao)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """
        cursor.execute(insert_query, (orcamento_id, data_item, preco, descricao))
        item_id = cursor.fetchone()[0]
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Item adicionado com sucesso.', 'id': item_id}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao adicionar item.'}), 500

# Endpoint para atualizar um item de orçamento
@app.route('/orcamentos/<int:orcamento_id>/itens/<int:item_id>', methods=['PUT'])
def update_item_orcamento(orcamento_id, item_id):
    try:
        data = request.json
        data_item = data.get('data_item')
        preco = data.get('preco')
        descricao = data.get('descricao', '')
        
        if not data_item or not preco:
            return jsonify({'error': 'Data e preço são obrigatórios.'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            UPDATE orcamento_itens
            SET data_item = %s, preco = %s, descricao = %s
            WHERE id = %s AND id_orcamento = %s
        """
        cursor.execute(query, (data_item, preco, descricao, item_id, orcamento_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Item não encontrado.'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Item atualizado com sucesso.'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao atualizar item.'}), 500

# Endpoint para deletar um item de orçamento
@app.route('/orcamentos/<int:orcamento_id>/itens/<int:item_id>', methods=['DELETE'])
def delete_item_orcamento(orcamento_id, item_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            DELETE FROM orcamento_itens
            WHERE id = %s AND id_orcamento = %s
        """
        cursor.execute(query, (item_id, orcamento_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Item não encontrado.'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Item deletado com sucesso.'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao deletar item.'}), 500

# Endpoint para buscar descrições únicas dos itens de orçamentos de um paciente
@app.route('/paciente/<cpf>/orcamentos/descricoes', methods=['GET'])
def get_descricoes_orcamentos(cpf):
    try:
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verifica se o paciente existe
        patient_query = "SELECT 1 FROM paciente WHERE cpf = %s"
        cursor.execute(patient_query, (cpf_clean,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Paciente não encontrado.'}), 404
        
        # Busca descrições únicas e não vazias dos itens de orçamentos do paciente
        descricoes_query = """
            SELECT DISTINCT oi.descricao
            FROM orcamento_itens oi
            INNER JOIN orcamentos o ON oi.id_orcamento = o.id
            WHERE o.id_paciente = %s
            AND oi.descricao IS NOT NULL
            AND oi.descricao != ''
            ORDER BY oi.descricao ASC
        """
        cursor.execute(descricoes_query, (cpf_clean,))
        descricoes = cursor.fetchall()
        
        # Extrai apenas os valores das descrições
        descricoes_list = [row[0] for row in descricoes]
        
        cursor.close()
        conn.close()
        
        return jsonify(descricoes_list), 200
    except Exception as e:
        print(f"Erro ao buscar descrições de orçamentos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Erro ao buscar descrições de orçamentos.'}), 500


if __name__ == '__main__':
    import socket
    hostname = socket.gethostname()
    try:
        local_ip = socket.gethostbyname(hostname)
    except:
        local_ip = "N/A"
    
    # Tenta obter o IP da interface de rede
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        network_ip = s.getsockname()[0]
        s.close()
    except:
        network_ip = "N/A"
    
    print(f"\n{'='*60}")
    print(f"SERVIDOR FLASK INICIANDO")
    print(f"  Host: 0.0.0.0 (aceita conexões de qualquer IP)")
    print(f"  Porta: 5000")
    print(f"  Hostname: {hostname}")
    if local_ip != "N/A":
        print(f"  IP Local: {local_ip}")
    if network_ip != "N/A":
        print(f"  IP de Rede: {network_ip}")
    print(f"  Acesse em: http://localhost:5000")
    if network_ip != "N/A":
        print(f"  Ou em: http://{network_ip}:5000")
    print(f"{'='*60}\n")
    app.run(host='0.0.0.0', port=5000, debug=True)

