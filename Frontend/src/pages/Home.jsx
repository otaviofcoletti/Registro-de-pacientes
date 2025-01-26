import '../global.css';
import React from 'react';
import Button from '../components/Button';
import styles from './Home.module.css'; // Crie um novo arquivo App.module.css
import { useNavigate } from 'react-router-dom';
function Home() {

  const navigate = useNavigate(); // Instancia o hook useNavigate

  const handleAddNew = () => {
    navigate('/cadastro'); // Redireciona para a página de cadastro
  };

  const handleSearch = () => {
    navigate('/pacientes'); // Redireciona para a página de cadastro
  };

  return (
      <div className={styles.buttonContainer}>
        <Button text="Adicionar novo" onClick={handleAddNew} />
        <Button text="Buscar paciente" onClick={handleSearch} />
      </div>

  )
}

export default Home
