import React, { useRef, useEffect, useState } from 'react';
import styles from './Paint.module.css';

const Paint = () => {

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState("brush");
  const [xPrevious, setXPrevious] = useState(null);
  const [yPrevious, setYPrevious] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [fillColor, setFillColor] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [backgroundImage, setBackgroundImage] = useState(null);



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


  useEffect(() => {
    const toolBtns = document.querySelectorAll(`.${styles.colors} .${styles.option}`);
     const colorPicker = document.querySelector(`.${styles.colorpicker}`);
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelector(`.${styles.option}.${styles.selected}`).classList.remove(styles.selected);
        btn.classList.add(styles.selected);

        setColor(window.getComputedStyle(btn).getPropertyValue('background-color'));
      });
    });

    return () => {
      toolBtns.forEach(btn => {
        btn.removeEventListener('click', () => {});
      });
    };
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctxRef.current = ctx;


    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [backgroundImage]);

  useEffect(() => {
    ctxRef.current.lineWidth = lineWidth;
    ctxRef.current.strokeStyle = color;
    ctxRef.current.fillStyle = color;
  }, [color, lineWidth]);

  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFillChange = (e) => {
    setFillColor(e.target.checked);
  };

  const drawRectangle = (e) => {
    if (!ctxRef.current) return;

    const x = xPrevious;
    const y = yPrevious;
    const width =  e.nativeEvent.offsetX - x ;
    const height = e.nativeEvent.offsetY - y ;

    //ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Limpa o canvas antes de desenhar
    if (fillColor) {
      ctxRef.current.fillRect(x, y, width, height);
    } else {
      ctxRef.current.strokeRect(x, y, width, height);
    }
  };

  const drawTriangle = (e) => {
    if (!ctxRef.current) return;
    ctxRef.current.putImageData(snapshot, 0, 0);

    const x = xPrevious;
    const y = yPrevious;
    const xFinal = e.nativeEvent.offsetX;
    const yFinal = e.nativeEvent.offsetY;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    ctxRef.current.lineTo(xFinal, yFinal);
    ctxRef.current.lineTo(2 * x - xFinal, yFinal);
    ctxRef.current.closePath();

    if (fillColor) {
      ctxRef.current.fill();
    } else {
      ctxRef.current.stroke();
    }
  };

  const drawCircle = (e) => {
    if (!ctxRef.current) return;
    ctxRef.current.putImageData(snapshot, 0, 0);

    const x = xPrevious;
    const y = yPrevious;
    const radius = Math.sqrt(
      Math.pow(e.nativeEvent.offsetX - x, 2) + Math.pow(e.nativeEvent.offsetY - y, 2)
    );

    ctxRef.current.beginPath();
    ctxRef.current.arc(x, y, radius, 0, Math.PI * 2);
    ctxRef.current.closePath();

    if (fillColor) {
      ctxRef.current.fill();
    } else {
      ctxRef.current.stroke();
    }
  };


  const startDrawing = (e) => {
    setIsDrawing(true);
    setXPrevious(e.nativeEvent.offsetX);
    setYPrevious(e.nativeEvent.offsetY);

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setSnapshot(ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
  };

  const draw = (e) => {
    if (!isDrawing) return;

    ctxRef.current.putImageData(snapshot, 0, 0);

    if (selectedTool === 'brush') {
      ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctxRef.current.stroke();
    }

    else if (selectedTool === 'eraser') {
      ctxRef.current.strokeStyle = '#FFFFFF';
      ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctxRef.current.stroke();
    }

    else if (selectedTool === 'rectangle') {

      drawRectangle(e);
    }

    else if (selectedTool === 'triangle') {
      console.log('triangle');
      drawTriangle(e);

    }

    else if (selectedTool === 'circle') {
      drawCircle(e);
      console.log('circle');
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctxRef.current.closePath();
  };

  const clearCanvas = () => {
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveImage = () => {
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = 'drawing.png';
    link.click();
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
              <span>Círculo</span>
            </li>
            <li className={`${styles.option} ${styles.tool}`} id="rectangle">
              <img src="/icons/rectangle.svg" alt="Rectangle Icon" />
              <span>Retângulo</span>
            </li>
            <li className={`${styles.option} ${styles.tool}`} id="triangle">
              <img src="/icons/triangle.svg" alt="Triangle Icon" />
              <span>Triângulo</span>
            </li>
            <li className={styles.option}>
              <input type="checkbox" id="fill-color" onChange={handleFillChange}/>
              <label htmlFor="fill-color">Fill color</label>
            </li>
          </ul>
        </div>
        <div className={styles.row}>
          <label className={styles.title}>Options</label>
          <ul className={styles.options}>
            <li className={`${styles.option} ${styles.active} ${styles.tool}`} id="brush">
              <img src="/icons/brush.svg" alt="brush Icon" />
              <span>Pincel</span>
            </li>
            <li className= {`${styles.option} ${styles.tool}`} id="eraser">
              <img src="/icons/eraser.svg" alt="eraser Icon" />
              <span>Borracha</span>
            </li>
            <li className={styles.option}>
              <input type="range" id="size-slider" 
              min="1" 
              max="20" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(e.target.value)} />
            </li>
          </ul>
        </div>

        <div className={`${styles.row} ${styles.colors}`}>
          <label className={styles.title}>Cores</label>
          <ul className={styles.options}>
            <li className={styles.option}> </li>
            <li className={`${styles.option} ${styles.selected}`}> </li>
            <li className={styles.option}> </li>
            <li className={styles.option}> </li>
            <li className={styles.option}> 
              <input type="color" className={styles.colorpicker} value={color}  onChange={(e) => setColor(e.target.value)} />
            </li>
            
          </ul>
        </div>
        
        <div className={`${styles.row} ${styles.buttons}`}>
          <button className={styles.clearcanvas} onClick={clearCanvas} >Limpar Tela</button>
          <button className={styles.saveimg}  onClick={saveImage} >Salvar Imagem</button>
          <input type="file" accept="image/*" onChange={handleBackgroundChange} />
  
        </div>
        
      </section>
      <section className={styles.drawingboard}> 
        <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        //onMouseLeave={stopDrawing}
        ></canvas>
      </section>
    </div>
    </div>
  );
};

export default Paint;
