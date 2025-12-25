import React, { useRef, useEffect, useState } from 'react';
import styles from './Paint.module.css';

const Paint = ({ cpf }) => {

  
  // Estados de desenho e configuração
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState("brush");
  const [xPrevious, setXPrevious] = useState(null);
  const [yPrevious, setYPrevious] = useState(null);
  const [fillColor, setFillColor] = useState(false);

  
  // Controle de edição: true para habilitar desenho
  
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
  
  // // Configuração inicial do canvas (usa dimensões definidas no CSS)
  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   canvas.width = canvas.offsetWidth;
  //   canvas.height = canvas.offsetHeight;
  //   const ctx = canvas.getContext('2d');
  //   ctx.lineWidth = lineWidth;
  //   ctx.lineCap = 'round';
  //   ctx.strokeStyle = color;
  //   ctx.fillStyle = color;
  //   ctxRef.current = ctx;
  //   // Se houver background, desenha-o
    
  // }, []);
  
  // // Atualiza propriedades do contexto quando a cor ou a espessura mudam
  // useEffect(() => {
  //   if (ctxRef.current) {
  //     ctxRef.current.lineWidth = lineWidth;
  //     ctxRef.current.strokeStyle = color;
  //     ctxRef.current.fillStyle = color;
  //   }
  // }, [color, lineWidth]);
  
  
  const handleFillChange = (e) => setFillColor(e.target.checked);
  
  // // Funções para desenhar formas
  // const drawRectangle = (e) => {
  //   if (!ctxRef.current) return;
  //   const x = xPrevious, y = yPrevious;
  //   const width = e.nativeEvent.offsetX - x;
  //   const height = e.nativeEvent.offsetY - y;
  //   fillColor ? ctxRef.current.fillRect(x, y, width, height)
  //             : ctxRef.current.strokeRect(x, y, width, height);
  // };
  
  // const drawTriangle = (e) => {
  //   if (!ctxRef.current) return;
  //   ctxRef.current.putImageData(snapshot, 0, 0);
  //   const x = xPrevious, y = yPrevious;
  //   const xFinal = e.nativeEvent.offsetX, yFinal = e.nativeEvent.offsetY;
  //   ctxRef.current.beginPath();
  //   ctxRef.current.moveTo(x, y);
  //   ctxRef.current.lineTo(xFinal, yFinal);
  //   ctxRef.current.lineTo(2 * x - xFinal, yFinal);
  //   ctxRef.current.closePath();
  //   fillColor ? ctxRef.current.fill() : ctxRef.current.stroke();
  // };
  
  // const drawCircle = (e) => {
  //   if (!ctxRef.current) return;
  //   const x = xPrevious, y = yPrevious;
  //   const radius = Math.sqrt(Math.pow(e.nativeEvent.offsetX - x, 2) + Math.pow(e.nativeEvent.offsetY - y, 2));
  //   ctxRef.current.beginPath();
  //   ctxRef.current.arc(x, y, radius, 0, Math.PI * 2);
  //   ctxRef.current.closePath();
  //   fillColor ? ctxRef.current.fill() : ctxRef.current.stroke();
  // };
  
  
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawingEnabled, setDrawingEnabled] = useState(true);
  const [color, setColor] = useState("#ff0000");
  const [lineWidth, setLineWidth] = useState(5);

  let px = NaN;
  let py = NaN;

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.scrollWidth;
    canvas.height = canvas.scrollHeight;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctxRef.current = ctx;
  }, []);

  const getCanvasCoordinates = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const draw = (x, y, pressure) => {
    if (!isNaN(px) && !isNaN(py)) {
      drawLine(px, py, x, y, pressure);
    }
    px = x;
    py = y;
  };

  const drawLine = (x1, y1, x2, y2, pressure) => {
    if (!ctxRef.current) return;
    ctxRef.current.beginPath();
    ctxRef.current.lineWidth = lineWidth * pressure;
    ctxRef.current.strokeStyle = color;
    ctxRef.current.moveTo(x1, y1);
    ctxRef.current.lineTo(x2, y2);
    ctxRef.current.stroke();
  };

  const handlePointerMove = (event) => {
    if (!drawingEnabled) return;
    if (event.pressure > 0) {
      const { x, y } = getCanvasCoordinates(event);
      draw(x, y, event.pressure);
    } else {
      px = NaN;
      py = NaN;
    }
  };

  const clearCanvas = () => {
    if (!ctxRef.current || !canvasRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  
 
  return (
    <div className={styles.maincontainer}>
      <div className={styles.container}>
        <section className={styles.tools}>
          <div className={styles.row}>
            <label className={styles.title}>Formas</label>
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
            <button className={styles.toggleEditSave} >
              Save
            </button>

          </div>
        </section>
        <section className={styles.drawingboard}>
          <canvas ref={canvasRef} onPointerMove={handlePointerMove}></canvas>
        </section>
      </div>
    </div>
  );
};

export default Paint;
