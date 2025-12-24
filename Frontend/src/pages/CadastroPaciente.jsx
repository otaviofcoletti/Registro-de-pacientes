import React, { useState } from 'react';
import styles from './CadastroPaciente.module.css';

const API_URL = import.meta.env.VITE_API_URL;



const CadastroPaciente = () => {
    const [form, setForm] = useState({
        cpf: '',
        nome: '',
        telefone: '',
        dataNascimento: '',
        endereco: '',
        convenio: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/pacientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (response.ok) {
                alert('Paciente cadastrado com sucesso!');
                setForm({
                    cpf: '',
                    nome: '',
                    telefone: '',
                    dataNascimento: '',
                    endereco: '',
                    convenio: ''
                });
            } else {
                alert('Erro ao cadastrar paciente.');
            }
        } catch (error) {
            console.error('Erro ao enviar os dados:', error);
        }
    };

    return (
        <div className={styles.cadastro}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.label} htmlFor="cpf">CPF:</label>
                <input
                    className={styles.input}
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={form.cpf}
                    onChange={handleChange}
                    required
                />

                <label className={styles.label} htmlFor="nome">Nome:</label>
                <input
                    className={styles.input}
                    type="text"
                    id="nome"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                />

                <label className={styles.label} htmlFor="telefone">Telefone:</label>
                <input
                    className={styles.input}
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                />

                <label className={styles.label} htmlFor="dataNascimento">Data de Nascimento:</label>
                <input
                    className={styles.input}
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={form.dataNascimento}
                    onChange={handleChange}
                    required
                />

                <label className={styles.label} htmlFor="endereco">Endereço:</label>
                <textarea
                    className={styles.input}
                    id="endereco"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                ></textarea>

                <label className={styles.label} htmlFor="convenio">Convênio:</label>
                <input
                    className={styles.input}
                    type="text"
                    id="convenio"
                    name="convenio"
                    value={form.convenio}
                    onChange={handleChange}
                />

                <button className={styles.button} type="submit">Cadastrar Paciente</button>
            </form>
        </div>
    );
};

export default CadastroPaciente;
