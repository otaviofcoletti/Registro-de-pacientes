import React from 'react';
import styles from './CadastroPaciente.module.css';

const CadastroPaciente = () => {
    return (
        <div className={styles.cadastro}>
            <div className={styles.form}>
                <label className={styles.label} htmlFor="nome">Nome:</label>
                <input className={styles.input} type="text" id="nome" name="nome" required />

                <label className={styles.label} htmlFor="idade">Idade:</label>
                <input className={styles.input} type="number" id="idade" name="idade" required />

                <label className={styles.label} htmlFor="email">E-mail:</label>
                <input className={styles.input} type="email" id="email" name="email" required />

                <label className={styles.label} htmlFor="telefone">Telefone:</label>
                <input className={styles.input} type="tel" id="telefone" name="telefone" required />

                <button className={styles.button} type="submit">Cadastrar Paciente</button>
            </div>
        </div>
    );
};

export default CadastroPaciente;
