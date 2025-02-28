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
            SELECT numero_dente, data, anotacao, epoch_criacao
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
        cursor.execute(patient_query, (cpf,))
        if not cursor.fetchone():
            return jsonify({'error': 'Paciente não encontrado.'}), 404

        # Insere a nova anotação
        insert_query = """
            INSERT INTO informacao_tratamentos (id_paciente, epoch_criacao, numero_dente, data, anotacao)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (cpf, epoch_criacao, numero_dente, data_tratamento, anotacao))
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
            SET data = %s, numero_dente = %s, anotacao = %s
            WHERE id_paciente = %s AND epoch_criacao = %s
        """
        
        # Verifique se todas as chaves necessárias estão presentes no JSON
        if not all(key in data for key in ['data', 'numero_dente', 'anotacao']):
            return jsonify({'error': 'Faltam campos obrigatórios no corpo da requisição.'}), 400

        cursor.execute(query, (data['data'], data['numero_dente'], data['anotacao'], cpf, annotation_id))
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


if __name__ == '__main__':
    app.run(debug=True)

