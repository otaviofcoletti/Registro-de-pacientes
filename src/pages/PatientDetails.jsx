import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PatientDetails.module.css';

const patients = [
  { id: 1, name: 'Ana Silva', phone: '(11) 1234-5678', age: 29, address: 'Rua A, 123', notes: 'Paciente com histórico de alergias.' },
  { id: 2, name: 'Carlos Oliveira', phone: '(21) 8765-4321', age: 34, address: 'Avenida B, 456', notes: 'Consulta de rotina.' },
  { id: 3, name: 'Maria Santos', phone: '(31) 9999-8888', age: 42, address: 'Praça C, 789', notes: 'Tratamento dentário em andamento.' },
];

const toothOptions = Array.from({ length: 32 }, (_, i) => `Dente ${i + 1}`); // Gera uma lista de dentes de 1 a 32

export function PatientDetails() {
  const { id } = useParams(); // Obtém o ID do paciente da URL
  const navigate = useNavigate();
  const patient = patients.find((p) => p.id === parseInt(id));

  const [annotations, setAnnotations] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], // Data no formato YYYY-MM-DD
    tooth: '',
    observation: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  if (!patient) {
    return <p>Paciente não encontrado.</p>;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAnnotation = () => {
    if (!form.tooth || !form.observation) {
      alert('Por favor, preencha todos os campos antes de adicionar uma anotação.');
      return;
    }

    setAnnotations((prev) => [
      { ...form, id: Date.now() }, // Adiciona a anotação no topo
      ...prev,
    ]);

    // Reseta o formulário
    setForm({
      date: new Date().toISOString().split('T')[0],
      tooth: '',
      observation: '',
    });

    setIsEditing(false);
  };

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

      <div className={styles.annotations}>
        <h2 className={styles.subtitle}>Anotações Dentárias</h2>

        <table className={styles.annotationTable}>
          <thead>
            <tr className={styles.tableHeader}>
              <th>Data</th>
              <th>Dente</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.newAnnotationRow}>
              <td>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleInputChange}
                  disabled={isEditing}
                />
              </td>
              <td>
                <select
                  name="tooth"
                  value={form.tooth}
                  onChange={handleInputChange}
                  disabled={isEditing}
                >
                  <option value="">Selecione o dente</option>
                  {toothOptions.map((tooth) => (
                    <option key={tooth} value={tooth}>{tooth}</option>
                  ))}
                </select>
              </td>
              <td>
                <div className={styles.addObservationField}>
                  <textarea
                    name="observation"
                    value={form.observation}
                    onChange={handleInputChange}
                    disabled={isEditing}
                    placeholder="Adicionar observação..."
                  ></textarea>
                  <button onClick={handleAddAnnotation} className={styles.addButton}>
                    +
                  </button>
                </div>
              </td>
            </tr>
            {annotations.map((annotation) => (
              <tr key={annotation.id} className={styles.annotationRow}>
                <td>{annotation.date}</td>
                <td>{annotation.tooth}</td>
                <td>{annotation.observation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className={styles.backButton} onClick={() => navigate('/pacientes')}>
        Voltar para lista
      </button>
    </div>
  );
}

export default PatientDetails;
