import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PatientList.module.css';
const API_URL = import.meta.env.VITE_API_URL;

// Função para remover acentos e normalizar texto
const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

export function PatientList() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const navigate = useNavigate();

  // Fetch patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(`${API_URL}/pacientes`);
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
    const value = e.target.value;
    setSearch(value);

    // Verifica se o valor contém apenas números (busca por CPF)
    const isNumeric = /^\d+$/.test(value);
    
    let suggestions;
    if (isNumeric && value.length > 0) {
      // Busca por CPF
      suggestions = patients.filter((patient) =>
        patient.cpf.includes(value)
      );
    } else if (value.length > 0) {
      // Busca por nome (case insensitive e sem acentos)
      const searchValue = removeAccents(value);
      suggestions = patients.filter((patient) =>
        removeAccents(patient.nome).includes(searchValue)
      );
    } else {
      // Se estiver vazio, mostra todos os pacientes
      suggestions = patients;
    }
    
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
