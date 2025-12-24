import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PatientDetails.module.css';
import Paint from '../components/PaintComponent.jsx';

const API_URL = import.meta.env.VITE_API_URL;


export function PatientDetails() {
  const { cpf } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    tooth: '',
    face: 'Não se aplica',
    note: '',
    epoch: Date.now(),
  });
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

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
          console.error('Erro ao buscar detalhes do paciente.');
        }
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientDetails();
    fetchImages();
  }, [cpf]);
  
  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_URL}/get_images?cpf=${cpf}`);
      if (response.ok) {
        const data = await response.json();
        const imagesList = data.images || [];
        
        // Ordena as imagens das mais recentes para as mais antigas
        // Usa timestamp_iso se disponível, senão usa o timestamp formatado
        const sortedImages = imagesList.sort((a, b) => {
          try {
            if (a.timestamp_iso && b.timestamp_iso) {
              // Converte timestamp ISO para Date para ordenar
              const dateA = parseTimestampISO(a.timestamp_iso);
              const dateB = parseTimestampISO(b.timestamp_iso);
              return dateB - dateA; // Ordem decrescente (mais recente primeiro)
            } else {
              // Fallback: usa timestamp formatado
              const dateA = parseTimestamp(a.timestamp);
              const dateB = parseTimestamp(b.timestamp);
              return dateB - dateA;
            }
          } catch (e) {
            // Se não conseguir parsear, mantém a ordem original
            return 0;
          }
        });
        
        setImages(sortedImages);
      }
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
    }
  };
  
  // Função auxiliar para parsear timestamp ISO (ex: "2025-12-24T15-11-48.329Z")
  const parseTimestampISO = (timestampISO) => {
    if (!timestampISO) return new Date(0);
    try {
      // Converte "2025-12-24T15-11-48.329Z" para formato ISO válido
      // Separa data e tempo
      const parts = timestampISO.split('T');
      if (parts.length !== 2) return new Date(0);
      
      const [datePart, timePart] = parts;
      
      // Substitui os dois primeiros hífens do tempo por dois pontos
      // Usa split e join para substituir apenas os dois primeiros
      const timeParts = timePart.split('-');
      if (timeParts.length >= 3) {
        const hour = timeParts[0];
        const minute = timeParts[1];
        const rest = timeParts.slice(2).join('-');
        const timeFixed = `${hour}:${minute}:${rest}`;
        
        // Monta o timestamp ISO válido
        const isoString = `${datePart}T${timeFixed}`;
        
        // Converte 'Z' para '+00:00' para compatibilidade com Date
        const isoFinal = isoString.endsWith('Z') 
          ? isoString.replace('Z', '+00:00') 
          : isoString + '+00:00';
        
        return new Date(isoFinal);
      }
      return new Date(0);
    } catch (e) {
      console.error('Erro ao parsear timestamp ISO:', e);
      return new Date(0);
    }
  };
  
  // Função auxiliar para parsear timestamp no formato dd/mm/yyyy HH:MM:SS
  const parseTimestamp = (timestampStr) => {
    if (!timestampStr) return new Date(0);
    
    // Formato esperado: "dd/mm/yyyy HH:MM:SS"
    const parts = timestampStr.split(' ');
    if (parts.length !== 2) return new Date(0);
    
    const [datePart, timePart] = parts;
    const [day, month, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    return new Date(year, month - 1, day, hour, minute, second);
  };

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
          face: 'Não se aplica',
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
    if (!annotation.date || (annotation.tooth !== 'boca_inteira' && !annotation.tooth) || !annotation.note || !annotation.epoch) {
      console.error('Campos obrigatórios estão faltando na anotação.');
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/paciente/${cpf}/anotacoes/${annotation.epoch}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: annotation.date,         // Garantir que o nome do campo é "data" no back-end
          numero_dente: annotation.tooth, // Alterar para o campo correto no banco de dados
          face_dente: annotation.face || 'Não se aplica', // Adicionar face do dente
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

  const handleDeleteImage = async (imageIndex) => {
    const image = images[imageIndex];
    
    // Confirmação antes de deletar
    const confirmed = window.confirm('Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.');
    
    if (!confirmed) {
      return;
    }
    
    try {
      const response = await fetch(
        `${API_URL}/delete_image?cpf=${cpf}&timestamp_iso=${encodeURIComponent(image.timestamp_iso)}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        // Remove a imagem do estado local
        setImages((prev) => prev.filter((_, i) => i !== imageIndex));
        
        // Se a imagem deletada era a selecionada, ajusta o índice
        if (selectedImageIndex === imageIndex) {
          if (images.length > 1) {
            // Se havia mais imagens, seleciona a próxima ou anterior
            const newIndex = imageIndex < images.length - 1 ? imageIndex : imageIndex - 1;
            setSelectedImageIndex(newIndex >= 0 ? newIndex : null);
          } else {
            setSelectedImageIndex(null);
          }
        } else if (selectedImageIndex > imageIndex) {
          // Se a imagem deletada estava antes da selecionada, ajusta o índice
          setSelectedImageIndex(selectedImageIndex - 1);
        }
        
        // Recarrega as imagens do backend para garantir sincronização
        fetchImages();
        console.log('Imagem deletada com sucesso.');
      } else {
        const errorData = await response.json();
        alert(`Erro ao deletar imagem: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao enviar requisição de exclusão:', error);
      alert('Erro ao deletar imagem. Tente novamente.');
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
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button className={styles.backButton} onClick={() => navigate(`/editar-paciente/${cpf}`)}>Editar Ficha</button>
        <button className={styles.backButton} onClick={() => navigate(`/pagamentos/${cpf}`)}>
          Ver Orçamentos e Pagamentos
        </button>
      </div>
      <Paint cpf={cpf} selectedImageIndex={selectedImageIndex} onImagesChange={fetchImages}/>
      
      {/* Galeria de Imagens */}
      {images.length > 0 && (
        <div className={styles.imageGallery}>
          <div 
            className={styles.galleryHeader}
            onClick={() => setGalleryExpanded(!galleryExpanded)}
          >
            <h2 className={styles.subtitle}>Galeria de Imagens ({images.length})</h2>
            <span className={`${styles.expandIcon} ${galleryExpanded ? styles.expanded : ''}`}>
              ▼
            </span>
          </div>
          {galleryExpanded && (
            <div className={styles.galleryGrid}>
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`${styles.galleryItem} ${selectedImageIndex === index ? styles.selected : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <button
                    className={styles.deleteImageButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(index);
                    }}
                    title="Excluir imagem"
                  >
                    ×
                  </button>
                  <img src={img.image} alt={`Imagem ${index + 1}`} />
                  <div className={styles.galleryTimestamp}>{img.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className={styles.annotations}>
        <h2 className={styles.subtitle}>Anotações Dentárias</h2>
        <table className={styles.annotationTable}>
          <thead>
            <tr className={styles.tableHeader}>
              <th>Data</th>
              <th>Dente</th>
              <th>Face</th>
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
                  <option value="boca_inteira">Boca inteira</option>
                  {Array.from({ length: 32 }, (_, i) => (
                    <option key={i} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </td>
              <td>
                <select name="face" value={form.face} onChange={handleInputChange}>
                  <option value="Não se aplica">Não se aplica</option>
                  <option value="Vestibular">Vestibular</option>
                  <option value="Lingual">Lingual</option>
                  <option value="Mesial">Mesial</option>
                  <option value="Distal">Distal</option>
                  <option value="Oclusal">Oclusal</option>
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
                      <option value="boca_inteira">Boca inteira</option>
                      {Array.from({ length: 32 }, (_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  ) : (
                    a.tooth === 'boca_inteira' ? 'Boca inteira' : a.tooth
                  )}
                </td>
                <td>
                  {a.isEditing ? (
                    <select
                      value={a.face || 'Não se aplica'}
                      onChange={(e) => handleAnnotationChange(idx, 'face', e.target.value)}
                    >
                      <option value="Não se aplica">Não se aplica</option>
                      <option value="Vestibular">Vestibular</option>
                      <option value="Lingual">Lingual</option>
                      <option value="Mesial">Mesial</option>
                      <option value="Distal">Distal</option>
                      <option value="Oclusal">Oclusal</option>
                    </select>
                  ) : (
                    a.face || 'Não se aplica'
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
      <button className={styles.backButton} onClick={() => navigate('/pacientes')}>Voltar para Lista</button>
    </div>
  );
}

export default PatientDetails;
