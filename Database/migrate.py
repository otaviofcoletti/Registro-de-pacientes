#!/usr/bin/env python3
"""
Script de migração para adicionar a coluna preco e tabela pagamentos
Execute este script para atualizar o banco de dados existente
"""

import psycopg2
import sys

# Configuração do banco de dados
DB_CONFIG = {
    'dbname': 'clinica',
    'user': 'admin',
    'password': 'admin123',
    'host': 'localhost',
    'port': 5432
}

def run_migration():
    try:
        print("Conectando ao banco de dados...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("Verificando se a coluna 'preco' existe...")
        # Verifica se a coluna preco existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'informacao_tratamentos' 
            AND column_name = 'preco'
        """)
        
        if cursor.fetchone() is None:
            print("Adicionando coluna 'preco' na tabela informacao_tratamentos...")
            cursor.execute("ALTER TABLE informacao_tratamentos ADD COLUMN preco DECIMAL(10, 2)")
            print("✓ Coluna 'preco' adicionada com sucesso!")
        else:
            print("✓ Coluna 'preco' já existe.")
        
        print("Verificando se a tabela 'pagamentos' existe...")
        # Verifica se a tabela pagamentos existe
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'pagamentos'
        """)
        
        if cursor.fetchone() is None:
            print("Criando tabela 'pagamentos'...")
            cursor.execute("""
                CREATE TABLE pagamentos (
                    id SERIAL PRIMARY KEY,
                    id_paciente VARCHAR(11) NOT NULL,
                    epoch_tratamento BIGINT NOT NULL,
                    data_pagamento DATE NOT NULL,
                    valor_parcela DECIMAL(10, 2) NOT NULL,
                    meio_pagamento TEXT,
                    FOREIGN KEY (id_paciente, epoch_tratamento) 
                    REFERENCES informacao_tratamentos (id_paciente, epoch_criacao) 
                    ON DELETE CASCADE
                )
            """)
            print("✓ Tabela 'pagamentos' criada com sucesso!")
        else:
            print("✓ Tabela 'pagamentos' já existe.")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n✅ Migração concluída com sucesso!")
        return True
        
    except psycopg2.Error as e:
        print(f"\n❌ Erro ao executar migração: {e}")
        if conn:
            conn.rollback()
        return False
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        return False

if __name__ == '__main__':
    print("=" * 50)
    print("Script de Migração do Banco de Dados")
    print("=" * 50)
    print()
    
    success = run_migration()
    
    if not success:
        sys.exit(1)

