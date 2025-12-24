import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from './PaintComponent.module.css';
const API_URL = import.meta.env.VITE_API_URL;

const Paint = ({ cpf, selectedImageIndex, onImagesChange, imagesCount }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  
  // Estados de desenho e configuração
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState("brush");
  const [xPrevious, setXPrevious] = useState(null);
  const [yPrevious, setYPrevious] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [fillColor, setFillColor] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [backgroundImage, setBackgroundImage] = useState(null);
  
  // Controle de edição: false inicialmente (modo visualização), true para habilitar desenho
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  
  // Imagens salvas e índice da imagem atual
  const [savedImages, setSavedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Rastreia se estamos editando uma imagem existente (timestamp_iso) ou criando uma nova
  const [editingImageTimestamp, setEditingImageTimestamp] = useState(null);
  
  // Pilha de snapshots para undo
  const [undoStack, setUndoStack] = useState([]);
  
  // Estado para controlar se deve carregar a imagem padrão
  const [shouldLoadDefault, setShouldLoadDefault] = useState(false);
  
  // Flag para evitar que o useEffect interfira durante o salvamento
  const isSavingRef = useRef(false);
  
  // Referência para a imagem do odontograma (fundo permanente)
  const odontogramImageRef = useRef(null);
  
  // Referência para a imagem externa carregada
  const externalImageRef = useRef(null);
  // Informações de posicionamento da imagem externa
  const externalImageDrawInfo = useRef(null);
  
  // Função para carregar e desenhar o fundo do odontograma
  const drawOdontogramBackground = (ctx, canvas) => {
    if (!odontogramImageRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        odontogramImageRef.current = img;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => {
        console.error("Erro ao carregar imagem do odontograma");
      };
      img.src = '/icons/odontograma-anatomico-2.jpg';
    } else {
      ctx.drawImage(odontogramImageRef.current, 0, 0, canvas.width, canvas.height);
    }
  };
  
  // Função auxiliar para parsear timestamp ISO
  const parseTimestampISO = (timestampISO) => {
    if (!timestampISO) return new Date(0);
    try {
      const parts = timestampISO.split('T');
      if (parts.length !== 2) return new Date(0);
      
      const [datePart, timePart] = parts;
      const timeParts = timePart.split('-');
      if (timeParts.length >= 3) {
        const hour = timeParts[0];
        const minute = timeParts[1];
        const rest = timeParts.slice(2).join('-');
        const timeFixed = `${hour}:${minute}:${rest}`;
        const isoString = `${datePart}T${timeFixed}`;
        const isoFinal = isoString.endsWith('Z') 
          ? isoString.replace('Z', '+00:00') 
          : isoString + '+00:00';
        return new Date(isoFinal);
      }
      return new Date(0);
    } catch (e) {
      return new Date(0);
    }
  };
  
  // Função para ordenar imagens das mais recentes para as mais antigas
  const sortImagesByDate = (imagesList) => {
    return [...imagesList].sort((a, b) => {
      try {
        if (a.timestamp_iso && b.timestamp_iso) {
          const dateA = parseTimestampISO(a.timestamp_iso);
          const dateB = parseTimestampISO(b.timestamp_iso);
          return dateB - dateA; // Ordem decrescente (mais recente primeiro)
        }
        return 0;
      } catch (e) {
        return 0;
      }
    });
  };
  
  // Função para carregar imagens do backend
  const loadImages = useCallback(() => {
    if (cpf) {
      // Recupera imagens do backend
      fetch(`${API_URL}/get_images?cpf=${cpf}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.images && data.images.length > 0) {
            // Ordena as imagens das mais recentes para as mais antigas
            const sortedImages = sortImagesByDate(data.images);
            setSavedImages(prevImages => {
              // Ajusta o índice atual se necessário
              setCurrentImageIndex(prevIndex => {
                if (prevIndex >= sortedImages.length) {
                  // Se o índice atual é maior que o número de imagens, ajusta para a última
                  return Math.max(0, sortedImages.length - 1);
                } else if (prevIndex < 0 && sortedImages.length > 0) {
                  // Se o índice é inválido mas há imagens, define para a primeira
                  return 0;
                }
                return prevIndex;
              });
              return sortedImages;
            });
            
            setShouldLoadDefault(false);
            
            // Atualiza o localStorage também
            localStorage.setItem(`paint_${cpf}`, JSON.stringify(sortedImages));
          } else {
            // Se não houver imagens, marca para carregar a imagem padrão
            setShouldLoadDefault(true);
            setCurrentImageIndex(0);
            setSavedImages([]);
          }
        })
        .catch(err => {
          console.error("Erro ao carregar imagens do backend:", err);
          // Em caso de erro, marca para carregar a imagem padrão
          setShouldLoadDefault(true);
        });
    }
  }, [cpf]);

  // Carrega imagens quando o cpf muda
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Recarrega imagens quando o número de imagens na galeria muda (indica que houve deleção)
  useEffect(() => {
    if (imagesCount !== undefined && imagesCount !== savedImages.length) {
      loadImages();
    }
  }, [imagesCount, savedImages.length, loadImages]);
  
  // Configura os botões de ferramentas
  useEffect(() => {
    const toolBtns = document.querySelectorAll(`.${styles.tool}`);
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelector(`.${styles.tool}.${styles.active}`).classList.remove(styles.active);
        btn.classList.add(styles.active);
        setSelectedTool(btn.id);
      });
    });
    return () => {
      toolBtns.forEach(btn => {
        btn.removeEventListener('click', () => {});
      });
    };
  }, []);
  
  // Configura os botões de cor
  useEffect(() => {
    const colorBtns = document.querySelectorAll(`.${styles.colors} .${styles.option}`);
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelector(`.${styles.option}.${styles.selected}`).classList.remove(styles.selected);
        btn.classList.add(styles.selected);
        setColor(window.getComputedStyle(btn).getPropertyValue('background-color'));
      });
    });
    return () => {
      colorBtns.forEach(btn => {
        btn.removeEventListener('click', () => {});
      });
    };
  }, []);
  
  // Configuração inicial do canvas (usa dimensões definidas no CSS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctxRef.current = ctx;
    
    // Se houver background, desenha-o
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = backgroundImage;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    } else if (shouldLoadDefault && savedImages.length === 0) {
      // Se não houver imagens salvas e deve carregar padrão, carrega a imagem padrão
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setBackgroundImage('/icons/odontograma-anatomico-2.jpg');
      };
      img.onerror = () => {
        console.error("Erro ao carregar imagem padrão do odontograma");
      };
      img.src = '/icons/odontograma-anatomico-2.jpg';
    }
  }, [backgroundImage, shouldLoadDefault, savedImages.length]);
  
  // Atualiza propriedades do contexto quando a cor ou a espessura mudam
  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.lineWidth = lineWidth;
      ctxRef.current.strokeStyle = color;
      ctxRef.current.fillStyle = color;
    }
  }, [color, lineWidth]);
  
  // Quando não estiver em modo edição, exibe a imagem salva atual ou a imagem padrão
  // Mas não interfere durante o salvamento
  useEffect(() => {
    if (!drawingEnabled && !isSavingRef.current) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      
      if (savedImages.length > 0 && currentImageIndex >= 0) {
        // Exibe a imagem salva selecionada
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = savedImages[currentImageIndex].image;
        img.onload = () => {
          // Só atualiza se não estiver salvando
          if (!isSavingRef.current) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Desenha a imagem salva diretamente (ela já contém tudo)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        };
      } else if (savedImages.length === 0) {
        // Se não houver imagens salvas, exibe apenas o odontograma
        if (!isSavingRef.current) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawOdontogramBackground(ctx, canvas);
        }
      }
    }
  }, [drawingEnabled, savedImages, currentImageIndex, backgroundImage]);
  
  // Atualiza currentImageIndex quando selectedImageIndex muda externamente
  useEffect(() => {
    if (selectedImageIndex !== undefined && selectedImageIndex !== null && savedImages.length > 0) {
      if (selectedImageIndex >= 0 && selectedImageIndex < savedImages.length) {
        setCurrentImageIndex(selectedImageIndex);
        setDrawingEnabled(false); // Desabilita edição ao selecionar imagem externamente
        setEditingImageTimestamp(null); // Limpa o estado de edição ao mudar de imagem
      }
    }
  }, [selectedImageIndex, savedImages.length]);
  
  
  // Função para carregar imagem externa e abrir em modo de edição
  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        
        // Carrega a imagem no canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = ctxRef.current;
          if (canvas && ctx) {
            // Salva a referência da imagem externa
            externalImageRef.current = img;
            
            // Limpa o canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Desenha fundo branco
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Desenha a imagem carregada por cima
            // Calcula as dimensões para manter a proporção e centralizar
            const imgAspect = img.width / img.height;
            const canvasAspect = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (imgAspect > canvasAspect) {
              // Imagem é mais larga - ajusta pela largura
              drawWidth = canvas.width;
              drawHeight = canvas.width / imgAspect;
              drawX = 0;
              drawY = (canvas.height - drawHeight) / 2;
            } else {
              // Imagem é mais alta - ajusta pela altura
              drawHeight = canvas.height;
              drawWidth = canvas.height * imgAspect;
              drawX = (canvas.width - drawWidth) / 2;
              drawY = 0;
            }
            
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            
            // Salva as informações de posicionamento para usar na borracha
            externalImageDrawInfo.current = { drawX, drawY, drawWidth, drawHeight };
            
            // Captura snapshot como base da undoStack
            const baseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setUndoStack([baseSnapshot]);
            
            // Limpa o estado de edição para que salve como nova imagem
            setEditingImageTimestamp(null);
            
            // Habilita o modo de edição automaticamente
            setDrawingEnabled(true);
          }
        };
        img.onerror = () => {
          alert('Erro ao carregar a imagem. Por favor, tente novamente.');
        };
        img.src = imageData;
      };
      reader.onerror = () => {
        alert('Erro ao ler o arquivo. Por favor, tente novamente.');
      };
      reader.readAsDataURL(file);
      
      // Limpa o input para permitir carregar o mesmo arquivo novamente
      e.target.value = '';
    }
  };
  
  const handleFillChange = (e) => setFillColor(e.target.checked);
  
  // Funções para desenhar formas
  const drawRectangle = (e) => {
    if (!ctxRef.current) return;
    const x = xPrevious, y = yPrevious;
    const width = e.nativeEvent.offsetX - x;
    const height = e.nativeEvent.offsetY - y;
    fillColor ? ctxRef.current.fillRect(x, y, width, height)
              : ctxRef.current.strokeRect(x, y, width, height);
  };
  
  const drawTriangle = (e) => {
    if (!ctxRef.current) return;
    ctxRef.current.putImageData(snapshot, 0, 0);
    const x = xPrevious, y = yPrevious;
    const xFinal = e.nativeEvent.offsetX, yFinal = e.nativeEvent.offsetY;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    ctxRef.current.lineTo(xFinal, yFinal);
    ctxRef.current.lineTo(2 * x - xFinal, yFinal);
    ctxRef.current.closePath();
    fillColor ? ctxRef.current.fill() : ctxRef.current.stroke();
  };
  
  const drawCircle = (e) => {
    if (!ctxRef.current) return;
    ctxRef.current.putImageData(snapshot, 0, 0);
    const x = xPrevious, y = yPrevious;
    const radius = Math.sqrt(Math.pow(e.nativeEvent.offsetX - x, 2) + Math.pow(e.nativeEvent.offsetY - y, 2));
    ctxRef.current.beginPath();
    ctxRef.current.arc(x, y, radius, 0, Math.PI * 2);
    ctxRef.current.closePath();
    fillColor ? ctxRef.current.fill() : ctxRef.current.stroke();
  };
  
  // Inicia o desenho (apenas se estiver em modo edição)
  const startDrawing = (e) => {
    if (!drawingEnabled) return;
    
    const pointerEvent = e.nativeEvent;
    
    // Para dispositivos com stylus, verifica se há pressão aplicada
    // Se for um evento de stylus/pen e não houver pressão, não inicia o desenho
    if (pointerEvent.pointerType === 'pen') {
      // Verifica se há pressão (pressure > 0)
      // pressure pode ser 0 quando a caneta está apenas pairando sobre a tela (hover)
      // Se pressure não estiver disponível, usa buttons como fallback
      const hasPressure = typeof pointerEvent.pressure !== 'undefined' 
        ? pointerEvent.pressure > 0 
        : pointerEvent.buttons > 0;
      
      if (!hasPressure) {
        return; // Caneta não está pressionada, não inicia desenho
      }
    }
    
    // Para touch, verifica se é um toque válido (buttons > 0 indica pressão)
    if (pointerEvent.pointerType === 'touch') {
      if (pointerEvent.buttons === 0) {
        return; // Toque sem pressão, não inicia desenho
      }
    }
    
    setIsDrawing(true);
    setXPrevious(pointerEvent.offsetX);
    setYPrevious(pointerEvent.offsetY);
    
    // Captura o snapshot atual (que já deve ter o fundo + desenhos anteriores)
    setSnapshot(ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
    
    // Inicia um novo caminho para o desenho
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(pointerEvent.offsetX, pointerEvent.offsetY);
  };
  
  // Função para desenhar durante o movimento do ponteiro
  const draw = (e) => {
    if (!isDrawing || !drawingEnabled || !snapshot) return;
    
    const pointerEvent = e.nativeEvent;
    
    // Para dispositivos com stylus, verifica se há pressão aplicada
    // Se for um evento de stylus/pen e não houver pressão, não desenha
    if (pointerEvent.pointerType === 'pen') {
      // Verifica se há pressão (pressure > 0)
      // pressure pode ser 0 quando a caneta está apenas pairando sobre a tela (hover)
      // Se pressure não estiver disponível, usa buttons como fallback
      const hasPressure = typeof pointerEvent.pressure !== 'undefined' 
        ? pointerEvent.pressure > 0 
        : pointerEvent.buttons > 0;
      
      if (!hasPressure) {
        return; // Caneta não está pressionada, não desenha
      }
    }
    
    // Para touch, verifica se é um toque válido (buttons > 0 indica pressão)
    if (pointerEvent.pointerType === 'touch') {
      if (pointerEvent.buttons === 0) {
        return; // Toque sem pressão, não desenha
      }
    }
    
    // Restaura o snapshot (fundo + desenhos anteriores)
    ctxRef.current.putImageData(snapshot, 0, 0);
    
    if (selectedTool === 'brush') {
      // Modo normal: desenha por cima
      ctxRef.current.globalCompositeOperation = 'source-over';
      ctxRef.current.lineTo(pointerEvent.offsetX, pointerEvent.offsetY);
      ctxRef.current.stroke();
    } else if (selectedTool === 'eraser') {
      // Restaura o snapshot primeiro
      ctxRef.current.putImageData(snapshot, 0, 0);
      
      // Usa destination-out para apagar apenas onde a borracha passa
      ctxRef.current.globalCompositeOperation = 'destination-out';
      ctxRef.current.strokeStyle = 'rgba(0,0,0,1)'; // Cor opaca para garantir que apague
      ctxRef.current.lineTo(pointerEvent.offsetX, pointerEvent.offsetY);
      ctxRef.current.stroke();
      
      // Imediatamente após apagar, redesenha o fundo do odontograma por baixo
      // Isso garante que o fundo sempre fique visível em tempo real
      const canvas = canvasRef.current;
      if (odontogramImageRef.current) {
        ctxRef.current.save();
        ctxRef.current.globalCompositeOperation = 'destination-over';
        ctxRef.current.drawImage(odontogramImageRef.current, 0, 0, canvas.width, canvas.height);
        ctxRef.current.restore();
      }
      
      // Restaura o modo normal
      ctxRef.current.globalCompositeOperation = 'source-over';
      ctxRef.current.strokeStyle = color; // Restaura a cor original
    } else if (selectedTool === 'rectangle') {
      ctxRef.current.globalCompositeOperation = 'source-over';
      drawRectangle(e);
    } else if (selectedTool === 'triangle') {
      ctxRef.current.globalCompositeOperation = 'source-over';
      drawTriangle(e);
    } else if (selectedTool === 'circle') {
      ctxRef.current.globalCompositeOperation = 'source-over';
      drawCircle(e);
    }
  };
  
  // Ao parar de desenhar, fecha o traço e adiciona o snapshot atual ao undoStack
  const stopDrawing = () => {
    if (!drawingEnabled) return;
    setIsDrawing(false);
    ctxRef.current.closePath();
    const canvas = canvasRef.current;
    const snapshotData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
    console.log("Base snapshot:",snapshotData);
    console.log("Data array:", snapshotData.data); // Exibe o array de pixels
    const data = snapshotData.data; // É um Uint8ClampedArray
    const allZeros = Array.from(data).every(value => value === 0);
    console.log("Todos os valores são 0?", allZeros);

    setUndoStack(prev => [...prev, snapshotData]);
  };
  
  // Limpa o canvas (apaga somente os desenhos da edição atual) e redesenha o background do odontograma
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    // Sempre redesenha o fundo do odontograma
    drawOdontogramBackground(ctxRef.current, canvas);
  };
  
  // Função Undo: remove o último snapshot e restaura o anterior
  const handleUndo = () => {
    if (undoStack.length > 1) {
      setUndoStack(prev => {
        const newStack = prev.slice(0, prev.length - 1);
        const lastSnapshot = newStack[newStack.length - 1];
        ctxRef.current.putImageData(lastSnapshot, 0, 0);
        return newStack;
      });
    }
  };
  
  // Alterna entre editar e salvar:
  // Em "Salvar", captura o canvas e adiciona a imagem aos salvos;
  // Em "Editar", se houver imagem salva, define-a como fundo e habilita desenho.
  // Na parte de alternância entre editar e salvar:
const handleEditSaveToggle = () => {
  if (drawingEnabled) {
    // Modo salvar: captura o canvas atual e salva ou atualiza
    const imageData = canvasRef.current.toDataURL('image/png');
    
    // Marca que está salvando para evitar que o useEffect interfira
    isSavingRef.current = true;
    
    // Desabilita o modo de edição imediatamente para evitar edições durante o salvamento
    setDrawingEnabled(false);
    // NÃO limpa o canvas - mantém a imagem editada visível

    // Se estamos editando uma imagem existente, atualiza ela
    if (editingImageTimestamp && savedImages.length > 0) {
      // Atualiza a imagem existente
      fetch(`${API_URL}/update_image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          cpf, 
          image: imageData, 
          timestamp_iso: editingImageTimestamp 
        })
      })
        .then(response => response.json())
        .then(data => {
          console.log("Imagem atualizada no backend com sucesso:", data);
          
          // Aguarda um pouco para garantir que o arquivo foi escrito no disco
          setTimeout(() => {
            // Busca as imagens atualizadas do backend
            fetch(`${API_URL}/get_images?cpf=${cpf}`)
              .then(response => response.json())
              .then(backendData => {
                if (backendData && backendData.images && backendData.images.length > 0) {
                  // Ordena as imagens das mais recentes para as mais antigas
                  const sortedImages = sortImagesByDate(backendData.images);
                  // Atualiza a lista de imagens salvas
                  setSavedImages(sortedImages);
                  
                  // Encontra o índice da imagem atualizada
                  const updatedIndex = sortedImages.findIndex(
                    img => img.timestamp_iso === editingImageTimestamp
                  );
                  if (updatedIndex >= 0) {
                    setCurrentImageIndex(updatedIndex);
                  }
                  
                  // Carrega a imagem atualizada no canvas
                  const canvas = canvasRef.current;
                  const ctx = ctxRef.current;
                  let imageLoaded = false;
                  
                  // Função para atualizar a galeria após processar tudo
                  const updateGallery = () => {
                    if (!imageLoaded) {
                      imageLoaded = true;
                      setTimeout(() => {
                        if (onImagesChange) {
                          onImagesChange();
                        }
                      }, 200);
                    }
                  };
                  
                  if (canvas && ctx) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    const imageToLoad = updatedIndex >= 0 
                      ? sortedImages[updatedIndex].image 
                      : sortedImages[0].image;
                    img.src = imageToLoad;
                    img.onload = () => {
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      // Se houver imagem externa como fundo, mantém ela; senão usa odontograma
                      if (externalImageRef.current && externalImageDrawInfo.current) {
                        // Desenha fundo branco + imagem externa
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        const { drawX, drawY, drawWidth, drawHeight } = externalImageDrawInfo.current;
                        ctx.drawImage(externalImageRef.current, drawX, drawY, drawWidth, drawHeight);
                      } else {
                        // Desenha o odontograma
                        drawOdontogramBackground(ctx, canvas);
                      }
                      // Depois desenha a imagem salva por cima
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      // Libera a flag de salvamento após carregar a imagem
                      isSavingRef.current = false;
                      setEditingImageTimestamp(null); // Limpa o estado de edição
                      updateGallery();
                    };
                    img.onerror = () => {
                      // Se houver erro ao carregar a imagem, ainda assim atualiza a galeria
                      isSavingRef.current = false;
                      setEditingImageTimestamp(null);
                      updateGallery();
                    };
                  } else {
                    // Se não houver canvas, ainda assim atualiza a galeria
                    isSavingRef.current = false;
                    setEditingImageTimestamp(null);
                    updateGallery();
                  }
                  
                  // Atualiza o localStorage também
                  localStorage.setItem(`paint_${cpf}`, JSON.stringify(sortedImages));
                } else {
                  isSavingRef.current = false;
                  setEditingImageTimestamp(null);
                }
              })
              .catch(err => {
                console.error("Erro ao buscar imagens atualizadas:", err);
                isSavingRef.current = false;
                setEditingImageTimestamp(null);
              });
          }, 800); // Aumenta o tempo de espera para garantir que o arquivo foi salvo
        })
        .catch(error => {
          console.error("Erro ao atualizar imagem no backend:", error);
          // Em caso de erro, reabilita o modo de edição
          isSavingRef.current = false;
          setDrawingEnabled(true);
        });
    } else {
      // Cria uma nova imagem
      const timestamp = new Date().toISOString();
      fetch(`${API_URL}/save_image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf, image: imageData, timestamp })
      })
        .then(response => response.json())
        .then(data => {
          console.log("Imagem salva no backend com sucesso:", data);
          
          // Aguarda um pouco para garantir que o arquivo foi escrito no disco
          setTimeout(() => {
            // Busca as imagens atualizadas do backend
            fetch(`${API_URL}/get_images?cpf=${cpf}`)
              .then(response => response.json())
              .then(backendData => {
                if (backendData && backendData.images && backendData.images.length > 0) {
                  // Ordena as imagens das mais recentes para as mais antigas
                  const sortedImages = sortImagesByDate(backendData.images);
                  // Atualiza a lista de imagens salvas
                  setSavedImages(sortedImages);
                  // Define o índice para a imagem mais recente (primeira do array ordenado)
                  setCurrentImageIndex(0);
                  
                  // Carrega a imagem mais recente do backend no canvas
                  const canvas = canvasRef.current;
                  const ctx = ctxRef.current;
                  let imageLoaded = false;
                  
                  // Função para atualizar a galeria após processar tudo
                  const updateGallery = () => {
                    if (!imageLoaded) {
                      imageLoaded = true;
                      setTimeout(() => {
                        if (onImagesChange) {
                          onImagesChange();
                        }
                      }, 200);
                    }
                  };
                  
                  if (canvas && ctx) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = sortedImages[0].image;
                    img.onload = () => {
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      // Se houver imagem externa como fundo, mantém ela; senão usa odontograma
                      if (externalImageRef.current && externalImageDrawInfo.current) {
                        // Desenha fundo branco + imagem externa
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        const { drawX, drawY, drawWidth, drawHeight } = externalImageDrawInfo.current;
                        ctx.drawImage(externalImageRef.current, drawX, drawY, drawWidth, drawHeight);
                      } else {
                        // Desenha o odontograma
                        drawOdontogramBackground(ctx, canvas);
                      }
                      // Depois desenha a imagem salva por cima
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      // Libera a flag de salvamento após carregar a imagem
                      isSavingRef.current = false;
                      updateGallery();
                    };
                    img.onerror = () => {
                      // Se houver erro ao carregar a imagem, ainda assim atualiza a galeria
                      isSavingRef.current = false;
                      updateGallery();
                    };
                  } else {
                    // Se não houver canvas, ainda assim atualiza a galeria
                    isSavingRef.current = false;
                    updateGallery();
                  }
                  
                  // Atualiza o localStorage também
                  localStorage.setItem(`paint_${cpf}`, JSON.stringify(sortedImages));
                } else {
                  isSavingRef.current = false;
                }
              })
              .catch(err => {
                console.error("Erro ao buscar imagens atualizadas:", err);
                isSavingRef.current = false;
              });
          }, 800); // Aumenta o tempo de espera para garantir que o arquivo foi salvo
        })
        .catch(error => {
          console.error("Erro ao salvar imagem no backend:", error);
          // Em caso de erro, reabilita o modo de edição
          isSavingRef.current = false;
          setDrawingEnabled(true);
        });
    }
  } else {
    // Modo editar: carrega a imagem selecionada (currentImageIndex) para edição
    // NÃO limpa a referência da imagem externa aqui - ela deve ser mantida como fundo
    // A referência só será limpa quando o usuário carregar uma nova imagem ou usar "Criar"
    
    if (savedImages.length > 0 && currentImageIndex >= 0 && currentImageIndex < savedImages.length) {
      // Usa a imagem selecionada (currentImageIndex) para editar
      const selectedImage = savedImages[currentImageIndex];
      setEditingImageTimestamp(selectedImage.timestamp_iso); // Marca que estamos editando esta imagem
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Desenha a imagem salva diretamente (ela já contém tudo: fundo + imagem + desenhos)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Captura o snapshot como base da undoStack (contém a imagem completa)
        const baseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([baseSnapshot]);
      };
      img.src = selectedImage.image;
    } else if (shouldLoadDefault || !backgroundImage) {
      // Se não houver imagens salvas, carrega apenas o odontograma como fundo
      setEditingImageTimestamp(null); // Não estamos editando uma imagem existente
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        drawOdontogramBackground(ctx, canvas);
        const baseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([baseSnapshot]);
        setBackgroundImage('/icons/odontograma-anatomico-2.jpg');
      }
    } else {
      // Se não houver background definido, carrega o odontograma
      setEditingImageTimestamp(null);
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        drawOdontogramBackground(ctx, canvas);
        const baseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([baseSnapshot]);
      }
    }
    setDrawingEnabled(true);
  }
};

  
  // Navegação entre imagens salvas
  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      // Desabilita o modo de edição para visualizar a imagem anterior
      setDrawingEnabled(false);
      setEditingImageTimestamp(null);
      setCurrentImageIndex(prev => prev - 1);
    }
  };
  
  const handleNext = () => {
    if (currentImageIndex < savedImages.length - 1) {
      // Desabilita o modo de edição para visualizar a próxima imagem
      setDrawingEnabled(false);
      setEditingImageTimestamp(null);
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  // Função para criar uma nova imagem baseada na selecionada
  const handleCreate = () => {
    // Limpa a referência da imagem externa ao criar nova imagem
    externalImageRef.current = null;
    externalImageDrawInfo.current = null;
    
    if (savedImages.length > 0 && currentImageIndex >= 0 && currentImageIndex < savedImages.length) {
      // Carrega a imagem selecionada como base
      const selectedImage = savedImages[currentImageIndex];
      setEditingImageTimestamp(null); // Não estamos editando, estamos criando uma nova
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Desenha a imagem selecionada diretamente (ela já contém tudo)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Captura snapshot como base da undoStack
        const baseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([baseSnapshot]);
        // Habilita o modo de edição
        setDrawingEnabled(true);
      };
      img.src = selectedImage.image;
    } else {
      // Se não houver imagem selecionada, carrega apenas o odontograma
      setEditingImageTimestamp(null);
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        drawOdontogramBackground(ctx, canvas);
        const baseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([baseSnapshot]);
        setDrawingEnabled(true);
      }
    }
  };
  
  return (
    <div className={styles.maincontainer}>
      <div className={styles.container}>
        <section className={styles.tools}>
          <div className={styles.row}>
            <label className={styles.title}>Shapes</label>
            <ul className={styles.options}>
              <li className={`${styles.option} ${styles.tool}`} id="circle">
                <img src="/icons/circle.svg" alt="Circle Icon" />
                <span>Circle</span>
              </li>
              <li className={`${styles.option} ${styles.tool}`} id="rectangle">
                <img src="/icons/rectangle.svg" alt="Rectangle Icon" />
                <span>Rectangle</span>
              </li>
              <li className={`${styles.option} ${styles.tool}`} id="triangle">
                <img src="/icons/triangle.svg" alt="Triangle Icon" />
                <span>Triangle</span>
              </li>
              <li className={styles.option}>
                <input type="checkbox" id="fill-color" onChange={handleFillChange} />
                <label htmlFor="fill-color">Fill color</label>
              </li>
            </ul>
          </div>
          <div className={styles.row}>
            <label className={styles.title}>Options</label>
            <ul className={styles.options}>
              <li className={`${styles.option} ${styles.active} ${styles.tool}`} id="brush">
                <img src="/icons/brush.svg" alt="Brush Icon" />
                <span>Brush</span>
              </li>
              <li className={`${styles.option} ${styles.tool}`} id="eraser">
                <img src="/icons/eraser.svg" alt="Eraser Icon" />
                <span>Eraser</span>
              </li>
              <li className={styles.option}>
                <input
                  type="range"
                  id="size-slider"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(e.target.value)}
                />
              </li>
            </ul>
          </div>
          <div className={`${styles.row} ${styles.colors}`}>
            <label className={styles.title}>Colors</label>
            <ul className={styles.options}>
              <li className={styles.option}></li>
              <li className={`${styles.option} ${styles.selected}`}></li>
              <li className={styles.option}></li>
              <li className={styles.option}></li>
              <li className={styles.option} style={{ backgroundColor: color }}>
                <input
                  type="color"
                  className={styles.colorpicker}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </li>
            </ul>
          </div>
          <div className={`${styles.row} ${styles.buttons}`}>
            <button className={styles.clearcanvas} onClick={clearCanvas}>
              Clear Canvas
            </button>
            <button className={styles.toggleEditSave} onClick={handleEditSaveToggle}>
              {drawingEnabled ? "Salvar" : "Editar"}
            </button>
            <button 
              className={styles.createButton} 
              onClick={handleCreate}
              disabled={drawingEnabled || savedImages.length === 0}
            >
              Criar
            </button>
            <button className={styles.undoButton} onClick={handleUndo} disabled={!drawingEnabled || undoStack.length <= 1}>
              Undo
            </button>
            <label className={styles.uploadButton}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBackgroundChange}
                style={{ display: 'none' }}
              />
              Carregar Imagem
            </label>
          </div>
        </section>
        <section className={styles.drawingboard}>
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
            style={{ 
              pointerEvents: drawingEnabled ? 'auto' : 'none',
              touchAction: 'none' // Previne comportamentos padrão de toque
            }}
          ></canvas>
          <div className={styles.controlsBelow}>
            <button
              className={styles.navButton}
              onClick={handlePrevious}
              disabled={currentImageIndex === 0 || savedImages.length === 0}
            >
              ◀
            </button>
            <div className={styles.timestamp}>
              {savedImages.length > 0
                ? (savedImages[currentImageIndex].timestamp)
                : "Sem imagem"}
            </div>
            <button
              className={styles.navButton}
              onClick={handleNext}
              disabled={currentImageIndex === savedImages.length - 1 || savedImages.length === 0}
            >
              ▶
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Paint;
