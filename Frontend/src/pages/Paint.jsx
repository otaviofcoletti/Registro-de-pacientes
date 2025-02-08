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



  useEffect(() => {
    const toolBts = document.querySelectorAll(`.${styles.tool}`);
    
    toolBts.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBts.forEach(btn => btn.classList.remove(styles.active));
        btn.classList.add(styles.active);
        setSelectedTool(btn.id);
      });
    });

    return () => {
      toolBts.forEach(btn => {
        btn.removeEventListener('click', () => {});
      });
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctxRef.current = ctx;
  }, []);

  const drawRectangle = (e) => {
    if (!ctxRef.current) return;

    const x = xPrevious;
    const y = yPrevious;
    const width =  e.nativeEvent.offsetX - x ;
    const height = e.nativeEvent.offsetY - y ;

    //ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Limpa o canvas antes de desenhar
    ctxRef.current.strokeRect(x, y, width, height);
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
      ctxRef.current.strokeStyle = '#00000';
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

    }

    else if (selectedTool === 'circle') {
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

  return (
    <div className={styles.maincontainer}>
    <div className={styles.container}>
      <section className={styles.tools}>
        <div className={styles.row}>
          <label className={styles.title}>Shapes</label>
          <ul className={styles.options}>
            <li className={`${styles.option} ${styles.tool}`} id="circle">
              <img src="./src/icons/circle.svg" alt="Circle Icon" />
              <span>Circle</span>
            </li>
            <li className={`${styles.option} ${styles.tool}`} id="rectangle">
              <img src="./src/icons/rectangle.svg" alt="Rectangle Icon" />
              <span>Rectangle</span>
            </li>
            <li className={`${styles.option} ${styles.tool}`} id="triangle">
              <img src="./src/icons/triangle.svg" alt="Triangle Icon" />
              <span>Triangle</span>
            </li>
            <li className={styles.option}>
              <input type="checkbox" id="fill-color"/>
              <label htmlFor="fill-color">Fill color</label>
            </li>
          </ul>
        </div>
        <div className={styles.row}>
          <label className={styles.title}>Options</label>
          <ul className={styles.options}>
            <li className={`${styles.option} ${styles.active} ${styles.tool}`} id="brush">
              <img src="./src/icons/brush.svg" alt="brush Icon" />
              <span>Brush</span>
            </li>
            <li className= {`${styles.option} ${styles.tool}`} id="eraser">
              <img src="./src/icons/eraser.svg" alt="eraser Icon" />
              <span>Eraser</span>
            </li>
            <li className={styles.option}>
              <input type="range" id="size-slider"/>
            </li>
          </ul>
        </div>

        <div className={`${styles.row} ${styles.colors}`}>
          <label className={styles.title}>Colors</label>
          <ul className={styles.options}>
            <li className={styles.option}> </li>
            <li className={`${styles.option} ${styles.selected}`}> </li>
            <li className={styles.option}> </li>
            <li className={styles.option}> </li>
            <li className={styles.option}> 
              <input type="color" className={styles.colorpicker} value="#000000"/>
            </li>
            
          </ul>
        </div>
        
        <div className={`${styles.row} ${styles.buttons}`}>
          <button className={styles.clearcanvas} onClick={clearCanvas} >Clear Canvas</button>
          <button className={styles.saveimg}>Save Image</button>  
        </div>
        
      </section>
      <section className={styles.drawingboard}> 
        <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        //onMouseLeave={stopDrawing}
        ></canvas>
      </section>
    </div>
    </div>
  );
};

export default Paint;
