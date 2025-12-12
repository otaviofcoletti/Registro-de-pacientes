import React, { useRef, useEffect, useState } from 'react';
import styles from './PaintComponent.module.css';

const Paint = ({ cpf }) => {
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
  
  // Pilha de snapshots para undo
  const [undoStack, setUndoStack] = useState([]);
  
  // Estado para controlar se deve carregar a imagem padrão
  const [shouldLoadDefault, setShouldLoadDefault] = useState(false);
  
  // Flag para evitar que o useEffect interfira durante o salvamento
  const isSavingRef = useRef(false);
  
  // Referência para a imagem do odontograma (fundo permanente)
  const odontogramImageRef = useRef(null);
  
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
  
  // Carrega imagens do localStorage usando o cpf
  useEffect(() => {
    if (cpf) {
      // Recupera imagens do backend
      fetch(`http://localhost:5000/get_images?cpf=${cpf}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.images && data.images.length > 0) {
            setSavedImages(data.images);
            // Sempre mostra a imagem mais recente (última do array)
            setCurrentImageIndex(data.images.length - 1);
            setShouldLoadDefault(false);
          } else {
            // Se não houver imagens, marca para carregar a imagem padrão
            setShouldLoadDefault(true);
          }
        })
        .catch(err => {
          console.error("Erro ao carregar imagens do backend:", err);
          // Em caso de erro, marca para carregar a imagem padrão
          setShouldLoadDefault(true);
        });

      // Recupera imagens do localStorage (opcional, como fallback)
      const localData = localStorage.getItem(`paint_${cpf}`);
      if (localData) {
        try {
          const parsedImages = JSON.parse(localData);
          if (parsedImages && parsedImages.length > 0) {
            setSavedImages(parsedImages);
            // Sempre mostra a imagem mais recente
            setCurrentImageIndex(parsedImages.length - 1);
            setShouldLoadDefault(false);
          } else {
            setShouldLoadDefault(true);
          }
        } catch (e) {
          console.error("Erro ao carregar imagens salvas:", e);
          setShouldLoadDefault(true);
        }
      } else {
        // Se não houver dados no localStorage, marca para carregar a imagem padrão
        setShouldLoadDefault(true);
      }
    }
  }, [cpf]);
  
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
            // Primeiro desenha o fundo do odontograma
            drawOdontogramBackground(ctx, canvas);
            // Depois desenha a imagem salva por cima
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
  
  
  // Função para tratar mudança de background via upload
  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setBackgroundImage(event.target.result);
      reader.readAsDataURL(file);
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
    setIsDrawing(true);
    setXPrevious(e.nativeEvent.offsetX);
    setYPrevious(e.nativeEvent.offsetY);
    
    // Captura o snapshot atual (que já deve ter o fundo + desenhos anteriores)
    setSnapshot(ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
    
    // Inicia um novo caminho para o desenho
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };
  
  // Função para desenhar durante o movimento do ponteiro
  const draw = (e) => {
    if (!isDrawing || !drawingEnabled || !snapshot) return;
    
    // Restaura o snapshot (fundo + desenhos anteriores)
    ctxRef.current.putImageData(snapshot, 0, 0);
    
    if (selectedTool === 'brush') {
      // Modo normal: desenha por cima
      ctxRef.current.globalCompositeOperation = 'source-over';
      ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctxRef.current.stroke();
    } else if (selectedTool === 'eraser') {
      // Restaura o snapshot primeiro
      ctxRef.current.putImageData(snapshot, 0, 0);
      
      // Usa destination-out para apagar apenas onde a borracha passa
      ctxRef.current.globalCompositeOperation = 'destination-out';
      ctxRef.current.strokeStyle = 'rgba(0,0,0,1)'; // Cor opaca para garantir que apague
      ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
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
    // Modo salvar: captura o canvas atual e salva
    const imageData = canvasRef.current.toDataURL('image/png');
    const timestamp = new Date().toISOString();
    
    // Marca que está salvando para evitar que o useEffect interfira
    isSavingRef.current = true;
    
    // Desabilita o modo de edição imediatamente para evitar edições durante o salvamento
    setDrawingEnabled(false);
    // NÃO limpa o canvas - mantém a imagem editada visível

    // Chamada à rota do backend para salvar a imagem
    fetch('http://localhost:5000/save_image', {
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
          fetch(`http://localhost:5000/get_images?cpf=${cpf}`)
            .then(response => response.json())
            .then(backendData => {
              if (backendData && backendData.images && backendData.images.length > 0) {
                // Atualiza a lista de imagens salvas
                setSavedImages(backendData.images);
                // Define o índice para a imagem mais recente (última do array)
                const mostRecentIndex = backendData.images.length - 1;
                setCurrentImageIndex(mostRecentIndex);
                
                // Carrega a imagem mais recente do backend no canvas
                // Substitui suavemente a imagem atual pela nova do backend
                const canvas = canvasRef.current;
                const ctx = ctxRef.current;
                if (canvas && ctx) {
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  img.src = backendData.images[mostRecentIndex].image;
                  img.onload = () => {
                    // Primeiro desenha o fundo do odontograma
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawOdontogramBackground(ctx, canvas);
                    // Depois desenha a imagem salva por cima
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    // Libera a flag de salvamento após carregar a imagem
                    isSavingRef.current = false;
                  };
                }
                
                // Atualiza o localStorage também
                localStorage.setItem(`paint_${cpf}`, JSON.stringify(backendData.images));
              } else {
                isSavingRef.current = false;
              }
            })
            .catch(err => {
              console.error("Erro ao buscar imagens atualizadas:", err);
              isSavingRef.current = false;
            });
        }, 500); // Aguarda 500ms para garantir que o arquivo foi salvo
      })
      .catch(error => {
        console.error("Erro ao salvar imagem no backend:", error);
        // Em caso de erro, reabilita o modo de edição
        isSavingRef.current = false;
        setDrawingEnabled(true);
      });
  } else {
    // Modo editar: sempre carrega a imagem mais recente para edição
    if (savedImages.length > 0) {
      // Sempre usa a imagem mais recente (última do array) para editar
      const mostRecentIndex = savedImages.length - 1;
      setCurrentImageIndex(mostRecentIndex);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Primeiro desenha o fundo do odontograma
        drawOdontogramBackground(ctx, canvas);
        // Depois desenha a imagem salva por cima
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Agora que o background foi desenhado, capture essa snapshot como base da undoStack.
        const baseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([baseSnapshot]);
      };
      // Use a imagem mais recente como background
      img.src = savedImages[mostRecentIndex].image;
    } else if (shouldLoadDefault || !backgroundImage) {
      // Se não houver imagens salvas, carrega apenas o odontograma como fundo
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
      setCurrentImageIndex(prev => prev - 1);
    }
  };
  
  const handleNext = () => {
    if (currentImageIndex < savedImages.length - 1) {
      // Desabilita o modo de edição para visualizar a próxima imagem
      setDrawingEnabled(false);
      setCurrentImageIndex(prev => prev + 1);
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
            <button className={styles.undoButton} onClick={handleUndo} disabled={!drawingEnabled || undoStack.length <= 1}>
              Undo
            </button>
            <input type="file" accept="image/*" onChange={handleBackgroundChange} />
          </div>
        </section>
        <section className={styles.drawingboard}>
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            style={{ pointerEvents: drawingEnabled ? 'auto' : 'none' }}
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
