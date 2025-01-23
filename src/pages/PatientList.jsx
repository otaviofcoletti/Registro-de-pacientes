import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PatientList.module.css';

// Exemplo de pacientes cadastrados
const patients = [
  { id: 1, name: 'Ana Silva', phone: '(11) 1234-5678', age: 29, address: 'Rua A, 123', notes: 'Paciente com histórico de alergias.' },
  { id: 2, name: 'Carlos Oliveira', phone: '(21) 8765-4321', age: 34, address: 'Avenida B, 456', notes: 'Consulta de rotina.' },
  { id: 3, name: 'Maria Santos', phone: '(31) 9999-8888', age: 42, address: 'Praça C, 789', notes: 'Tratamento dentário em andamento.' },
];

export function PatientList() {
  const [search, setSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState(patients);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);

    const suggestions = patients.filter((patient) =>
      patient.name.toLowerCase().includes(value)
    );
    setFilteredPatients(suggestions);
  };

  const handlePatientClick = (id) => {
    navigate(`/ficha/${id}`); // Redireciona para a página da ficha do paciente
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lista de Pacientes</h1>
      <input
        type="text"
        placeholder="Buscar paciente..."
        value={search}
        onChange={handleSearch}
        className={styles.searchBar}
      />
      <ul className={styles.list}>
        {filteredPatients.map((patient) => (
          <li
            key={patient.id}
            className={styles.listItem}
            onClick={() => handlePatientClick(patient.id)}
          >
            <span className={styles.name}>{patient.name}</span>
            <span className={styles.phone}>{patient.phone}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PatientList;
