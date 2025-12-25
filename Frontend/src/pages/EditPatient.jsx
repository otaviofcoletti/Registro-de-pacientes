import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './CadastroPaciente.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EditPatient = () => {
    const { cpf } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [form, setForm] = useState({
        cpf: '',
        nome: '',
        telefone: '',
        dataNascimento: '',
        endereco: '',
        convenio: ''
    });

    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                const response = await fetch(`${API_URL}/paciente/${cpf}`);
                if (response.ok) {
                    const data = await response.json();
                    setPatient(data);
                    setForm({
                        cpf: data.cpf,
                        nome: data.name,
                        telefone: data.phone,
                        dataNascimento: new Date(data.birthdate).toISOString().split('T')[0] ,
                        endereco: data.address,
                        convenio: data.convenio
                    });
                } else {
                    console.error('Erro ao buscar os dados do paciente.');
                }
            } catch (error) {
                console.error('Erro:', error);
            }
        };

        fetchPatientDetails();
    }, [cpf]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`http://localhost:5000/pacientes/${cpf}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (response.ok) {
                alert('Dados atualizados com sucesso!');
                navigate(`/ficha/${cpf}`);
            } else {
                alert('Erro ao atualizar dados.');
            }
        } catch (error) {
            console.error('Erro ao enviar os dados:', error);
        }
    };

    if (!patient) return <p>Carregando...</p>;

    return (
        <div className={styles.cadastro}>
            <h1 className={styles.title}>Editar Dados do Paciente</h1>
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
                    disabled
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

                <button className={styles.button} type="submit">Salvar Alterações</button>
            </form>
        </div>
    );
};

export default EditPatient;
