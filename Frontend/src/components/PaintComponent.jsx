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
  
  // Controle de edição: true para habilitar desenho
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  
  // Imagens salvas e índice da imagem atual
  const [savedImages, setSavedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Pilha de snapshots para undo
  const [undoStack, setUndoStack] = useState([]);
  
  // Carrega imagens do localStorage usando o cpf
  useEffect(() => {
    if (cpf) {
      // Recupera imagens do backend
      fetch(`http://localhost:5000/get_images?cpf=${cpf}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.images) {
            setSavedImages(data.images);
            setCurrentImageIndex(data.images.length - 1);
          }
        })
        .catch(err => console.error("Erro ao carregar imagens do backend:", err));

      // Recupera imagens do localStorage (opcional, como fallback)
      const localData = localStorage.getItem(`paint_${cpf}`);
      if (localData) {
        try {
          const parsedImages = JSON.parse(localData);
          setSavedImages(parsedImages);
          setCurrentImageIndex(parsedImages.length - 1);
        } catch (e) {
          console.error("Erro ao carregar imagens salvas:", e);
        }
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
      img.src = backgroundImage;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [backgroundImage]);
  
  // Atualiza propriedades do contexto quando a cor ou a espessura mudam
  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.lineWidth = lineWidth;
      ctxRef.current.strokeStyle = color;
      ctxRef.current.fillStyle = color;
    }
  }, [color, lineWidth]);
  
  // Quando não estiver em modo edição, exibe a imagem salva atual
  useEffect(() => {
    if (!drawingEnabled && savedImages.length > 0) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const img = new Image();
      img.src = savedImages[currentImageIndex].image;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [drawingEnabled, savedImages, currentImageIndex]);
  
  
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
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setSnapshot(ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
  };
  
  // Função para desenhar durante o movimento do ponteiro
  const draw = (e) => {
    if (!isDrawing || !drawingEnabled) return;
    ctxRef.current.putImageData(snapshot, 0, 0);
    if (selectedTool === 'brush') {
      ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctxRef.current.stroke();
    } else if (selectedTool === 'eraser') {
      ctxRef.current.strokeStyle = '#FFFFFF';
      ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctxRef.current.stroke();
      ctxRef.current.strokeStyle = color;
    } else if (selectedTool === 'rectangle') {
      drawRectangle(e);
    } else if (selectedTool === 'triangle') {
      drawTriangle(e);
    } else if (selectedTool === 'circle') {
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
  
  // Limpa o canvas (apaga somente os desenhos da edição atual) e redesenha o background, se existir
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        ctxRef.current.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
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
    // Modo salvar: captura o canvas e envia para o backend, etc.
    const imageData = canvasRef.current.toDataURL('image/png');
    const timestamp = new Date().toISOString();
    const newImage = { image: imageData, timestamp };
    const updatedImages = [...savedImages, newImage];
    setSavedImages(updatedImages);
    localStorage.setItem(`paint_${cpf}`, JSON.stringify(updatedImages));
    setCurrentImageIndex(updatedImages.length - 1);
    setDrawingEnabled(false);

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
      })
      .catch(error => {
        console.error("Erro ao salvar imagem no backend:", error);
      });
  } else {
    // Modo editar: se houver imagem salva, define o background
    if (savedImages.length > 0) {
      // Em vez de apenas setBackgroundImage, vamos carregar a imagem e desenhá-la no canvas.
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Agora que o background foi desenhado, capture essa snapshot como base da undoStack.
        const baseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([baseSnapshot]);
      };
      // Use a imagem salva como background
      img.src = savedImages[currentImageIndex].image;
    } else {
      // Se não houver background definido, captura o snapshot atual (pode ser em branco)
      const canvas = canvasRef.current;
      const baseSnapshot = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
      setUndoStack([baseSnapshot]);
    }
    setDrawingEnabled(true);
  }
};

  
  // Navegação entre imagens salvas
  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };
  
  const handleNext = () => {
    if (currentImageIndex < savedImages.length - 1) {
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
              disabled={drawingEnabled || currentImageIndex === 0 || savedImages.length === 0}
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
              disabled={drawingEnabled || currentImageIndex === savedImages.length - 1 || savedImages.length === 0}
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
