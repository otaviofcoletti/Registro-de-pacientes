// Button.js
import React from 'react';
import styles from './Button.module.css';

const Button = ({ text, color, onClick }) => {
  const buttonClass = `${styles.button} ${styles[color] || ''}`;

  return (
    <button className={buttonClass} onClick={onClick}>
      {text}
    </button>
  ); 
  
};

export default Button;