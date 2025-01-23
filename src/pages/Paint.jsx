import React from 'react';
import styles from './Paint.module.css';

const Paint = () => {
  return (
    <div className={styles.container}>
      <section className={styles.tools}>
        <div className={styles.row}>
          <label className={styles.title}>Shapes</label>
          <ul className={styles.options}>
            <li className={styles.option}>
              <img src="./src/icons/circle.svg" alt="Circle Icon" />
              <span>Circle</span>
            </li>
            <li className={styles.option}>
              <img src="./src/icons/rectangle.svg" alt="Rectangle Icon" />
              <span>Rectangle</span>
            </li>
            <li className={styles.option}>
              <img src="./src/icons/triangle.svg" alt="Triangle Icon" />
              <span>Triangle</span>
            </li>
            <li className={styles.option}>
              <input type="checkbox" id="fill-color"/>
              <label for="fill-color">Fill color</label>
            </li>
          </ul>
        </div>
        <div className={styles.row}>
          <label className={styles.title}>Options</label>
          <ul className={styles.options}>
            <li className={styles.option}>
              <img src="./src/icons/brush.svg" alt="brush Icon" />
              <span>Brush</span>
            </li>
            <li className={styles.option}>
              <img src="./src/icons/eraser.svg" alt="eraser Icon" />
              <span>Eraser</span>
            </li>
            <li className={styles.option}>
              <input type="range" id="size-slider"/>
            </li>
          </ul>
        </div>
        <div className={styles.row}>
          <label className={styles.title}>Colors</label>
          <ul className={styles.options}>
            <li className={styles.option}> </li>
            
          </ul>
        </div>
        
      </section>
    </div>
  );
};

export default Paint;
