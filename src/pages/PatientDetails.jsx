import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PatientDetails.module.css';

const patients = [
  { id: 1, name: 'Ana Silva', phone: '(11) 1234-5678', age: 29, address: 'Rua A, 123', notes: 'Paciente com histórico de alergias.' },
  { id: 2, name: 'Carlos Oliveira', phone: '(21) 8765-4321', age: 34, address: 'Avenida B, 456', notes: 'Consulta de rotina.' },
  { id: 3, name: 'Maria Santos', phone: '(31) 9999-8888', age: 42, address: 'Praça C, 789', notes: 'Tratamento dentário em andamento.' },
];

export function PatientDetails() {
  const { id } = useParams(); // Obtém o ID do paciente da URL
  const navigate = useNavigate();
  const patient = patients.find((p) => p.id === parseInt(id));

  if (!patient) {
    return <p>Paciente não encontrado.</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ficha do Paciente</h1>
      <div className={styles.info}>
        <p><strong>Nome:</strong> {patient.name}</p>
        <p><strong>Telefone:</strong> {patient.phone}</p>
        <p><strong>Idade:</strong> {patient.age}</p>
        <p><strong>Endereço:</strong> {patient.address}</p>
        <p><strong>Notas:</strong> {patient.notes}</p>
      </div>
      <button className={styles.backButton} onClick={() => navigate('/pacientes')}>
        Voltar para lista
      </button>
    </div>
  );
}

export default PatientDetails;
