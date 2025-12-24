import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PatientDetails.module.css';
import Paint from '../components/PaintComponent.jsx'; // ajuste o caminho conforme necessário

const API_URL = import.meta.env.VITE_API_URL;

export function PatientDetails() {
  const { cpf } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    tooth: '',
    note: '',
    epoch: Date.now(),
  });
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch patient details
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/paciente/${cpf}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
          setAnnotations(data.treatments);
        } else {
          const errorData = await response.json();
          console.error('Erro ao buscar detalhes do paciente:', errorData.error || 'Erro desconhecido');
          if (response.status === 404) {
            alert('Paciente não encontrado.');
            navigate('/pacientes');
          }
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao buscar detalhes do paciente. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientDetails();
  }, [cpf, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAnnotation = async () => {
    if (!form.tooth || !form.note) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/paciente/${cpf}/anotacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setAnnotations((prev) => [{ ...form, note: form.note }, ...prev]);
        setForm({
          date: new Date().toISOString().split('T')[0],
          tooth: '',
          note: '',
          epoch: Date.now(),
        });
      } else {
        console.error('Erro ao adicionar anotação.');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEditAnnotation = (index) => {
    setAnnotations((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, isEditing: !a.isEditing } : a
      )
    );
  };
  
  const handleSaveAnnotation = async (index) => {
    const annotation = annotations[index];
    console.log('Salvando anotação:', annotation);
    // Validar os campos necessários antes de enviar a requisição
    if (!annotation.date || !annotation.tooth || !annotation.note || !annotation.epoch) {
      console.error('Campos obrigatórios estão faltando na anotação.');
      return;
    }
  
    try {
      const response = await fetch(`http://127.0.0.1:5000/paciente/${cpf}/anotacoes/${annotation.epoch}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: annotation.date,         // Garantir que o nome do campo é "data" no back-end
          numero_dente: annotation.tooth, // Alterar para o campo correto no banco de dados
          anotacao: annotation.note,     // Alterar para o campo correto no banco de dados
        }),
      });
  
      if (response.ok) {
        // Atualizar o estado das anotações após salvar com sucesso
        setAnnotations((prev) =>
          prev.map((a, i) =>
            i === index ? { ...a, isEditing: false } : a
          )
        );
        console.log('Anotação salva com sucesso.');
      } else {
        console.error('Erro ao salvar anotação. Status:', response.status);
      }
    } catch (error) {
      console.error('Erro ao enviar requisição:', error);
    }
  };
  
  
  const handleAnnotationChange = (index, field, value) => {
    setAnnotations((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      )
    );
  };

  const handleDeleteAnnotation = async (index) => {
    const annotation = annotations[index];
  
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/paciente/${cpf}/anotacoes/${annotation.epoch}`,
        { method: 'DELETE' }
      );
  
      if (response.ok) {
        // Remove a anotação do estado local
        setAnnotations((prev) => prev.filter((_, i) => i !== index));
        console.log('Anotação deletada com sucesso.');
      } else {
        console.error('Erro ao deletar anotação. Status:', response.status);
      }
    } catch (error) {
      console.error('Erro ao enviar requisição de exclusão:', error);
    }
  };

  const handleDeletePatient = async () => {
    try {
      const response = await fetch(`${API_URL}/pacientes/${cpf}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Redireciona para a lista de pacientes após exclusão bem-sucedida
        navigate('/pacientes');
      } else {
        const errorData = await response.json();
        alert(`Erro ao excluir paciente: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      alert('Erro ao excluir paciente. Tente novamente.');
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
      <button className={styles.backButton} onClick={() => navigate(`/editar-paciente/${cpf}`)}>Editar Ficha</button>
      <button className={styles.backButton} onClick={() => navigate(`/pagamentos/${cpf}`)} style={{ marginLeft: '1rem' }}>
        Ver Orçamentos e Pagamentos
      </button>
      <Paint cpf={cpf}/>
      <div className={styles.annotations}>
        <h2 className={styles.subtitle}>Anotações Dentárias</h2>
        <table className={styles.annotationTable}>
          <thead>
            <tr className={styles.tableHeader}>
              <th>Data</th>
              <th>Dente</th>
              <th>Observação</th>
              <th>Ação</th>
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
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleInputChange}
                  placeholder="Adicionar observação..."
                />
              </td>
              <td>
                <button className={styles.addButton} onClick={handleAddAnnotation}>
                  Adicionar
                </button>
              </td>
            </tr>
            {annotations.map((a, idx) => (
              <tr key={idx} className={styles.annotationRow}>
                <td>
                  {a.isEditing ? (
                    <input
                      type="date"
                      value={a.date}
                      onChange={(e) => handleAnnotationChange(idx, 'date', e.target.value)}
                    />
                  ) : (
                    formatDate(a.date)
                  )}
                </td>
                <td>
                  {a.isEditing ? (
                    <select
                      value={a.tooth}
                      onChange={(e) => handleAnnotationChange(idx, 'tooth', e.target.value)}
                    >
                      <option value="">Selecione o dente</option>
                      {Array.from({ length: 32 }, (_, i) => (
                        <option key={i} value={i + 1}>Dente {i + 1}</option>
                      ))}
                    </select>
                  ) : (
                    a.tooth
                  )}
                </td>
                <td>
                  {a.isEditing ? (
                    <textarea
                      value={a.note}
                      onChange={(e) => handleAnnotationChange(idx, 'note', e.target.value)}
                    />
                  ) : (
                    a.note
                  )}
                </td>
                <td>
                  {a.isEditing ? (
                    <button
                      className={styles.addButton}
                      onClick={() => handleSaveAnnotation(idx)}
                    >
                      Salvar
                    </button>
                  ) : (
                    <>
                      <button
                        className={styles.addButton}
                        onClick={() => handleEditAnnotation(idx)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.addButton}
                        onClick={() => handleDeleteAnnotation(idx)}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.buttonContainer}>
        <button className={styles.deleteButton} onClick={() => setShowDeleteDialog(true)}>
          Excluir Ficha
        </button>
        <button className={styles.backButton} onClick={() => navigate('/pacientes')}>Voltar para Lista</button>
      </div>
      
      {/* Diálogo de confirmação de exclusão */}
      {showDeleteDialog && (
        <div className={styles.dialogOverlay} onClick={() => setShowDeleteDialog(false)}>
          <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.dialogTitle}>Confirmar Exclusão</h2>
            <p className={styles.dialogMessage}>
              Tem certeza que deseja excluir a ficha do paciente <strong>{patient?.name}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </p>
            <div className={styles.dialogButtons}>
              <button 
                className={styles.dialogCancelButton} 
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancelar
              </button>
              <button 
                className={styles.dialogConfirmButton} 
                onClick={() => {
                  setShowDeleteDialog(false);
                  handleDeletePatient();
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDetails;
