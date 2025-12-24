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
CORS(app)  # Permite requisições do front-end

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
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        
        conn = get_db_connection()
        # Usando RealDictCursor para retornar resultados como dicionários
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Busca os dados do paciente
        query = "SELECT * FROM paciente WHERE cpf = %s"
        cursor.execute(query, (cpf_clean,))
        patient = cursor.fetchone()

        if not patient:
            return jsonify({'error': 'Paciente não encontrado.'}), 404

        # Busca as anotações dentárias relacionadas ao paciente
        treatments_query = """
            SELECT numero_dente, data, anotacao, epoch_criacao
            FROM informacao_tratamentos
            WHERE id_paciente = %s
            ORDER BY data DESC
        """
        cursor.execute(treatments_query, (cpf_clean,))
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
                    'tooth': row['numero_dente'],
                    'date': row['data'],
                    'note': row['anotacao'],
                    'epoch': row['epoch_criacao']
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
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        
        data = request.json
        numero_dente = data.get('tooth')
        data_tratamento = data.get('date')
        anotacao = data.get('note')
        epoch_criacao = data.get('epoch')

        if not numero_dente or not data_tratamento or not anotacao:
            return jsonify({'error': 'Campos obrigatórios não preenchidos.'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Confirma que o paciente existe
        patient_query = "SELECT 1 FROM paciente WHERE cpf = %s"
        cursor.execute(patient_query, (cpf_clean,))
        if not cursor.fetchone():
            return jsonify({'error': 'Paciente não encontrado.'}), 404

        # Insere a nova anotação
        insert_query = """
            INSERT INTO informacao_tratamentos (id_paciente, epoch_criacao, numero_dente, data, anotacao)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (cpf_clean, epoch_criacao, numero_dente, data_tratamento, anotacao))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Anotação adicionada com sucesso.'}), 201
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao adicionar anotação.'}), 500
    

@app.route('/paciente/<cpf>/anotacoes/<int:annotation_id>', methods=['PUT'])
def update_annotation(cpf, annotation_id):
    # Remove formatação do CPF (pontos e traços)
    cpf_clean = cpf.replace('.', '').replace('-', '')
    
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Atualiza os campos apropriados na tabela
        query = """
            UPDATE informacao_tratamentos
            SET data = %s, numero_dente = %s, anotacao = %s
            WHERE id_paciente = %s AND epoch_criacao = %s
        """
        
        # Verifique se todas as chaves necessárias estão presentes no JSON
        if not all(key in data for key in ['data', 'numero_dente', 'anotacao']):
            return jsonify({'error': 'Faltam campos obrigatórios no corpo da requisição.'}), 400

        cursor.execute(query, (data['data'], data['numero_dente'], data['anotacao'], cpf_clean, annotation_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Anotação atualizada com sucesso!'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Erro ao atualizar anotação.'}), 500


@app.route('/paciente/<cpf>/anotacoes/<int:annotation_id>', methods=['DELETE'])
def delete_annotation(cpf, annotation_id):
    # Remove formatação do CPF (pontos e traços)
    cpf_clean = cpf.replace('.', '').replace('-', '')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Verifica se a anotação existe
        query_check = """
            SELECT 1 
            FROM informacao_tratamentos 
            WHERE id_paciente = %s AND epoch_criacao = %s
        """
        cursor.execute(query_check, (cpf_clean, annotation_id))
        if not cursor.fetchone():
            return jsonify({'error': 'Anotação não encontrada.'}), 404

        # Exclui a anotação
        query_delete = """
            DELETE FROM informacao_tratamentos 
            WHERE id_paciente = %s AND epoch_criacao = %s
        """
        cursor.execute(query_delete, (cpf_clean, annotation_id))
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

@app.route('/save_image', methods=['POST'])
def save_image():
    data = request.get_json()
    cpf = data.get('cpf')
    image_data = data.get('image')
    # Caso não seja fornecido, usa o timestamp atual
    timestamp = data.get('timestamp', datetime.utcnow().isoformat())

    if not cpf or not image_data:
        return jsonify({'error': 'cpf e image são obrigatórios'}), 400

    # Cria uma pasta para o paciente, se não existir
    patient_folder = os.path.join(BASE_FOLDER, cpf)
    if not os.path.exists(patient_folder):
        os.makedirs(patient_folder)

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

@app.route('/get_images', methods=['GET'])
def get_images():
    cpf = request.args.get('cpf')
    if not cpf:
        return jsonify({'error': 'cpf é obrigatório'}), 400

    patient_folder = os.path.join(BASE_FOLDER, cpf)
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
                    'timestamp': friendly_timestamp
                })
    return jsonify({'images': images}), 200


# ========== ROTAS DE ORÇAMENTOS E PAGAMENTOS ==========

# Endpoint para buscar todos os orçamentos de um paciente com seus pagamentos
@app.route('/paciente/<cpf>/orcamentos', methods=['GET'])
def get_orcamentos(cpf):
    try:
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        
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
            SELECT id, data_orcamento, preco, descricao
            FROM orcamentos
            WHERE id_paciente = %s
            ORDER BY data_orcamento DESC, id DESC
        """
        cursor.execute(orcamentos_query, (cpf_clean,))
        orcamentos = cursor.fetchall() or []
        
        # Para cada orçamento, busca os pagamentos
        resultado = []
        for orcamento in orcamentos:
            pagamentos_query = """
                SELECT id, data_pagamento, valor_parcela, meio_pagamento
                FROM pagamentos
                WHERE id_orcamento = %s
                ORDER BY data_pagamento DESC
            """
            cursor.execute(pagamentos_query, (orcamento['id'],))
            pagamentos = cursor.fetchall() or []
            
            resultado.append({
                'id': orcamento['id'],
                'data_orcamento': str(orcamento['data_orcamento']),
                'preco': float(orcamento['preco']),
                'descricao': orcamento['descricao'] or '',
                'pagamentos': [dict(p) for p in pagamentos]
            })
        
        cursor.close()
        conn.close()
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Erro ao buscar orçamentos.'}), 500

# Endpoint para adicionar um orçamento
@app.route('/paciente/<cpf>/orcamentos', methods=['POST'])
def add_orcamento(cpf):
    try:
        # Remove formatação do CPF (pontos e traços)
        cpf_clean = cpf.replace('.', '').replace('-', '')
        
        data = request.json
        data_orcamento = data.get('data_orcamento')
        preco = data.get('preco')
        descricao = data.get('descricao', '')
        
        if not data_orcamento or not preco:
            return jsonify({'error': 'Data e preço são obrigatórios.'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verifica se o paciente existe
        check_query = "SELECT 1 FROM paciente WHERE cpf = %s"
        cursor.execute(check_query, (cpf_clean,))
        if not cursor.fetchone():
            return jsonify({'error': 'Paciente não encontrado.'}), 404
        
        # Insere o orçamento
        insert_query = """
            INSERT INTO orcamentos (id_paciente, data_orcamento, preco, descricao)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """
        cursor.execute(insert_query, (cpf_clean, data_orcamento, preco, descricao))
        orcamento_id = cursor.fetchone()[0]
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
        preco = data.get('preco')
        descricao = data.get('descricao', '')
        
        if not data_orcamento or not preco:
            return jsonify({'error': 'Data e preço são obrigatórios.'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            UPDATE orcamentos
            SET data_orcamento = %s, preco = %s, descricao = %s
            WHERE id = %s AND id_paciente = %s
        """
        cursor.execute(query, (data_orcamento, preco, descricao, orcamento_id, cpf_clean))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Orçamento não encontrado.'}), 404
        
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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

