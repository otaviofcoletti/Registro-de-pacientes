import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PatientDetails.module.css';

export function PatientDetails() {
  const { cpf } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    tooth: '',
    observation: '',
  });
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch patient details
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/paciente/${cpf}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
          setAnnotations(data.treatments);
        } else {
          console.error('Erro ao buscar detalhes do paciente.');
        }
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientDetails();
  }, [cpf]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAnnotation = async () => {
    if (!form.tooth || !form.observation) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:5000/paciente/${cpf}/anotacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setAnnotations((prev) => [{ ...form, note: form.observation }, ...prev]);
        setForm({
          date: new Date().toISOString().split('T')[0],
          tooth: '',
          observation: '',
        });
      } else {
        console.error('Erro ao adicionar anotação.');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  if (loading) return <p>Carregando...</p>;
  if (!patient) return <p>Paciente não encontrado.</p>;

  // Function to format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const isoString = date.toISOString().split('T')[0]; // "2002-12-18"
    const [year, month, day] = isoString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ficha do Paciente</h1>
      <div className={styles.info}>
        <p><strong>Nome:</strong> {patient.name}</p>
        <p><strong>Telefone:</strong> {patient.phone}</p>
        <p><strong>Data de Nascimento:</strong> {formatDate(patient.birthdate)}</p>
        <p><strong>Endereço:</strong> {patient.address}</p>
        <p><strong>Convênio:</strong> {patient.convenio}</p>
      </div>
      <button className={styles.editButton} onClick={() => navigate(`/editar-paciente/${cpf}`)}>Editar Ficha</button>

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
                />
              </td>
              <td>
                <select name="tooth" value={form.tooth} onChange={handleInputChange}>
                  <option value="">Selecione o dente</option>
                  {Array.from({ length: 32 }, (_, i) => (
                    <option key={i} value={i + 1}>Dente {i + 1}</option>
                  ))}
                </select>
              </td>
              <td>
                <div className={styles.addObservationField}>
                  <textarea
                    name="observation"
                    value={form.observation}
                    onChange={handleInputChange}
                    placeholder="Adicionar observação..."
                  />
                  <button className={styles.addButton} onClick={handleAddAnnotation}>+</button>
                </div>
              </td>
            </tr>
            {annotations.map((a, idx) => (
              <tr key={idx} className={styles.annotationRow}>
                <td>{formatDate(a.date)}</td>
                <td>{a.tooth}</td>
                <td>{a.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className={styles.backButton} onClick={() => navigate('/pacientes')}>Voltar para Lista</button>
    </div>
  );
}

export default PatientDetails;
