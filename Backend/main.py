import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

from flask import jsonify
import psycopg2.extras

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


if __name__ == '__main__':
    app.run(debug=True)

