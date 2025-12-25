import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PatientDetails.module.css';
import Paint from '../components/PaintComponent.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Função para gerar os números dos dentes de um quadrante específico
const getTeethByQuadrant = (quadrant) => {
  const teeth = [];
  switch(quadrant) {
    case 1: // Superior direito: 11-18
      for (let i = 11; i <= 18; i++) {
        teeth.push(i);
      }
      break;
    case 2: // Superior esquerdo: 21-28
      for (let i = 21; i <= 28; i++) {
        teeth.push(i);
      }
      break;
    case 3: // Inferior esquerdo: 31-38
      for (let i = 31; i <= 38; i++) {
        teeth.push(i);
      }
      break;
    case 4: // Inferior direito: 41-48
      for (let i = 41; i <= 48; i++) {
        teeth.push(i);
      }
      break;
    default:
      break;
  }
  return teeth;
};

export function PatientDetails() {
  const { cpf } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    tooth: '',
    face: [],
    note: '',
    epoch: Date.now(),
  });
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [descricoesOrcamentos, setDescricoesOrcamentos] = useState([]);
  const [selectedQuadrant, setSelectedQuadrant] = useState(null);
  const [editingQuadrant, setEditingQuadrant] = useState({});
  const [annotationsExpanded, setAnnotationsExpanded] = useState(false);

  // Função para converter string de face para array
  const parseFaceString = (faceString) => {
    if (!faceString || faceString === 'Não se aplica') return [];
    
    // Mapeamento de valores antigos para novas letras
    const faceMap = {
      'Vestibular': 'V',
      'Mesial': 'M',
      'Distal': 'D',
      'Oclusal': 'O',
      'Lingual': 'P', // Assumindo que Lingual = P (Palatino)
      'V': 'V',
      'M': 'M',
      'D': 'D',
      'O': 'O',
      'P': 'P'
    };
    
    // Se já for array, retorna como está
    if (Array.isArray(faceString)) {
      return faceString;
    }
    
    // Se for uma string separada por vírgula, divide e mapeia
    if (typeof faceString === 'string' && faceString.includes(',')) {
      return faceString.split(',').map(f => {
        const trimmed = f.trim();
        return faceMap[trimmed] || trimmed;
      }).filter(f => f && ['M', 'D', 'O', 'P', 'V'].includes(f));
    }
    
    // Se for uma string única, mapeia e retorna como array
    if (typeof faceString === 'string') {
      const mapped = faceMap[faceString.trim()] || faceString.trim();
      return mapped && ['M', 'D', 'O', 'P', 'V'].includes(mapped) ? [mapped] : [];
    }
    
    return [];
  };

  // Fetch patient details
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/paciente/${cpf}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
          // Converte as faces de string para array
          const annotationsWithFaceArray = (data.treatments || []).map(annotation => ({
            ...annotation,
            face: parseFaceString(annotation.face)
          }));
          setAnnotations(annotationsWithFaceArray);
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
    fetchDescricoesOrcamentos();
  }, [cpf]);
  
  const fetchDescricoesOrcamentos = async () => {
    try {
      const response = await fetch(`${API_URL}/paciente/${cpf}/orcamentos/descricoes`);
      if (response.ok) {
        const data = await response.json();
        setDescricoesOrcamentos(data);
      } else {
        console.error('Erro ao buscar descrições de orçamentos');
      }
    } catch (error) {
      console.error('Erro ao buscar descrições de orçamentos:', error);
    }
  };
  
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
    // Se selecionar "Boca inteira", limpa o quadrante selecionado
    if (name === 'tooth' && value === 'boca_inteira') {
      setSelectedQuadrant(null);
    }
  };

  const handleFaceChange = (faceLetter) => {
    setForm((prev) => {
      const currentFaces = prev.face || [];
      if (currentFaces.includes(faceLetter)) {
        // Remove se já estiver selecionado
        return { ...prev, face: currentFaces.filter(f => f !== faceLetter) };
      } else {
        // Adiciona se não estiver selecionado
        return { ...prev, face: [...currentFaces, faceLetter] };
      }
    });
  };

  const handleAddAnnotation = async () => {
    if (!form.tooth || !form.note) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    try {
      // Converte array de faces para string separada por vírgula
      const faceString = Array.isArray(form.face) && form.face.length > 0 
        ? form.face.join(', ') 
        : 'Não se aplica';
      
      const formData = {
        ...form,
        face: faceString
      };
      
      const response = await fetch(`${API_URL}/paciente/${cpf}/anotacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setAnnotations((prev) => [{ ...form, face: form.face, note: form.note }, ...prev]);
        setForm({
          date: new Date().toISOString().split('T')[0],
          tooth: '',
          face: [],
          note: '',
          epoch: Date.now(),
        });
        setSelectedQuadrant(null);
      } else {
        console.error('Erro ao adicionar anotação.');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEditAnnotation = (index) => {
    setAnnotations((prev) =>
      prev.map((a, i) => {
        if (i === index) {
          const isEditing = !a.isEditing;
          if (isEditing) {
            // Quando entra em modo de edição, detecta o quadrante do dente atual
            const quadrant = getQuadrantFromTooth(a.tooth);
            if (quadrant) {
              setEditingQuadrant((prev) => ({ ...prev, [index]: quadrant }));
            }
          } else {
            // Quando sai do modo de edição, limpa o quadrante
            setEditingQuadrant((prev) => {
              const newState = { ...prev };
              delete newState[index];
              return newState;
            });
          }
          return { ...a, isEditing };
        }
        return a;
      })
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
      // Converte array de faces para string separada por vírgula
      const faceString = Array.isArray(annotation.face) && annotation.face.length > 0 
        ? annotation.face.join(', ') 
        : 'Não se aplica';
      
      const response = await fetch(`${API_URL}/paciente/${cpf}/anotacoes/${annotation.epoch}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: annotation.date,         // Garantir que o nome do campo é "data" no back-end
          numero_dente: annotation.tooth, // Alterar para o campo correto no banco de dados
          face_dente: faceString, // Adicionar face do dente
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
    // Se selecionar "Boca inteira", limpa o quadrante selecionado
    if (field === 'tooth' && value === 'boca_inteira') {
      setEditingQuadrant((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  const handleAnnotationFaceChange = (index, faceLetter) => {
    setAnnotations((prev) =>
      prev.map((a, i) => {
        if (i === index) {
          const currentFaces = a.face || [];
          if (Array.isArray(currentFaces)) {
            if (currentFaces.includes(faceLetter)) {
              // Remove se já estiver selecionado
              return { ...a, face: currentFaces.filter(f => f !== faceLetter) };
            } else {
              // Adiciona se não estiver selecionado
              return { ...a, face: [...currentFaces, faceLetter] };
            }
          } else {
            // Se não for array, converte para array primeiro
            const facesArray = parseFaceString(currentFaces);
            if (facesArray.includes(faceLetter)) {
              return { ...a, face: facesArray.filter(f => f !== faceLetter) };
            } else {
              return { ...a, face: [...facesArray, faceLetter] };
            }
          }
        }
        return a;
      })
    );
  };

  // Função para determinar o quadrante de um dente
  const getQuadrantFromTooth = (tooth) => {
    if (!tooth || tooth === 'boca_inteira') return null;
    const toothNum = parseInt(tooth);
    if (toothNum >= 11 && toothNum <= 18) return 1;
    if (toothNum >= 21 && toothNum <= 28) return 2;
    if (toothNum >= 31 && toothNum <= 38) return 3;
    if (toothNum >= 41 && toothNum <= 48) return 4;
    return null;
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
      <Paint 
        cpf={cpf} 
        selectedImageIndex={selectedImageIndex} 
        onImagesChange={fetchImages}
        imagesCount={images.length}
      />
      
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
                <div className={styles.quadrantSelector}>
                  <div className={styles.quadrantButtons}>
                    <button
                      type="button"
                      className={`${styles.quadrantButton} ${selectedQuadrant === 1 ? styles.quadrantButtonActive : ''}`}
                      onClick={() => {
                        setSelectedQuadrant(1);
                        setForm((prev) => ({ ...prev, tooth: '' }));
                      }}
                    >
                      1
                    </button>
                    <button
                      type="button"
                      className={`${styles.quadrantButton} ${selectedQuadrant === 2 ? styles.quadrantButtonActive : ''}`}
                      onClick={() => {
                        setSelectedQuadrant(2);
                        setForm((prev) => ({ ...prev, tooth: '' }));
                      }}
                    >
                      2
                    </button>
                    <button
                      type="button"
                      className={`${styles.quadrantButton} ${selectedQuadrant === 3 ? styles.quadrantButtonActive : ''}`}
                      onClick={() => {
                        setSelectedQuadrant(3);
                        setForm((prev) => ({ ...prev, tooth: '' }));
                      }}
                    >
                      3
                    </button>
                    <button
                      type="button"
                      className={`${styles.quadrantButton} ${selectedQuadrant === 4 ? styles.quadrantButtonActive : ''}`}
                      onClick={() => {
                        setSelectedQuadrant(4);
                        setForm((prev) => ({ ...prev, tooth: '' }));
                      }}
                    >
                      4
                    </button>
                  </div>
                  <select 
                    name="tooth" 
                    value={form.tooth} 
                    onChange={handleInputChange}
                  >
                    <option value="">Selecione o dente</option>
                    {selectedQuadrant && getTeethByQuadrant(selectedQuadrant).map((toothNum) => (
                      <option key={toothNum} value={toothNum}>{toothNum}</option>
                    ))}
                    <option value="boca_inteira">Boca inteira</option>
                  </select>
                </div>
              </td>
              <td>
                <div className={styles.faceCheckboxes}>
                  <label className={styles.faceCheckbox}>
                    <input
                      type="checkbox"
                      checked={form.face.includes('M')}
                      onChange={() => handleFaceChange('M')}
                    />
                    <span>M</span>
                  </label>
                  <label className={styles.faceCheckbox}>
                    <input
                      type="checkbox"
                      checked={form.face.includes('D')}
                      onChange={() => handleFaceChange('D')}
                    />
                    <span>D</span>
                  </label>
                  <label className={styles.faceCheckbox}>
                    <input
                      type="checkbox"
                      checked={form.face.includes('O')}
                      onChange={() => handleFaceChange('O')}
                    />
                    <span>O</span>
                  </label>
                  <label className={styles.faceCheckbox}>
                    <input
                      type="checkbox"
                      checked={form.face.includes('P')}
                      onChange={() => handleFaceChange('P')}
                    />
                    <span>P</span>
                  </label>
                  <label className={styles.faceCheckbox}>
                    <input
                      type="checkbox"
                      checked={form.face.includes('V')}
                      onChange={() => handleFaceChange('V')}
                    />
                    <span>V</span>
                  </label>
                </div>
              </td>
              <td>
                <div className={styles.descricaoContainer}>
                  {descricoesOrcamentos.length > 0 && (
                    <select
                      className={styles.descricaoSelect}
                      onChange={(e) => {
                        if (e.target.value) {
                          setForm((prev) => ({ ...prev, note: e.target.value }));
                        }
                      }}
                      value=""
                    >
                      <option value="">Selecione uma descrição de orçamento...</option>
                      {descricoesOrcamentos.map((descricao, idx) => (
                        <option key={idx} value={descricao}>
                          {descricao.length > 50 ? `${descricao.substring(0, 50)}...` : descricao}
                        </option>
                      ))}
                    </select>
                  )}
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleInputChange}
                    placeholder="Adicionar observação..."
                  />
                </div>
              </td>
              <td>
                <button className={styles.addButton} onClick={handleAddAnnotation}>
                  Adicionar
                </button>
              </td>
            </tr>
            {(annotationsExpanded ? annotations : annotations.slice(0, 5)).map((a, idx) => (
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
                    <div className={styles.quadrantSelector}>
                      <div className={styles.quadrantButtons}>
                        <button
                          type="button"
                          className={`${styles.quadrantButton} ${editingQuadrant[idx] === 1 ? styles.quadrantButtonActive : ''}`}
                          onClick={() => {
                            setEditingQuadrant((prev) => ({ ...prev, [idx]: 1 }));
                            handleAnnotationChange(idx, 'tooth', '');
                          }}
                        >
                          1
                        </button>
                        <button
                          type="button"
                          className={`${styles.quadrantButton} ${editingQuadrant[idx] === 2 ? styles.quadrantButtonActive : ''}`}
                          onClick={() => {
                            setEditingQuadrant((prev) => ({ ...prev, [idx]: 2 }));
                            handleAnnotationChange(idx, 'tooth', '');
                          }}
                        >
                          2
                        </button>
                        <button
                          type="button"
                          className={`${styles.quadrantButton} ${editingQuadrant[idx] === 3 ? styles.quadrantButtonActive : ''}`}
                          onClick={() => {
                            setEditingQuadrant((prev) => ({ ...prev, [idx]: 3 }));
                            handleAnnotationChange(idx, 'tooth', '');
                          }}
                        >
                          3
                        </button>
                        <button
                          type="button"
                          className={`${styles.quadrantButton} ${editingQuadrant[idx] === 4 ? styles.quadrantButtonActive : ''}`}
                          onClick={() => {
                            setEditingQuadrant((prev) => ({ ...prev, [idx]: 4 }));
                            handleAnnotationChange(idx, 'tooth', '');
                          }}
                        >
                          4
                        </button>
                      </div>
                      <select
                        value={a.tooth}
                        onChange={(e) => handleAnnotationChange(idx, 'tooth', e.target.value)}
                      >
                        <option value="">Selecione o dente</option>
                        {editingQuadrant[idx] && getTeethByQuadrant(editingQuadrant[idx]).map((toothNum) => (
                          <option key={toothNum} value={toothNum}>{toothNum}</option>
                        ))}
                        <option value="boca_inteira">Boca inteira</option>
                      </select>
                    </div>
                  ) : (
                    a.tooth === 'boca_inteira' ? 'Boca inteira' : a.tooth
                  )}
                </td>
                <td>
                  {a.isEditing ? (
                    <div className={styles.faceCheckboxes}>
                      <label className={styles.faceCheckbox}>
                        <input
                          type="checkbox"
                          checked={Array.isArray(a.face) ? a.face.includes('M') : parseFaceString(a.face).includes('M')}
                          onChange={() => handleAnnotationFaceChange(idx, 'M')}
                        />
                        <span>M</span>
                      </label>
                      <label className={styles.faceCheckbox}>
                        <input
                          type="checkbox"
                          checked={Array.isArray(a.face) ? a.face.includes('D') : parseFaceString(a.face).includes('D')}
                          onChange={() => handleAnnotationFaceChange(idx, 'D')}
                        />
                        <span>D</span>
                      </label>
                      <label className={styles.faceCheckbox}>
                        <input
                          type="checkbox"
                          checked={Array.isArray(a.face) ? a.face.includes('O') : parseFaceString(a.face).includes('O')}
                          onChange={() => handleAnnotationFaceChange(idx, 'O')}
                        />
                        <span>O</span>
                      </label>
                      <label className={styles.faceCheckbox}>
                        <input
                          type="checkbox"
                          checked={Array.isArray(a.face) ? a.face.includes('P') : parseFaceString(a.face).includes('P')}
                          onChange={() => handleAnnotationFaceChange(idx, 'P')}
                        />
                        <span>P</span>
                      </label>
                      <label className={styles.faceCheckbox}>
                        <input
                          type="checkbox"
                          checked={Array.isArray(a.face) ? a.face.includes('V') : parseFaceString(a.face).includes('V')}
                          onChange={() => handleAnnotationFaceChange(idx, 'V')}
                        />
                        <span>V</span>
                      </label>
                    </div>
                  ) : (
                    Array.isArray(a.face) && a.face.length > 0 
                      ? a.face.join(', ') 
                      : (typeof a.face === 'string' && a.face !== 'Não se aplica' ? a.face : 'Não se aplica')
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
            {annotations.length > 5 && (
              <tr className={styles.expandRow}>
                <td colSpan="5" className={styles.expandCell}>
                  <button 
                    className={styles.expandButton}
                    onClick={() => setAnnotationsExpanded(!annotationsExpanded)}
                  >
                    {annotationsExpanded ? 'Mostrar menos' : `Ver todas (${annotations.length})`}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className={styles.backButton} onClick={() => navigate('/pacientes')}>Voltar para Lista de Pacientes</button>
        <button className={styles.backButton} onClick={() => navigate(`/pagamentos/${cpf}`)}>
          Ver Orçamentos e Pagamentos
        </button>
      </div>
    </div>
  );
}

export default PatientDetails;
