import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PatientList.module.css';

export function PatientList() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const navigate = useNavigate();

  // Fetch patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/pacientes');
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
          setFilteredPatients(data);
        } else {
          console.error('Failed to fetch patients');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchPatients();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);

    const suggestions = patients.filter((patient) =>
      patient.nome.toLowerCase().includes(value)
    );
    setFilteredPatients(suggestions);
  };

  const handlePatientClick = (cpf) => {
    navigate(`/ficha/${cpf}`); // Redireciona para a página da ficha do paciente
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
            key={patient.cpf}
            className={styles.listItem}
            onClick={() => handlePatientClick(patient.cpf)}
          >
            <span className={styles.name}>{patient.nome}</span>
            <span className={styles.phone}>{patient.telefone}</span>
          </li>
        ))}
      </ul>
    </div>

  );
}

export default PatientList;
