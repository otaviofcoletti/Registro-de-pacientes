import '../global.css';
import React from 'react';
import Button from '../components/Button';
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate('/cadastro');
  };

  const handleSearch = () => {
    navigate('/pacientes');
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <img src="/icons/logo.jpeg" alt="Logo Pró Odonto" className={styles.logo} />
      </div>
      <div className={styles.buttonContainer}>
        <Button text="Adicionar novo" onClick={handleAddNew} />
        <Button text="Buscar paciente" onClick={handleSearch} />
      </div>
    </div>
  )
}

export default Home
